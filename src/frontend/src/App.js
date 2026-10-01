import React, { useState } from 'react';
import './App.css';

function LoginForm({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [signedInAs, setSignedInAs] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Unable to sign in. Check your credentials and try again.');
            }

            const token = data.accessToken || data.token;
            if (typeof token !== 'string' || token.length === 0) {
                throw new Error('The sign-in response did not include an access token.');
            }

            localStorage.setItem('token', token);
            setSignedInAs(username);
            if (onLoginSuccess) {
                onLoginSuccess(token);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
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
                    <h1 id="login-title">{signedInAs ? 'You’re signed in' : 'Welcome back'}</h1>
                    <p className="subtitle">
                        {signedInAs
                            ? `Your account is ready, ${signedInAs}.`
                            : 'Sign in to continue to your account.'}
                    </p>
                </div>

                {signedInAs ? (
                    <div className="success-message" role="status">
                        <span className="success-icon" aria-hidden="true">✓</span>
                        <span>Your session has been securely authenticated.</span>
                    </div>
                ) : (
                    <form className="login-form" onSubmit={handleSubmit}>
                        {error && (
                            <div className="error-message" role="alert">
                                <span className="error-icon" aria-hidden="true">!</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-field">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                autoComplete="username"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-field">
                            <div className="password-label-row">
                                <label htmlFor="password">Password</label>
                            </div>
                            <div className="password-input-wrap">
                                <input
                                    type={isPasswordVisible ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    className="password-toggle"
                                    type="button"
                                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                                    aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                                    aria-pressed={isPasswordVisible}
                                    disabled={isLoading}
                                >
                                    {isPasswordVisible ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <button className="submit-button" type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <span className="loading-spinner" aria-hidden="true" />
                                    Signing in…
                                </>
                            ) : (
                                <>Sign in <span aria-hidden="true">→</span></>
                            )}
                        </button>
                    </form>
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

export default LoginForm;
