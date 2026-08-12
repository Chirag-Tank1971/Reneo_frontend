import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

export function AuthPage() {
  const { signIn, signUp, session, profile, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--muted)]">
        Loading...
      </div>
    );
  }

  if (session) {
    return <Navigate to={profile?.role === 'SELLER' ? '/seller' : '/'} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, role, fullName);
        setMessage('Account created. If email confirmation is enabled, check your inbox before signing in.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
      <section className="card p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)]">Welcome</p>
        <h1 className="font-display mt-2 text-4xl text-white">Shop or sell on Reneo</h1>
        <p className="mt-4 text-[var(--muted)]">
          Sign in with Supabase Auth. Customers browse and order products. Sellers manage inventory
          through the same secure backend API.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-[var(--muted)]">
          <li>• Server-side pricing and stock validation</li>
          <li>• Idempotent checkout with duplicate protection</li>
          <li>• Role-based seller and customer experiences</li>
        </ul>
      </section>

      <section className="card p-8">
        <div className="mb-6 flex gap-2 rounded-xl bg-[var(--surface-2)] p-1">
          <button
            type="button"
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'signin' ? 'bg-[var(--surface)] text-white' : 'text-[var(--muted)]'}`}
            onClick={() => setMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'signup' ? 'bg-[var(--surface)] text-white' : 'text-[var(--muted)]'}`}
            onClick={() => setMode('signup')}
          >
            Create account
          </button>
        </div>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          {mode === 'signup' && (
            <>
              <div>
                <label className="mb-1 block text-sm text-[var(--muted)]">Full name</label>
                <input
                  className="input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--muted)]">Account type</label>
                <select
                  className="input"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="CUSTOMER">Customer — browse & order</option>
                  <option value="SELLER">Seller — manage products</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[#fecdd3]">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/10 px-3 py-2 text-sm text-[#bbf7d0]">
              {message}
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </section>
    </div>
  );
}
