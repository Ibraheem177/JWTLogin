import { useState } from 'react';
import './App.css';
import { getToken } from './api';
import LoginForm from './components/LoginForm';

function App() {
  // If a token is already saved (e.g. after a page refresh) start logged in.
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));

  return (
    <main className="App">
      {loggedIn ? (
        <p>Logged in!</p>
      ) : (
        <LoginForm onLoggedIn={() => setLoggedIn(true)} />
      )}
    </main>
  );
}

export default App;
