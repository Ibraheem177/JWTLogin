import { getAccessToken } from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export async function fetchProfile() {
  const token = await getAccessToken();
  const response = await fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = new Error(response.status === 401
      ? 'Your session has ended. Please sign in again.'
      : `Could not load your profile (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}
