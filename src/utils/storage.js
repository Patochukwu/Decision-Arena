const SURVEYS_KEY = 'decision_arena_surveys';
const ADMIN_KEY = 'decision_arena_admin';

const DEFAULT_SURVEYS = [
  {
    id: "seed-survey-1",
    title: "What major feature should we build next for Decision Arena?",
    description: "Help us prioritize our roadmap. We want to know which integrations and capabilities matter most to you.",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    startDate: null,
    endDate: null,
    options: [
      { id: "seed-opt-1-1", label: "Real-time Database Sync (Firebase/Supabase)", votes: 42 },
      { id: "seed-opt-1-2", label: "Social Identity Logins (Google, GitHub, Apple)", votes: 28 },
      { id: "seed-opt-1-3", label: "Interactive charts and PDF reports export", votes: 19 },
      { id: "seed-opt-1-4", label: "Slack & Discord notification webhooks", votes: 35 }
    ]
  },
  {
    id: "seed-survey-2",
    title: "Where should we host the 2026 Developer Retreat?",
    description: "Voting is open to all community members. Select your dream destination for a week of hacking and outdoor adventures.",
    status: "active",
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    startDate: new Date().toISOString(), // open now
    endDate: new Date(Date.now() + 86400000 * 3).toISOString(), // closes in 3 days
    options: [
      { id: "seed-opt-2-1", label: "Kyoto Temple Stays & Bamboo Forests", votes: 64 },
      { id: "seed-opt-2-2", label: "Swiss Alps Alpine Hackhouse & Skiing", votes: 88 },
      { id: "seed-opt-2-3", label: "Cape Town Beach Villa & Wildlife Safari", votes: 47 }
    ]
  },
  {
    id: "seed-survey-3",
    title: "What is your default IDE color theme preference?",
    description: "Let us know what color scheme keeps you in the flow state during long coding sessions.",
    status: "active",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    startDate: null,
    endDate: null,
    options: [
      { id: "seed-opt-3-1", label: "Nordic Minimal (Cold Grays & Blues)", votes: 12 },
      { id: "seed-opt-3-2", label: "Dracula / Premium Pitch Dark", votes: 45 },
      { id: "seed-opt-3-3", label: "Warm Editorial Light Theme (Lavender-White)", votes: 29 },
      { id: "seed-opt-3-4", label: "Monokai Classic Retro", votes: 8 }
    ]
  }
];

export const getSurveys = () => {
  try {
    const raw = localStorage.getItem(SURVEYS_KEY);
    if (!raw) {
      // Seed default surveys so first-time mobile / new browser visits look great
      saveSurveys(DEFAULT_SURVEYS);
      return DEFAULT_SURVEYS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SURVEYS;
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
