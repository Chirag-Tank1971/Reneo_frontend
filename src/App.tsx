import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { CartPage } from './pages/CartPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { SellerPage } from './pages/SellerPage';

function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: 'SELLER' | 'CUSTOMER';
}) {
  const { session, profile, loading, profileLoading } = useAuth();

  if (loading || (session && profileLoading)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--muted)]">
        Loading session...
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  if (role && profile?.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={
            <ProtectedRoute>
              <MarketplacePage />
            </ProtectedRoute>
          }
        />
        <Route path="auth" element={<AuthPage />} />
        <Route
          path="seller"
          element={
            <ProtectedRoute role="SELLER">
              <SellerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="cart"
          element={
            <ProtectedRoute role="CUSTOMER">
              <CartPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
