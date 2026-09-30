// All calls to the Spring Boot backend live here.
const API_URL = 'http://localhost:8080/api';
const TOKEN_KEY = 'jwt';

// --- Token storage -------------------------------------------------------
// The JWT is kept in localStorage so the user stays logged in after a refresh.
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

// Logging out with JWT just means throwing the token away - the server
// keeps no session, so there is nothing to tell it.
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// --- Requests ------------------------------------------------------------
async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  // Attach the token to every request if we have one.
  // The backend's JwtAuthenticationFilter reads exactly this header.
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(API_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = new Error(await errorMessage(response));
    error.status = response.status;
    throw error;
  }

  // 201 Created from /register has no body
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function errorMessage(response) {
  try {
    const data = await response.json();
    return data.message || data.error || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export function register(username, password) {
  return request('/auth/register', { method: 'POST', body: { username, password } });
}

export async function login(username, password) {
  const { token } = await request('/auth/login', { method: 'POST', body: { username, password } });
  saveToken(token);
  return token;
}

export function fetchProfile() {
  return request('/users/me');
}
