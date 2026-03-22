import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '@/types';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    Pi?: {
      init: (config: { version: string; sandbox: boolean }) => void;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: any) => void
      ) => Promise<{ accessToken: string; user: { uid: string; username?: string } }>;
      createPayment: (
        config: { amount: number; memo: string; metadata: any },
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => void;
          onReadyForServerCompletion: (paymentId: string, txid: string) => void;
          onCancel: (paymentId: string) => void;
          onError: (error: Error, payment?: any) => void;
        }
      ) => void;
    };
  }
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('gh_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const login = useCallback(async (): Promise<boolean> => {
    if (!window.Pi) {
      toast.error('يرجى فتح التطبيق من داخل Pi Browser / Please open the app inside Pi Browser');
      return false;
    }
    setIsLoading(true);
    try {
      // Add a timeout so the button doesn't stay loading forever
      const authPromise = window.Pi.authenticate(
        ['username', 'payments'],
        (payment) => console.log('Incomplete payment:', payment)
      );
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15000)
      );
      const auth = await Promise.race([authPromise, timeoutPromise]);
      // Upsert profile in database
      let isAdmin = false;
      let role = 'user';
      try {
        const { error: upsertError } = await supabase.from('profiles').upsert({
          user_id: auth.user.uid,
          pi_uid: auth.user.uid,
          username: auth.user.username || 'Pioneer',
        }, { onConflict: 'pi_uid' });
        if (upsertError) console.error('Profile upsert error:', upsertError);

        // Fetch profile to get admin status and role
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, balance, role')
          .eq('pi_uid', auth.user.uid)
          .single();
        if (profile) {
          isAdmin = profile.is_admin ?? false;
          role = profile.role || 'user';
        }
      } catch (e) {
        console.error('Profile error:', e);
      }

      const newUser: User = {
        id: auth.user.uid,
        username: auth.user.username || 'Pioneer',
        piUid: auth.user.uid,
        balance: 0,
        accessToken: auth.accessToken,
        isAdmin: isAdmin || role === 'admin',
        role,
      };
      setUser(newUser);
      localStorage.setItem('gh_user', JSON.stringify(newUser));
      toast.success(t('welcome'));
      return true;
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error?.message === 'timeout') {
        toast.error('انتهت مهلة الاتصال. تأكد أنك داخل Pi Browser / Connection timed out. Make sure you are inside Pi Browser');
      } else {
        toast.error(t('error'));
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('gh_user');
    toast.success(t('logout'));
  }, [t]);

  // Silent token refresh - re-authenticates with Pi SDK without UI feedback
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!window.Pi) return false;
    try {
      const auth = await window.Pi.authenticate(
        ['username', 'payments'],
        (payment) => console.log('Incomplete payment:', payment)
      );
      if (user) {
        const updatedUser = { ...user, accessToken: auth.accessToken };
        setUser(updatedUser);
        localStorage.setItem('gh_user', JSON.stringify(updatedUser));
      }
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
