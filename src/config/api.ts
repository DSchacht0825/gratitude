// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://the-daily-pause.schacht-dan.workers.dev';

// Ensure the URL is complete and not truncated
const getApiUrl = () => {
  let url = API_BASE_URL;

  // Handle truncation issues
  if (url === 'https://the-daily-pause.schach') {
    url = 'https://the-daily-pause.schacht-dan.workers.dev';
  }

  // Remove trailing slash if present
  return url.replace(/\/$/, '');
};

export const API_URL = getApiUrl();

export const apiEndpoints = {
  auth: {
    me: `${API_URL}/api/auth/me`,
    login: `${API_URL}/api/auth/login`,
    register: `${API_URL}/api/auth/register`,
    logout: `${API_URL}/api/auth/logout`,
  },
  journal: {
    get: `${API_URL}/api/journal`,
    save: `${API_URL}/api/journal`,
  },
};