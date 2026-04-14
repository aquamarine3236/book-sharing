import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username, password) => {
    const email = `${username}@bookaholic.local`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const register = async (displayName, username, password) => {
    const email = `${username}@bookaholic.local`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, username } },
    });
    if (error) throw error;
    if (data.user) {
      await supabase.from('users').upsert({
        id:           data.user.id,
        display_name: displayName,
        username,
        provider:     'email',
        created_at:   new Date().toISOString(),
      });
    }
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const getDisplayName = (u = user) =>
    u?.user_metadata?.display_name || u?.user_metadata?.username || 'Anonymous';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, getDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
}
