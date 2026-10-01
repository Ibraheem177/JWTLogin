import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { initAuth, login, register, logout } from './auth';
import { fetchProfile } from './api';

jest.mock('./auth', () => ({
  initAuth: jest.fn(), login: jest.fn(), register: jest.fn(), logout: jest.fn(),
}));
jest.mock('./api', () => ({ fetchProfile: jest.fn() }));

beforeEach(() => jest.resetAllMocks());

test('anonymous users sign in or register through Keycloak without entering passwords here', async () => {
  initAuth.mockResolvedValue(false);
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
  expect(login).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Create an account' }));
  expect(register).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
});

test('a signed-in user sees the protected profile and can log out', async () => {
  initAuth.mockResolvedValue(true);
  fetchProfile.mockResolvedValue({ id: 'user-123', username: 'alice' });
  render(<App />);
  expect(await screen.findByText('Welcome, alice')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
  expect(logout).toHaveBeenCalledTimes(1);
});

test('Keycloak connection failure gives a useful error', async () => {
  initAuth.mockRejectedValue(new Error('offline'));
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Keycloak is running on port 9090');
});

test('an expired session offers sign-in again', async () => {
  initAuth.mockResolvedValue(true);
  fetchProfile.mockRejectedValue(Object.assign(new Error('Session expired'), { status: 401 }));
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Sign in again' }));
  expect(login).toHaveBeenCalledTimes(1);
});

test('a profile network failure can be retried', async () => {
  initAuth.mockResolvedValue(true);
  fetchProfile.mockRejectedValueOnce(new Error('Network unavailable'))
    .mockResolvedValueOnce({ id: 'user-123', username: 'alice' });
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Retry profile' }));
  expect(await screen.findByText('Welcome, alice')).toBeInTheDocument();
});
