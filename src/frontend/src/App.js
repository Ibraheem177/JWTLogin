import { useEffect, useState } from 'react';
import './App.css';
import { initAuth, login, register } from './auth';
import Profile from './components/Profile';

function App() {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    initAuth().then(authenticated => {
      if (active) setStatus(authenticated ? 'authenticated' : 'anonymous');
    }).catch(() => {
      if (active) {
        setError('Could not connect to sign-in. Check that Keycloak is running on port 9090.');
        setStatus('failed');
      }
    });
    return () => { active = false; };
  }, []);

  async function redirect(action) {
    try {
      setError('');
      await action();
    } catch {
      setError('Could not open sign-in. Please try again.');
    }
  }

  return (
    <main className="App">
      {status === 'authenticated' ? <Profile /> : (
        <section className="card">
          <h1>JWT Login</h1>
          {status === 'loading' && <p>Checking your session...</p>}
          {status === 'anonymous' && <>
            <p>Sign in securely with Keycloak to view your profile.</p>
            <button onClick={() => redirect(login)}>Sign in</button>
            <button className="link" onClick={() => redirect(register)}>Create an account</button>
          </>}
          {error && <p role="alert" className="error">{error}</p>}
          {status === 'failed' && <button onClick={() => window.location.reload()}>Retry</button>}
        </section>
      )}
    </main>
  );
}

export default App;
