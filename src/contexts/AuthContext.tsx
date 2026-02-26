import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '@/types';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

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
      const newUser: User = {
        id: auth.user.uid,
        username: auth.user.username || 'Pioneer',
        piUid: auth.user.uid,
        balance: 0,
        accessToken: auth.accessToken,
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

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
