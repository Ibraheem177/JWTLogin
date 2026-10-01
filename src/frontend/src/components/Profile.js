import { useEffect, useState } from 'react';
import { fetchProfile } from '../api';
import { login, logout } from '../auth';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(null);
    fetchProfile().then(data => {
      if (active) setProfile(data);
    }).catch(err => {
      if (active) setError(err);
    });
    return () => { active = false; };
  }, [attempt]);

  async function redirect(action) {
    try {
      await action();
    } catch {
      setError(new Error('Could not reach sign-in. Please try again.'));
    }
  }

  return (
    <section className="card">
      <h1>{profile ? `Welcome, ${profile.username}` : 'Your profile'}</h1>
      {!profile && !error && <p>Loading your profile...</p>}
      {profile && <>
        <p>Your protected profile was loaded successfully.</p>
        <p>User ID: {profile.id}</p>
      </>}
      {error && <>
        <p role="alert" className="error">{error.message}</p>
        {error.status === 401
          ? <button onClick={() => redirect(login)}>Sign in again</button>
          : <button onClick={() => setAttempt(n => n + 1)}>Retry profile</button>}
      </>}
      <button onClick={() => redirect(logout)}>Log out</button>
    </section>
  );
}

export default Profile;
