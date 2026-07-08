import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSurveys, saveSurveys, getVoteRecord, saveVoteRecord } from '../utils/storage';
import { generateId, MAX_VOTE_CHANGES, isVotingOpen, getSurveyTimeStatus } from '../utils/helpers';

const SurveyContext = createContext(null);

const isLocalHost = () => {
  return typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
};

export const useSurveys = () => {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error('useSurveys must be used within SurveyProvider');
  return ctx;
};

export const SurveyProvider = ({ children }) => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasDbRef = useRef(false);

  const fetchSurveys = useCallback(async () => {
    try {
      const res = await fetch('/api/surveys');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.surveys)) {
          setSurveys(data.surveys);
          hasDbRef.current = Boolean(data.hasPostgres);
          saveSurveys(data.surveys);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to fetch surveys from Vercel API:', err);
    }

    if (isLocalHost()) {
      console.warn("Vercel Serverless Function not found. Running in local fallback mode (using localStorage).");
      setSurveys(getSurveys());
    } else {
      console.error("Database connection failed. PostgreSQL is not connected or configured.");
      setSurveys([]);
    }
  }, []);

  useEffect(() => {
    fetchSurveys().finally(() => setLoading(false));
  }, [fetchSurveys]);

  // ── Admin Actions ──────────────────────────────────────────────────────────

  const createSurvey = useCallback(async (data) => {
    const survey = {
      id: generateId(),
      title: data.title,
      description: data.description || '',
      status: data.status || 'draft',
      createdAt: new Date().toISOString(),
      startDate: data.startDate || null,
      endDate:   data.endDate   || null,
      options: (data.options || []).map((label) => ({
        id: generateId(),
        label,
        votes: 0,
      })),
    };

    // Optimistic Update
    const updatedList = [...surveys, survey];
    setSurveys(updatedList);
    saveSurveys(updatedList);

    try {
      if (hasDbRef.current) {
        const res = await fetch('/api/surveys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(survey)
        });
        if (!res.ok) throw new Error('Postgres save failed');
      } else if (!isLocalHost()) {
        throw new Error('Database is offline');
      }
    } catch (err) {
      console.error('Failed to save created survey:', err);
    }

    return survey;
  }, [surveys]);

  const updateSurvey = useCallback(async (id, changes) => {
    let updatedSurvey = null;
    const updated = surveys.map((s) => {
      if (s.id !== id) return s;
      updatedSurvey = { ...s, ...changes };
      if (changes.options) {
        updatedSurvey.options = changes.options.map((o) => {
          if (o.id) {
            const existing = s.options.find((x) => x.id === o.id);
            return { ...o, votes: existing ? existing.votes : 0 };
          }
          return { id: generateId(), label: o.label, votes: 0 };
        });
      }
      if ('startDate' in changes) updatedSurvey.startDate = changes.startDate ?? null;
      if ('endDate'   in changes) updatedSurvey.endDate   = changes.endDate   ?? null;
      return updatedSurvey;
    });

    setSurveys(updated);
    saveSurveys(updated);

    try {
      if (hasDbRef.current && updatedSurvey) {
        const res = await fetch(`/api/surveys?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSurvey)
        });
        if (!res.ok) throw new Error('Postgres update failed');
      } else if (!isLocalHost()) {
        throw new Error('Database is offline');
      }
    } catch (err) {
      console.error('Failed to update survey:', err);
    }
  }, [surveys]);

  const deleteSurvey = useCallback(async (id) => {
    const updated = surveys.filter((s) => s.id !== id);
    setSurveys(updated);
    saveSurveys(updated);

    try {
      if (hasDbRef.current) {
        const res = await fetch(`/api/surveys?id=${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Postgres delete failed');
      } else if (!isLocalHost()) {
        throw new Error('Database is offline');
      }
    } catch (err) {
      console.error('Failed to delete survey:', err);
    }
  }, [surveys]);

  const publishSurvey = useCallback((id) => {
    updateSurvey(id, { status: 'active' });
  }, [updateSurvey]);

  const archiveSurvey = useCallback((id) => {
    updateSurvey(id, { status: 'archived' });
  }, [updateSurvey]);

  // ── User Voting ────────────────────────────────────────────────────────────

  const castVote = useCallback((surveyId, optionId) => {
    const survey = surveys.find((s) => s.id === surveyId);
    if (!survey) return { success: false, reason: 'not_found' };

    // Timeframe gate
    if (!isVotingOpen(survey)) {
      const ts = getSurveyTimeStatus(survey);
      return { success: false, reason: ts === 'not_started' ? 'not_started' : 'expired' };
    }

    const record = getVoteRecord(surveyId);
    if (record) {
      if (record.optionId === optionId) return { success: false, reason: 'same' };
      if (record.changesUsed >= MAX_VOTE_CHANGES) return { success: false, reason: 'limit' };
    }

    let updatedSurvey = null;
    const updated = surveys.map((s) => {
      if (s.id !== surveyId) return s;
      updatedSurvey = {
        ...s,
        options: s.options.map((o) => {
          if (o.id === optionId) return { ...o, votes: o.votes + 1 };
          if (record && o.id === record.optionId) return { ...o, votes: Math.max(0, o.votes - 1) };
          return o;
        }),
      };
      return updatedSurvey;
    });

    setSurveys(updated);
    saveSurveys(updated);

    // Save to database instantly
    (async () => {
      try {
        if (hasDbRef.current && updatedSurvey) {
          const res = await fetch(`/api/surveys?id=${surveyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedSurvey)
          });
          if (!res.ok) throw new Error('Postgres vote sync failed');
        } else if (!isLocalHost()) {
          throw new Error('Database is offline');
        }
      } catch (err) {
        console.error('Failed to save vote to cloud database:', err);
      }
    })();

    const newChangesUsed = record ? record.changesUsed + 1 : 0;
    saveVoteRecord(surveyId, { optionId, changesUsed: newChangesUsed });

    return {
      success: true,
      changesUsed: newChangesUsed,
      changesLeft: MAX_VOTE_CHANGES - newChangesUsed,
    };
  }, [surveys]);

  const getMyVote = useCallback((surveyId) => {
    return getVoteRecord(surveyId);
  }, []);

  const getSurveyById = useCallback((id) => {
    return surveys.find((s) => s.id === id) || null;
  }, [surveys]);

  return (
    <SurveyContext.Provider
      value={{
        surveys,
        loading,
        refreshSurveys: fetchSurveys,
        createSurvey,
        updateSurvey,
        deleteSurvey,
        publishSurvey,
        archiveSurvey,
        castVote,
        getMyVote,
        getSurveyById,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
};
