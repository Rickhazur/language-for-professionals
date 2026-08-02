import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-title">
          LinguaPro — Panel del profesor
        </Link>
        <div className="app-header-right">
          {profile?.full_name || profile?.email ? (
            <span className="app-user">{profile.full_name || profile.email}</span>
          ) : null}
          <button className="button button-secondary" onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
