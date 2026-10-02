import React, { useEffect, useState } from 'react';
import { authenticatedFetch, login, logout, oauthLogin } from './api';
import keycloak from './keycloak';
import './App.css';

function App() {
    const [accessToken, setAccessToken] = useState(keycloak.token || '');
    const [username, setUsername] = useState(keycloak.tokenParsed?.preferred_username || '');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOAuthLoading, setIsOAuthLoading] = useState(false);
    const [apiStatus, setApiStatus] = useState({ loading: true, error: '', user: null });

    let statusMessage = 'Verifying your access with the application…';
    if (!apiStatus.loading) {
        statusMessage = apiStatus.error || 'Succeeded';
    }

    useEffect(() => {
        if (!accessToken) {
            return undefined;
        }
        let active = true;
        authenticatedFetch('/api/me')
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`The application API returned HTTP ${response.status}.`);
                }
                const user = await response.json();
                if (active) {
                    setApiStatus({ loading: false, error: '', user });
                }
            })
            .catch((error) => {
                if (active) {
                    setApiStatus({
                        loading: false,
                        error: error instanceof Error ? error.message : 'Unable to reach the application API.',
                        user: null
                    });
                }
            });
        return () => {
            active = false;
        };
    }, [accessToken]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoginError('');
        setIsLoading(true);
        try {
            const token = await login(username, password);
            setPassword('');
            setApiStatus({ loading: true, error: '', user: null });
            setAccessToken(token);
        } catch (error) {
            setLoginError(error instanceof Error ? error.message : 'Unable to sign in. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        setAccessToken('');
        setApiStatus({ loading: true, error: '', user: null });
    };

    const handleOAuthLogin = async () => {
        setLoginError('');
        setIsOAuthLoading(true);
        try {
            await oauthLogin();
        } catch (error) {
            setLoginError(error instanceof Error ? error.message : 'Unable to connect to Keycloak.');
            setIsOAuthLoading(false);
        }
    };

    return (
        <main className="login-page">
            <section className="login-card" aria-labelledby="login-title">
                <div className="brand-mark" aria-hidden="true">
                    <svg viewBox="0 0 40 40" role="presentation">
                        <path d="M20 3.5 34 9v9.2c0 9-5.9 15.3-14 18.3-8.1-3-14-9.3-14-18.3V9l14-5.5Z" />
                        <path d="m13.5 20 4.2 4.2 9-9" />
                    </svg>
                </div>

                <div className="login-heading">
                    <p className="eyebrow">SECURE PORTAL</p>
                    <h1 id="login-title">{accessToken ? 'You’re signed in' : 'Welcome back'}</h1>
                    <p className="subtitle">{accessToken ? `Welcome, ${apiStatus.user?.username || username}.` : 'Sign in to continue to your account.'}</p>
                </div>

                {accessToken ? (
                    <>
                        <div className={apiStatus.error ? 'error-message' : 'success-message'} role={apiStatus.error ? 'alert' : 'status'}>
                            <span className={apiStatus.error ? 'error-icon' : 'success-icon'} aria-hidden="true">
                                {apiStatus.error ? '!' : '✓'}
                            </span>
                            <span>{statusMessage}</span>
                        </div>
                        <button className="submit-button" type="button" onClick={handleLogout}>Sign out</button>
                    </>
                ) : (
                    <>
                        {loginError && (
                            <div className="error-message" role="alert">
                                <span className="error-icon" aria-hidden="true">!</span>
                                <span>{loginError}</span>
                            </div>
                        )}
                        <button
                            className="submit-button oauth-button"
                            type="button"
                            onClick={handleOAuthLogin}
                            disabled={isOAuthLoading}
                        >
                            {isOAuthLoading ? 'Connecting to Keycloak…' : 'Sign in with Keycloak'}
                        </button>
                        <div className="login-divider" aria-hidden="true"><span>or</span></div>
                        <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-field">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <button className="submit-button" type="submit" disabled={isLoading}>
                            {isLoading ? 'Signing in…' : <>Sign in <span aria-hidden="true">→</span></>}
                        </button>
                        </form>
                    </>
                )}

                <div className="security-note">
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                        <rect x="4.5" y="8.5" width="11" height="8" rx="2" />
                        <path d="M7 8.5V6a3 3 0 0 1 6 0v2.5" />
                    </svg>
                    <span>Your connection is protected and encrypted</span>
                </div>
            </section>
            <p className="page-footer">© 2025 Secure Portal. All rights reserved.</p>
        </main>
    );
}

export default App;
