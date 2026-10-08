import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { authenticatedFetch, login, logout, oauthLogin, register } from './api';
import keycloak from './keycloak';

jest.mock('./api', () => ({
  authenticatedFetch: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  oauthLogin: jest.fn(),
  register: jest.fn()
}));

jest.mock('./keycloak', () => ({
  __esModule: true,
  default: {
    token: '',
    tokenParsed: null
  }
}));

beforeEach(() => {
  authenticatedFetch.mockReset();
  login.mockReset();
  logout.mockReset();
  oauthLogin.mockReset();
  register.mockReset();
  keycloak.token = '';
  keycloak.tokenParsed = null;
});

test('starts a hosted OAuth login with Keycloak', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /sign in with keycloak/i }));

  expect(oauthLogin).toHaveBeenCalled();
});

test('uses an OAuth callback session after returning from Keycloak', async () => {
  keycloak.token = 'oauth.access.token';
  keycloak.tokenParsed = { preferred_username: 'alex' };
  authenticatedFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ username: 'alex' })
  });

  render(<App />);

  expect(await screen.findByText('Succeeded')).toBeInTheDocument();
  expect(screen.getByText('Welcome, alex.')).toBeInTheDocument();
  expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
});

test('authenticates the login form with Keycloak and verifies API access', async () => {
  login.mockResolvedValue('keycloak.access.token');
  authenticatedFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ username: 'alex' })
  });

  render(<App />);
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alex' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }));

  expect(await screen.findByText('Succeeded')).toBeInTheDocument();
  expect(login).toHaveBeenCalledWith('alex', 'secret');
  expect(authenticatedFetch).toHaveBeenCalledWith('/api/me');
});

test('registers an account and returns to sign in', async () => {
  register.mockResolvedValue({ username: 'alex' });

  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Create an account' }));
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alex' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } });
  fireEvent.click(screen.getByRole('button', { name: /create account/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(
    'Account created. Sign in with your new credentials.'
  );
  expect(register).toHaveBeenCalledWith('alex', 'secret');
  expect(screen.getByRole('button', { name: 'Sign in', exact: true })).toBeInTheDocument();
});

test('shows login errors without opening an authenticated session', async () => {
  login.mockRejectedValue(new Error('Invalid user credentials'));

  render(<App />);
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alex' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid user credentials');
  expect(authenticatedFetch).not.toHaveBeenCalled();
});

test('shows API errors and allows the user to sign out', async () => {
  login.mockResolvedValue('keycloak.access.token');
  authenticatedFetch.mockResolvedValue({ ok: false, status: 401 });

  render(<App />);

  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alex' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }));

  expect(await screen.findByRole('alert')).toHaveTextContent('The application API returned HTTP 401.');
  fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
  expect(logout).toHaveBeenCalled();
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
});
