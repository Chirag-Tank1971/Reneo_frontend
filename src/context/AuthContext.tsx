import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { clearCartStorage, loadCart, saveCart } from '../lib/cartStorage';
import { supabase } from '../lib/supabase';
import type { CartItem, Profile, UserRole } from '../types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  cart: CartItem[];
  cartCount: number;
  cartToast: { productName: string; quantity: number } | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  dismissCartToast: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mergeCartItem(cart: CartItem[], item: CartItem): CartItem[] {
  const existing = cart.find((entry) => entry.product.id === item.product.id);
  if (!existing) return [...cart, item];

  return cart.map((entry) =>
    entry.product.id === item.product.id
      ? {
          ...entry,
          quantity: Math.min(entry.quantity + item.quantity, entry.product.quantity),
        }
      : entry,
  );
}

async function resolveSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;

  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) {
    await supabase.auth.signOut();
    return null;
  }

  return session;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const userIdRef = useRef<string | null>(null);
  const hydratedUserIdRef = useRef<string | null>(null);
  const sessionBootstrappedRef = useRef(false);
  const cartRef = useRef<CartItem[]>([]);

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartToast, setCartToast] = useState<{ productName: string; quantity: number } | null>(
    null,
  );

  const resolveUserId = useCallback((): string | null => {
    return userIdRef.current ?? profile?.id ?? null;
  }, [profile?.id]);

  const persistCart = useCallback(
    (items: CartItem[]) => {
      const userId = resolveUserId();
      if (!userId) {
        if (import.meta.env.DEV) {
          console.warn('[Reneo] Cart not saved: user id unavailable yet.');
        }
        return;
      }
      saveCart(userId, items);
    },
    [resolveUserId],
  );

  const replaceCart = useCallback(
    (next: CartItem[], options?: { persist?: boolean }) => {
      cartRef.current = next;
      setCart(next);
      if (options?.persist !== false) {
        persistCart(next);
      }
    },
    [persistCart],
  );

  const hydrateCartForUser = useCallback(
    (userId: string) => {
      userIdRef.current = userId;

      if (hydratedUserIdRef.current === userId) return;

      hydratedUserIdRef.current = userId;
      replaceCart(loadCart(userId), { persist: false });
    },
    [replaceCart],
  );

  const refreshProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setProfile(null);
        return;
      }

      userIdRef.current = user.id;
      hydrateCartForUser(user.id);

      const { data } = await supabase
        .from('profiles')
        .select('id, role, email, full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
        return;
      }

      setProfile({
        id: user.id,
        email: user.email ?? '',
        role: (user.user_metadata?.role as UserRole) ?? 'CUSTOMER',
        full_name: (user.user_metadata?.full_name as string) ?? null,
      });
    } finally {
      setProfileLoading(false);
    }
  }, [hydrateCartForUser]);

  useEffect(() => {
    void resolveSession().then((validSession) => {
      setSession(validSession);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        userIdRef.current = null;
        hydratedUserIdRef.current = null;
        sessionBootstrappedRef.current = false;
        cartRef.current = [];
        setSession(null);
        setProfile(null);
        setCart([]);
        return;
      }

      if (!nextSession) return;

      void supabase.auth.getUser().then(({ data: userData, error }) => {
        if (error || !userData.user) {
          void supabase.auth.signOut();
          return;
        }

        userIdRef.current = userData.user.id;

        if (event === 'SIGNED_IN') {
          sessionBootstrappedRef.current = false;
          hydratedUserIdRef.current = null;
        }

        setSession(nextSession);
      });
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!session) {
      sessionBootstrappedRef.current = false;
      return;
    }

    if (sessionBootstrappedRef.current) return;
    sessionBootstrappedRef.current = true;

    void refreshProfile();
  }, [loading, session, refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, role: UserRole, fullName: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role, full_name: fullName },
        },
      });
      if (error) throw error;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    userIdRef.current = null;
    hydratedUserIdRef.current = null;
    sessionBootstrappedRef.current = false;
    cartRef.current = [];
    setCart([]);
    setCartToast(null);
  }, []);

  const dismissCartToast = useCallback(() => setCartToast(null), []);

  useEffect(() => {
    if (!cartToast) return;
    const timer = window.setTimeout(() => setCartToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [cartToast]);

  const addToCart = useCallback(
    (item: CartItem) => {
      replaceCart(mergeCartItem(cartRef.current, item));
      setCartToast({ productName: item.product.name, quantity: item.quantity });
    },
    [replaceCart],
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      replaceCart(
        cartRef.current
          .map((entry) => (entry.product.id === productId ? { ...entry, quantity } : entry))
          .filter((entry) => entry.quantity > 0),
      );
    },
    [replaceCart],
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      replaceCart(cartRef.current.filter((entry) => entry.product.id !== productId));
    },
    [replaceCart],
  );

  const clearCart = useCallback(() => {
    const userId = resolveUserId();
    if (userId) clearCartStorage(userId);
    replaceCart([], { persist: false });
  }, [replaceCart, resolveUserId]);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      profileLoading,
      cart,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      cartToast,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      dismissCartToast,
    }),
    [
      session,
      profile,
      loading,
      profileLoading,
      cart,
      cartToast,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      dismissCartToast,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
