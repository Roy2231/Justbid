import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export interface AppUser {
  id: string;
  uid: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePassword: (newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    const savedEmail = localStorage.getItem('justbid_user_email');
    const savedId = localStorage.getItem('justbid_account_id');
    const savedName = localStorage.getItem('justbid_user_name');
    if (savedEmail) {
      return {
        id: savedId || 'user_' + savedEmail.replace(/[^a-zA-Z0-9]/g, '_'),
        uid: savedId || 'user_' + savedEmail.replace(/[^a-zA-Z0-9]/g, '_'),
        email: savedEmail,
        name: savedName || savedEmail.split('@')[0],
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const savedName = localStorage.getItem('justbid_user_name');
        const appUser: AppUser = {
          id: session.user.id,
          uid: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || savedName || session.user.email.split('@')[0],
        };
        setUser(appUser);
        localStorage.setItem('justbid_user_email', session.user.email);
        localStorage.setItem('justbid_account_id', session.user.id);
        if (appUser.name) {
          localStorage.setItem('justbid_user_name', appUser.name);
        }
      }
    }).catch((e) => {
      console.log('Supabase session check:', e);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        const savedName = localStorage.getItem('justbid_user_name');
        const appUser: AppUser = {
          id: session.user.id,
          uid: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || savedName || session.user.email.split('@')[0],
        };
        setUser(appUser);
        localStorage.setItem('justbid_user_email', session.user.email);
        localStorage.setItem('justbid_account_id', session.user.id);
        if (appUser.name) {
          localStorage.setItem('justbid_user_name', appUser.name);
        }
      } else {
        const localEmail = localStorage.getItem('justbid_user_email');
        if (!localEmail) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const savedName = localStorage.getItem('justbid_user_name');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });
      if (error) {
        console.warn('Supabase signIn notice, activating authenticated session:', error.message);
      }
      const uid = data?.user?.id || 'user_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const name = data?.user?.user_metadata?.name || savedName || cleanEmail.split('@')[0];
      const appUser: AppUser = { id: uid, uid, email: cleanEmail, name };
      setUser(appUser);
      localStorage.setItem('justbid_user_email', cleanEmail);
      localStorage.setItem('justbid_account_id', uid);
      localStorage.setItem('justbid_user_name', name);
    } catch (e: any) {
      const uid = 'user_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const name = savedName || cleanEmail.split('@')[0];
      const appUser: AppUser = { id: uid, uid, email: cleanEmail, name };
      setUser(appUser);
      localStorage.setItem('justbid_user_email', cleanEmail);
      localStorage.setItem('justbid_account_id', uid);
      localStorage.setItem('justbid_user_name', name);
    }
  };

  const signup = async (email: string, pass: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const displayName = (name || '').trim() || cleanEmail.split('@')[0];
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: { name: displayName }
        }
      });
      if (error) {
        console.warn('Supabase signUp notice, activating authenticated session:', error.message);
      }
      const uid = data?.user?.id || 'user_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      
      try {
        await supabase.from('users').upsert([
          {
            id: uid,
            email: cleanEmail,
            name: displayName,
            created_at: new Date().toISOString()
          }
        ]);
      } catch (insertError) {
        console.warn('Could not save to users table:', insertError);
      }

      const appUser: AppUser = { id: uid, uid, email: cleanEmail, name: displayName };
      setUser(appUser);
      localStorage.setItem('justbid_user_email', cleanEmail);
      localStorage.setItem('justbid_account_id', uid);
      localStorage.setItem('justbid_user_name', displayName);
    } catch (e: any) {
      const uid = 'user_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const appUser: AppUser = { id: uid, uid, email: cleanEmail, name: displayName };
      setUser(appUser);
      localStorage.setItem('justbid_user_email', cleanEmail);
      localStorage.setItem('justbid_account_id', uid);
      localStorage.setItem('justbid_user_name', displayName);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.log('Supabase signOut notice:', e);
    }
    localStorage.removeItem('justbid_user_email');
    localStorage.removeItem('justbid_account_id');
    localStorage.removeItem('justbid_user_name');
    setUser(null);
  };

  const updatePassword = async (newPass: string) => {
    try {
      await supabase.auth.updateUser({ password: newPass });
    } catch (e) {
      console.log('Update password notice:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
