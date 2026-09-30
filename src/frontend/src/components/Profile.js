import { useEffect, useState } from 'react';
import { clearToken, fetchProfile, getToken } from '../api';

// Shown only when logged in. Proves the token works by calling a protected endpoint.
function Profile({ onLoggedOut }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch((err) => {
        // 401 = token missing, expired or tampered with -> back to the login screen
        if (err.status === 401) {
          clearToken();
          onLoggedOut();
        }
      });
  }, [onLoggedOut]);

  function handleLogout() {
    clearToken();
    onLoggedOut();
  }

  if (!profile) {
    return <p>Loading...</p>;
  }

  return (
    <section className="card">
      <h1>Welcome, {profile.username}</h1>
      <p>This data came from a protected endpoint, unlocked by your JWT:</p>
      <p className="token">{getToken()}</p>
      <button type="button" onClick={handleLogout}>Log out</button>
    </section>
  );
}

export default Profile;
