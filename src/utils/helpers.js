export const MAX_VOTE_CHANGES = 2;

export const getTotalVotes = (options) => {
  if (!options || !Array.isArray(options)) return 0;
  return options.reduce((sum, o) => sum + (o.votes || 0), 0);
};

export const getPercentage = (votes, total) => {
  if (!total || total === 0) return 0;
  return Math.round((votes / total) * 100);
};

export const formatCount = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

export const getTimeAgo = (isoString) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);
  if (days > 0)    return `${days}d ago`;
  if (hours > 0)   return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

// ── Timeframe helpers ─────────────────────────────────────────────────────

/**
 * Returns one of: 'not_started' | 'active' | 'expired' | 'no_limit'
 */
export const getSurveyTimeStatus = (survey) => {
  const now = Date.now();
  const start = survey.startDate ? new Date(survey.startDate).getTime() : null;
  const end   = survey.endDate   ? new Date(survey.endDate).getTime()   : null;

  if (!start && !end) return 'no_limit';
  if (start && now < start) return 'not_started';
  if (end && now > end)     return 'expired';
  return 'active';
};

/**
 * Whether voting is currently allowed based on timeframe + survey status
 */
export const isVotingOpen = (survey) => {
  if (survey.status !== 'active') return false;
  const ts = getSurveyTimeStatus(survey);
  return ts === 'active' || ts === 'no_limit';
};

/**
 * Format a duration (ms) as a human-readable countdown string
 */
export const formatCountdown = (ms) => {
  if (ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const days  = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins  = Math.floor((totalSec % 3600) / 60);
  const secs  = totalSec % 60;

  if (days > 0)  return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0)  return `${mins}m ${secs}s`;
  return `${secs}s`;
};

/**
 * Format a datetime-local input value from an ISO string
 */
export const isoToDatetimeLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  // datetime-local wants YYYY-MM-DDTHH:MM
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Convert a datetime-local string to ISO
 */
export const datetimeLocalToIso = (val) => {
  if (!val) return null;
  return new Date(val).toISOString();
};
