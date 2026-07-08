import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, BarChart2, Clock } from 'lucide-react';
import { getTotalVotes, getTimeAgo, getSurveyTimeStatus } from '../utils/helpers';
import './SurveyCard.css';

const gradients = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #14b8a6, #6366f1)',
  'linear-gradient(135deg, #f59e0b, #ec4899)',
  'linear-gradient(135deg, #22c55e, #14b8a6)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #f59e0b, #22c55e)',
];

const SurveyCard = ({ survey, index = 0, adminMode = false, onEdit, onDelete, onPublish, onArchive }) => {
  const totalVotes = getTotalVotes(survey.options);
  const gradient = gradients[index % gradients.length];
  const topOption = [...survey.options].sort((a, b) => b.votes - a.votes)[0];

  return (
    <motion.div
      className="survey-card card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Accent bar */}
      <div className="survey-card-accent" style={{ background: gradient }} />

      <div className="survey-card-body">
        <div className="survey-card-top">
          <div className="survey-card-meta">
            <span className={`badge badge-${survey.status}`}>
              {survey.status === 'active' && <span className="live-dot" />}
              {survey.status}
            </span>
            <span className="survey-card-time">
              <Clock size={12} />
              {getTimeAgo(survey.createdAt)}
            </span>
          </div>

          <h3 className="survey-card-title">{survey.title}</h3>
          {survey.description && (
            <p className="survey-card-desc">{survey.description}</p>
          )}
        </div>

        {/* Mini stats */}
        <div className="survey-card-stats">
          <div className="stat-chip">
            <BarChart2 size={13} />
            <span>{survey.options.length} options</span>
          </div>
          <div className="stat-chip">
            <Users size={13} />
            <span>{totalVotes.toLocaleString()} vote{totalVotes !== 1 ? 's' : ''}</span>
          </div>
          {topOption && totalVotes > 0 && (
            <div className="stat-chip stat-chip-lead">
              <span>🏆 {topOption.label}</span>
            </div>
          )}
          {survey.endDate && (
            <div className={`stat-chip ${
              getSurveyTimeStatus(survey) === 'expired' ? 'stat-chip-expired' :
              getSurveyTimeStatus(survey) === 'not_started' ? 'stat-chip-pending' : 'stat-chip-deadline'
            }`}>
              <Clock size={11} />
              <span>
                {getSurveyTimeStatus(survey) === 'expired'
                  ? 'Closed'
                  : getSurveyTimeStatus(survey) === 'not_started'
                  ? `Opens ${new Date(survey.startDate).toLocaleDateString()}`
                  : `Closes ${new Date(survey.endDate).toLocaleDateString()}`}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="survey-card-actions">
          {adminMode ? (
            <>
              <button className="btn btn-secondary btn-sm" onClick={onEdit}>Edit</button>
              {survey.status === 'draft' && (
                <button className="btn btn-primary btn-sm" onClick={onPublish}>Publish</button>
              )}
              {survey.status === 'active' && (
                <button className="btn btn-secondary btn-sm" onClick={onArchive}>Archive</button>
              )}
              <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
              <Link to={`/survey/${survey.id}`} target="_blank" className="btn btn-ghost btn-sm">
                Preview <ArrowRight size={13} />
              </Link>
            </>
          ) : (
            <Link
              to={`/survey/${survey.id}`}
              className="btn btn-primary btn-sm survey-card-cta"
            >
              {survey.status === 'active' ? 'Vote Now' : 'View Results'}
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SurveyCard;
