import './App.css';
import React, { useEffect, useState } from 'react';

function App() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => sessionStorage.getItem('jwt'));
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Your session expired. Please sign in again.');
        setUser(await response.json());
      })
      .catch((failure) => { sessionStorage.removeItem('jwt'); setToken(null); setError(failure.message); });
  }, [token]);

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not authenticate. Check your details and try again.');
      sessionStorage.setItem('jwt', result.token); setToken(result.token); setUser(result.user); setPassword('');
    } catch (failure) { setError(failure.message || 'The server could not be reached.'); }
    finally { setBusy(false); }
  }

  function logout() { sessionStorage.removeItem('jwt'); setToken(null); setUser(null); setError(''); }

  return (
    <main className="page-shell">
      <div className="glow glow-one" /><div className="glow glow-two" />
      <section className="auth-card">
        <div className="brand"><span className="brand-mark">J</span><span>JWT<span className="brand-light">Login</span></span></div>
        {user ? <div className="welcome">
          <div className="success-mark">✓</div><p className="eyebrow">AUTHENTICATED SESSION</p>
          <h1>Welcome back,<br /><span>{user.username}</span></h1>
          <p className="description">Your identity was verified by the API. This page is loading protected account data with your bearer token.</p>
          <div className="session-row"><span className="status-dot" /> Token active <span className="session-time">15 min</span></div>
          <button className="primary-button" onClick={logout}>Sign out <span>↗</span></button>
        </div> : <>
          <p className="eyebrow">YOUR SPACE, SECURED</p>
          <h1>{mode === 'login' ? <>Sign in to your<br /><span>account</span></> : <>Create your<br /><span>account</span></>}</h1>
          <p className="description">{mode === 'login' ? 'Enter your details to continue to your secure workspace.' : 'One account gives you a secure place to get started.'}</p>
          <form onSubmit={submit}>
            <label htmlFor="username">Username</label>
            <input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. alexmorgan" required maxLength="80" />
            <div className="password-label"><label htmlFor="password">Password</label>{mode === 'login' && <span>At least 8 characters</span>}</div>
            <input id="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" required minLength="8" maxLength="72" />
            {error && <p role="alert" className="error-message">{error}</p>}
            <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}<span>↗</span></button>
          </form>
          <p className="switch-mode">{mode === 'login' ? 'New here?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
        </>}
        <div className="card-footer"><span><i /> End-to-end protected</span><span>JWT AUTH · 01</span></div>
      </section>
      <aside className="side-note"><span className="note-line" /><div><strong>Built around trust.</strong><p>Secure authentication, designed<br />to feel refreshingly simple.</p></div><span className="side-index">01 — 03</span></aside>
    </main>
  );
}

export default App;
