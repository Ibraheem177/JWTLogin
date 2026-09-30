import { useCallback, useState } from 'react';
import './App.css';
import { getToken } from './api';
import LoginForm from './components/LoginForm';
import Profile from './components/Profile';

function App() {
  // If a token is already saved (e.g. after a page refresh) start logged in.
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));

  const handleLoggedOut = useCallback(() => setLoggedIn(false), []);

  return (
    <main className="App">
      {loggedIn ? (
        <Profile onLoggedOut={handleLoggedOut} />
      ) : (
        <LoginForm onLoggedIn={() => setLoggedIn(true)} />
      )}
    </main>
  );
}

export default App;
