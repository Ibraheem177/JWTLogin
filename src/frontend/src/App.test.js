import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn();
});

test('submits credentials and stores the returned JWT', async () => {
  const onLoginSuccess = jest.fn();
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ accessToken: 'example.jwt.token' }),
  });

  render(<App onLoginSuccess={onLoginSuccess} />);
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alex' } });
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'secret' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'alex', password: 'secret' }),
  }));
  await screen.findByRole('status');

  expect(localStorage.getItem('token')).toBe('example.jwt.token');
  expect(onLoginSuccess).toHaveBeenCalledWith('example.jwt.token');
});

test('shows the API error without storing a token', async () => {
  global.fetch.mockResolvedValue({
    ok: false,
    json: async () => ({ message: 'Invalid username or password.' }),
  });

  render(<App />);
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alex' } });
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'wrong' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password.');
  expect(localStorage.getItem('token')).toBeNull();
});
