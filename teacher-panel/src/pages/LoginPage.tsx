import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { session, profile, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session && profile?.role === 'teacher' && profile.is_approved) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);

    if (signInError) {
      setError(signInError);
      return;
    }

    navigate('/');
  };

  return (
    <div className="centered-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-title">LinguaPro</h1>
        <p className="login-subtitle">Panel del profesor</p>

        {error && <div className="alert alert-error">{error}</div>}

        <label className="field-label" htmlFor="email">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />

        <label className="field-label" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
