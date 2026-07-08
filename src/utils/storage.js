const SURVEYS_KEY = 'decision_arena_surveys';
const ADMIN_KEY = 'decision_arena_admin';

export const getSurveys = () => {
  try {
    const raw = localStorage.getItem(SURVEYS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveSurveys = (surveys) => {
  localStorage.setItem(SURVEYS_KEY, JSON.stringify(surveys));
};

export const getVoteRecord = (surveyId) => {
  try {
    const raw = localStorage.getItem(`vote_${surveyId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveVoteRecord = (surveyId, record) => {
  localStorage.setItem(`vote_${surveyId}`, JSON.stringify(record));
};

export const getAdminPassword = () => {
  return localStorage.getItem(`${ADMIN_KEY}_password`) || 'admin123';
};

export const setAdminPassword = (pw) => {
  localStorage.setItem(`${ADMIN_KEY}_password`, pw);
};

export const isAdminLoggedIn = () => {
  return sessionStorage.getItem(`${ADMIN_KEY}_session`) === 'true';
};

export const setAdminSession = (val) => {
  if (val) {
    sessionStorage.setItem(`${ADMIN_KEY}_session`, 'true');
  } else {
    sessionStorage.removeItem(`${ADMIN_KEY}_session`);
  }
};
