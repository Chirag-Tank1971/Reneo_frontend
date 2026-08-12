import { Link, NavLink, Outlet } from 'react-router-dom';
import { CartToast } from './CartToast';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { profile, cartCount, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link to="/" className="font-display text-2xl tracking-tight text-white">
            Reneo<span className="text-[var(--accent)]">.</span>
          </Link>

          <nav className="flex items-center gap-4 text-sm text-[var(--muted)] sm:gap-6">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'text-white' : '')}>
              Marketplace
            </NavLink>
            {profile?.role === 'SELLER' && (
              <NavLink to="/seller" className={({ isActive }) => (isActive ? 'text-white' : '')}>
                Seller Studio
              </NavLink>
            )}
            {profile?.role === 'CUSTOMER' && (
              <NavLink to="/cart" className={({ isActive }) => (isActive ? 'text-white' : '')}>
                Cart {cartCount > 0 ? `(${cartCount})` : ''}
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {profile ? (
              <>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-white">{profile.full_name ?? profile.email}</p>
                  <p className="text-xs text-[var(--muted)]">{profile.role}</p>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => void signOut()}>
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/auth" className="btn btn-primary">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <Outlet />
      </main>

      <CartToast />
    </div>
  );
}
