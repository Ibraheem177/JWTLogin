import Keycloak from 'keycloak-js';
import { initAuth, getAccessToken } from './auth';

jest.mock('keycloak-js', () => jest.fn().mockImplementation(() => ({
  init: jest.fn().mockResolvedValue(true),
  authenticated: true,
  token: 'access-token',
  updateToken: jest.fn().mockResolvedValue(false),
  clearToken: jest.fn(),
})));

const adapter = Keycloak.mock.results[0].value;

beforeEach(() => {
  adapter.init.mockResolvedValue(true);
  adapter.updateToken.mockResolvedValue(false);
});

test('initializes once with PKCE, including under repeated React effects', async () => {
  localStorage.setItem('jwt', 'legacy-token');
  const first = initAuth();
  expect(initAuth()).toBe(first);
  await first;
  expect(adapter.init).toHaveBeenCalledTimes(1);
  expect(adapter.init).toHaveBeenCalledWith(expect.objectContaining({ pkceMethod: 'S256' }));
  expect(localStorage.getItem('jwt')).toBeNull();
});

test('refreshes before returning the access token without persisting it', async () => {
  await expect(getAccessToken()).resolves.toBe('access-token');
  expect(adapter.updateToken).toHaveBeenCalledWith(30);
  expect(localStorage.getItem('jwt')).toBeNull();
});

test('clears expired authentication when token refresh fails', async () => {
  adapter.updateToken.mockRejectedValueOnce(new Error('refresh denied'));
  await expect(getAccessToken()).rejects.toMatchObject({ status: 401 });
  expect(adapter.clearToken).toHaveBeenCalledTimes(1);
});

