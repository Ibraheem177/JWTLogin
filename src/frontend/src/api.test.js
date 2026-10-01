import { fetchProfile } from './api';
import { getAccessToken } from './auth';

jest.mock('./auth', () => ({ getAccessToken: jest.fn() }));

beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => jest.resetAllMocks());

test('sends the refreshed access token to the API', async () => {
  getAccessToken.mockResolvedValue('fresh-token');
  fetch.mockResolvedValue({ ok: true, json: async () => ({ username: 'alice' }) });
  await expect(fetchProfile()).resolves.toEqual({ username: 'alice' });
  expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/users/me', {
    headers: { Authorization: 'Bearer fresh-token' },
  });
});

test('does not call the API when refresh fails', async () => {
  getAccessToken.mockRejectedValue(new Error('Session expired'));
  await expect(fetchProfile()).rejects.toThrow('Session expired');
  expect(fetch).not.toHaveBeenCalled();
});

test('preserves HTTP 401 so the UI can offer another login', async () => {
  getAccessToken.mockResolvedValue('rejected-token');
  fetch.mockResolvedValue({ ok: false, status: 401 });
  await expect(fetchProfile()).rejects.toMatchObject({ status: 401 });
});
