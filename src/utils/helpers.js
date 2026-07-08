export const MAX_VOTE_CHANGES = 2;

export const getTotalVotes = (options) => {
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
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};
