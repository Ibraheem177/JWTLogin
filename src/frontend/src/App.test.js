import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => localStorage.clear());

test('shows the login form when there is no saved token', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
