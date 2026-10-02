import keycloak from './keycloak';

let tokenSession = null;

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

export function logout() {
    tokenSession = null;
    if (keycloak.authenticated) {
        return keycloak.logout({ redirectUri: window.location.origin });
    }
    return Promise.resolve();
}

export function oauthLogin() {
    return keycloak.login({ redirectUri: window.location.origin });
}

export async function authenticatedFetch(input, init = {}) {
    let accessToken;
    if (tokenSession) {
        if (tokenSession.expiresAt <= Date.now()) {
            tokenSession = null;
            throw new Error('Your session has expired. Sign in again.');
        }
        accessToken = tokenSession.accessToken;
    } else if (keycloak.authenticated) {
        await keycloak.updateToken(30);
        accessToken = keycloak.token;
    } else {
        throw new Error('You must be signed in to access the application API.');
    }

    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    return fetch(input, { ...init, headers });
}
