import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Trophy, Lock, RefreshCw, Clock, CalendarClock, AlertTriangle } from 'lucide-react';
import { useSurveys } from '../context/SurveyContext';
import VoteOption from '../components/VoteOption';
import Toast, { useToast } from '../components/Toast';
import { getTotalVotes, MAX_VOTE_CHANGES, getSurveyTimeStatus, formatCountdown, isVotingOpen } from '../utils/helpers';
import './SurveyPage.css';

const SurveyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSurveyById, castVote, getMyVote } = useSurveys();
  const { toasts, addToast, removeToast } = useToast();

  const [survey, setSurvey]     = useState(null);
  const [myVote, setMyVote]     = useState(null);
  const [justVoted, setJustVoted] = useState(false);
  const [countdown, setCountdown] = useState(null); // ms remaining

  useEffect(() => {
    const s = getSurveyById(id);
    if (!s) { navigate('/'); return; }
    setSurvey(s);
    setMyVote(getMyVote(id));
  }, [id]);

  // Countdown timer for surveys with endDate
  useEffect(() => {
    if (!survey?.endDate) { setCountdown(null); return; }
    const tick = () => {
      const remaining = new Date(survey.endDate).getTime() - Date.now();
      setCountdown(remaining > 0 ? remaining : 0);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [survey?.endDate]);

  // Re-sync after voting
  const refreshSurvey = () => {
    setSurvey(getSurveyById(id));
    setMyVote(getMyVote(id));
  };

  const handleVote = (optionId) => {
    const result = castVote(id, optionId);

    if (!result.success) {
      if (result.reason === 'same')        addToast('You already selected this option.', 'info');
      else if (result.reason === 'limit')  addToast(`You've used all your vote changes.`, 'error');
      else if (result.reason === 'not_started') addToast('This survey hasn\'t opened yet.', 'info');
      else if (result.reason === 'expired')     addToast('Voting for this survey has closed.', 'error');
      else addToast('Voting is not available right now.', 'error');
      return;
    }

    setJustVoted(true);
    refreshSurvey();

    const changesLeft = result.changesLeft;
    if (changesLeft > 0) {
      addToast(`Vote recorded! You can still change it ${changesLeft} more time${changesLeft > 1 ? 's' : ''}.`, 'success');
    } else {
      addToast('Vote locked in! No more changes allowed.', 'success');
    }
  };

  // Keep survey in sync with context changes
  useEffect(() => {
    if (justVoted) {
      const updated = getSurveyById(id);
      setSurvey(updated);
      setJustVoted(false);
    }
  }, [justVoted]);

  if (!survey) return null;

  const totalVotes    = getTotalVotes(survey.options);
  const sortedOptions = [...survey.options].sort((a, b) => b.votes - a.votes);
  const leadingOption = sortedOptions[0];
  const changesUsed   = myVote?.changesUsed ?? null;
  const changesLeft   = changesUsed !== null ? MAX_VOTE_CHANGES - changesUsed : MAX_VOTE_CHANGES;
  const voteLocked    = myVote && changesLeft <= 0;
  const timeStatus    = getSurveyTimeStatus(survey);
  const canVote       = isVotingOpen(survey) && !voteLocked;

  return (
    <div className="survey-page">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="survey-page-inner">
        {/* Back */}
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          Back to surveys
        </Link>

        {/* Header */}
        <motion.div
          className="survey-header card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="survey-header-top">
            <div>
              <span className={`badge badge-${survey.status}`}>
                {survey.status === 'active' && <span className="live-dot" />}
                {survey.status}
              </span>
            </div>
            <div className="survey-header-stats">
              <div className="header-stat">
                <Users size={14} />
                <span>{totalVotes.toLocaleString()} votes</span>
              </div>
              <div className="header-stat">
                <Trophy size={14} />
                <span>{survey.options.length} options</span>
              </div>
            </div>
          </div>

          <h1 className="survey-page-title">{survey.title}</h1>
          {survey.description && <p className="survey-page-desc">{survey.description}</p>}

          {/* Timeframe banners */}
          {timeStatus === 'not_started' && survey.startDate && (
            <div className="vote-status-banner vote-not-started">
              <CalendarClock size={15} />
              <span>
                Voting opens on <strong>{new Date(survey.startDate).toLocaleString()}</strong>
              </span>
            </div>
          )}

          {timeStatus === 'expired' && (
            <div className="vote-status-banner vote-archived">
              <AlertTriangle size={15} />
              <span>
                Voting closed{survey.endDate ? ` on ${new Date(survey.endDate).toLocaleString()}` : ''}.
              </span>
            </div>
          )}

          {(timeStatus === 'active' || timeStatus === 'no_limit') && survey.endDate && countdown !== null && (
            <div className={`vote-status-banner vote-countdown ${countdown < 3600000 ? 'vote-countdown-urgent' : ''}`}>
              <Clock size={15} />
              <span>
                {countdown === 0
                  ? 'Voting just closed.'
                  : <>Closes in <strong>{formatCountdown(countdown)}</strong></>}
              </span>
            </div>
          )}

          {/* Vote status banner */}
          {myVote && (
            <div className={`vote-status-banner ${voteLocked ? 'vote-locked' : ''}`}>
              {voteLocked ? (
                <>
                  <Lock size={15} />
                  <span>Your vote is locked. You've used all {MAX_VOTE_CHANGES} changes.</span>
                </>
              ) : (
                <>
                  <RefreshCw size={15} />
                  <span>
                    You can change your vote {changesLeft} more time{changesLeft !== 1 ? 's' : ''}.
                  </span>
                </>
              )}
            </div>
          )}

          {survey.status !== 'active' && (
            <div className="vote-status-banner vote-archived">
              <Lock size={15} />
              <span>This survey is {survey.status} — voting is closed.</span>
            </div>
          )}
        </motion.div>

        {/* Options */}
        <div className="survey-options">
          <div className="options-label">
            {canVote && !myVote && 'Click an option to cast your vote'}
            {canVote && myVote && 'Click a different option to change your vote'}
            {!canVote && myVote && 'Results'}
            {survey.status !== 'active' && 'Final Results'}
          </div>

          <div className="options-list">
            {survey.options.map((option, i) => (
              <VoteOption
                key={option.id}
                option={option}
                index={i}
                totalVotes={totalVotes}
                isSelected={myVote?.optionId === option.id}
                canVote={canVote}
                onVote={() => handleVote(option.id)}
                isLeading={option.id === leadingOption?.id}
              />
            ))}
          </div>
        </div>

        {/* Leading result highlight */}
        {totalVotes > 0 && (
          <motion.div
            className="leading-card card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="leading-card-inner">
              <Trophy size={20} className="trophy-icon" />
              <div>
                <div className="leading-label">Currently leading</div>
                <div className="leading-name">{leadingOption.label}</div>
              </div>
              <div className="leading-votes">
                <span className="leading-pct">
                  {Math.round((leadingOption.votes / totalVotes) * 100)}%
                </span>
                <span className="leading-count">{leadingOption.votes.toLocaleString()} votes</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SurveyPage;
