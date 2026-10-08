import { authenticatedFetch, login, logout, oauthLogin, register } from './api';

jest.mock('./keycloak', () => ({
    __esModule: true,
    default: {
        authenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        updateToken: jest.fn(),
        token: 'oauth-access-token'
    }
}));
import keycloak from './keycloak';

beforeEach(() => {
    logout();
    keycloak.authenticated = false;
    keycloak.login.mockReset();
    global.fetch = jest.fn();
});

test('starts OAuth authorization code login with PKCE through the Keycloak adapter', async () => {
    keycloak.login.mockResolvedValue();

    await oauthLogin();

    expect(keycloak.login).toHaveBeenCalledWith({ redirectUri: window.location.origin });
});

test('sends credentials to the backend and stores its token in memory', async () => {
    global.fetch
        .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ accessToken: 'backend-access-token', expiresIn: 300 })
        })
        .mockResolvedValueOnce({ ok: true });

    await login('alex', 'secret');

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/login');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.body).toBe(JSON.stringify({ username: 'alex', password: 'secret' }));

    await authenticatedFetch('/api/me');
    expect(global.fetch.mock.calls[1][1].headers.get('Authorization')).toBe('Bearer backend-access-token');
});

test('shows the backend error for invalid credentials', async () => {
    global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid username or password.' })
    });

    await expect(login('alex', 'wrong')).rejects.toThrow('Invalid username or password.');
});

test('sends new account credentials to the registration endpoint', async () => {
    global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ username: 'alex' })
    });

    await expect(register('alex', 'secret')).resolves.toEqual({ username: 'alex' });

    expect(global.fetch).toHaveBeenCalledWith('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'alex', password: 'secret' })
    });
});

test('rejects protected API requests after sign out', async () => {
    await expect(authenticatedFetch('/api/me')).rejects.toThrow(
        'You must be signed in to access the application API.'
    );
    expect(global.fetch).not.toHaveBeenCalled();
});

test('rejects local API calls after the backend-issued token expires', async () => {
    global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'backend-access-token', expiresIn: 1 })
    });

    await login('alex', 'secret');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await expect(authenticatedFetch('/api/me')).rejects.toThrow('Your session has expired. Sign in again.');
});

test('uses refreshed Keycloak adapter tokens for OAuth-authenticated API requests', async () => {
    keycloak.authenticated = true;
    keycloak.updateToken.mockResolvedValue(false);
    global.fetch.mockResolvedValue({ ok: true });

    await authenticatedFetch('/api/me');

    expect(keycloak.updateToken).toHaveBeenCalledWith(30);
    expect(global.fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer oauth-access-token');
});
