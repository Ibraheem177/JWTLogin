import { useState } from 'react';
import { login, register } from '../api';

// One form that works in two modes: "login" and "register".
function LoginForm({ onLoggedIn }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isLogin = mode === 'login';

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser reloading the page
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        await login(username, password); // saves the JWT
        onLoggedIn();                    // tell App to show the profile
      } else {
        await register(username, password);
        setMessage('Account created - you can now log in.');
        setMode('login');
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function switchMode() {
    setMode(isLogin ? 'register' : 'login');
    setError('');
    setMessage('');
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h1>{isLogin ? 'Log in' : 'Create account'}</h1>

      <label htmlFor="username">Username</label>
      <input
        id="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        required
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete={isLogin ? 'current-password' : 'new-password'}
        minLength={6}
        required
      />

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="success">{message}</p>}

      <button type="submit">{isLogin ? 'Log in' : 'Register'}</button>
      <button type="button" className="link" onClick={switchMode}>
        {isLogin ? 'Need an account? Register' : 'Already have an account? Log in'}
      </button>
    </form>
  );
}

export default LoginForm;
