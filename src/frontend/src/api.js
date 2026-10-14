let tokenSession = null;
const backendUrl = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8081').replace(/\/$/, '');

export async function login(username, password) {
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Unable to sign in. Check your username and password.');
    }
    if (!result.accessToken || !result.expiresIn) {
        throw new Error('The backend returned an incomplete login response.');
    }

    tokenSession = {
        accessToken: result.accessToken,
        expiresAt: Date.now() + result.expiresIn * 1000
    };
    return tokenSession.accessToken;
}

export async function register(username, password) {
    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Unable to create your account. Please try again.');
    }
    return result;
}

export function logout() {
    tokenSession = null;
    return fetch('/api/logout', { method: 'POST', credentials: 'include' });
}

export function oauthLogin() {
    window.location.assign(`${backendUrl}/oauth2/authorization/keycloak`);
}

export async function authenticatedFetch(input, init = {}) {
    if (tokenSession) {
        if (tokenSession.expiresAt <= Date.now()) {
            tokenSession = null;
            throw new Error('Your session has expired. Sign in again.');
        }
    }

    const headers = new Headers(init.headers);
    if (tokenSession) headers.set('Authorization', `Bearer ${tokenSession.accessToken}`);
    return fetch(input, { ...init, headers, credentials: 'include' });
}
