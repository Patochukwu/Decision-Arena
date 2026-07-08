import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSurveys, saveSurveys, getVoteRecord, saveVoteRecord } from '../utils/storage';
import { generateId, MAX_VOTE_CHANGES } from '../utils/helpers';

const SurveyContext = createContext(null);

export const useSurveys = () => {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error('useSurveys must be used within SurveyProvider');
  return ctx;
};

export const SurveyProvider = ({ children }) => {
  const [surveys, setSurveys] = useState([]);

  useEffect(() => {
    setSurveys(getSurveys());
  }, []);

  const persist = (updated) => {
    setSurveys(updated);
    saveSurveys(updated);
  };

  // ── Admin Actions ──────────────────────────────────────────────────────────

  const createSurvey = useCallback((data) => {
    const survey = {
      id: generateId(),
      title: data.title,
      description: data.description || '',
      status: data.status || 'draft',
      createdAt: new Date().toISOString(),
      options: (data.options || []).map((label) => ({
        id: generateId(),
        label,
        votes: 0,
      })),
    };
    persist([...surveys, survey]);
    return survey;
  }, [surveys]);

  const updateSurvey = useCallback((id, changes) => {
    const updated = surveys.map((s) => {
      if (s.id !== id) return s;
      // Handle options update carefully to preserve existing vote counts
      const updatedSurvey = { ...s, ...changes };
      if (changes.options) {
        updatedSurvey.options = changes.options.map((o) => {
          if (o.id) {
            // existing option — preserve votes
            const existing = s.options.find((x) => x.id === o.id);
            return { ...o, votes: existing ? existing.votes : 0 };
          }
          // new option
          return { id: generateId(), label: o.label, votes: 0 };
        });
      }
      return updatedSurvey;
    });
    persist(updated);
  }, [surveys]);

  const deleteSurvey = useCallback((id) => {
    persist(surveys.filter((s) => s.id !== id));
  }, [surveys]);

  const publishSurvey = useCallback((id) => {
    updateSurvey(id, { status: 'active' });
  }, [updateSurvey]);

  const archiveSurvey = useCallback((id) => {
    updateSurvey(id, { status: 'archived' });
  }, [updateSurvey]);

  // ── User Voting ────────────────────────────────────────────────────────────

  const castVote = useCallback((surveyId, optionId) => {
    const record = getVoteRecord(surveyId);
    // { optionId, changesUsed }

    if (record) {
      if (record.optionId === optionId) {
        // voting same option — no-op
        return { success: false, reason: 'same' };
      }
      if (record.changesUsed >= MAX_VOTE_CHANGES) {
        return { success: false, reason: 'limit' };
      }
    }

    // Update vote counts
    const updated = surveys.map((s) => {
      if (s.id !== surveyId) return s;
      return {
        ...s,
        options: s.options.map((o) => {
          if (o.id === optionId) return { ...o, votes: o.votes + 1 };
          if (record && o.id === record.optionId) return { ...o, votes: Math.max(0, o.votes - 1) };
          return o;
        }),
      };
    });
    persist(updated);

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
