import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { getPercentage, getTotalVotes } from '../utils/helpers';
import './VoteOption.css';

const barColors = [
  'var(--grad-brand)',
  'var(--grad-teal)',
  'var(--grad-warm)',
  'var(--grad-green)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #f59e0b, #22c55e)',
];

const VoteOption = ({ option, index, totalVotes, isSelected, canVote, onVote, isLeading }) => {
  const pct = getPercentage(option.votes, totalVotes);
  const barColor = barColors[index % barColors.length];

  return (
    <motion.div
      className={`vote-option ${isSelected ? 'vote-option-selected' : ''} ${isLeading && totalVotes > 0 ? 'vote-option-leading' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      onClick={canVote ? onVote : undefined}
      style={{ cursor: canVote ? 'pointer' : 'default' }}
    >
      {/* Progress fill */}
      <motion.div
        className="vote-bar-fill"
        style={{ background: barColor }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: index * 0.05 + 0.2 }}
      />

      {/* Content */}
      <div className="vote-option-content">
        <div className="vote-option-left">
          <div className={`vote-radio ${isSelected ? 'vote-radio-selected' : ''}`}>
            {isSelected ? <CheckCircle2 size={16} /> : <span className="vote-radio-inner" />}
          </div>
          <span className="vote-option-label">{option.label}</span>
          {isLeading && totalVotes > 0 && <span className="leading-tag">Leading</span>}
        </div>
        <div className="vote-option-right">
          <span className="vote-pct">{pct}%</span>
          <span className="vote-count">{option.votes.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default VoteOption;
