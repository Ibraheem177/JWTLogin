import Keycloak from 'keycloak-js';

// Public browser client: there is deliberately no client secret in React.
const keycloak = new Keycloak({
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:9090',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'jwt-login',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'jwt-login-react',
});
const redirectUri = `${window.location.origin}/`;
let initialization;

export function initAuth() {
  // React StrictMode runs effects twice in development. Initialize the adapter once.
  if (!initialization) {
    localStorage.removeItem('jwt'); // Discard tokens saved by the previous implementation.
    initialization = keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: false,
      redirectUri,
    });
  }
  return initialization;
}

export function login() {
  return keycloak.login({ redirectUri });
}

export function register() {
  return keycloak.register({ redirectUri });
}

export function logout() {
  return keycloak.logout({ redirectUri });
}

export async function getAccessToken() {
  if (!keycloak.authenticated) {
    throw sessionExpired();
  }
  try {
    // Refresh only when fewer than 30 seconds remain. Tokens stay in adapter memory.
    await keycloak.updateToken(30);
  } catch {
    keycloak.clearToken();
    throw sessionExpired();
  }
  if (!keycloak.token) throw sessionExpired();
  return keycloak.token;
}

function sessionExpired() {
  const error = new Error('Your session has ended. Please sign in again.');
  error.status = 401;
  return error;
}
