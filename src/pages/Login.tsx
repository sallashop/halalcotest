import { useNavigate } from 'react-router-dom';
import { LogIn, Leaf, ShoppingBag, Shield, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { useState } from 'react';

const Login = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [isAttempting, setIsAttempting] = useState(false);

  const handleLogin = async () => {
    if (isAttempting || isLoading) return;
    setIsAttempting(true);
    try {
      const success = await login();
      if (success) setTimeout(() => navigate('/profile', { replace: true }), 100);
    } finally {
      setIsAttempting(false);
    }
  };

  const features = [
    { icon: ShoppingBag, label: language === 'ar' ? 'تسوق المنتجات الزراعية' : 'Shop agricultural products' },
    { icon: Shield, label: language === 'ar' ? 'دفع آمن بعملة Pi' : 'Secure Pi payments' },
    { icon: Truck, label: language === 'ar' ? 'توصيل لباب المنزل' : 'Home delivery' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto flex items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <Card className="w-full max-w-md overflow-hidden border-0 card-shadow rounded-3xl bg-card">
            <div className="gradient-hero px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-md">
                <Leaf className="h-10 w-10 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-primary-foreground mb-1">Halalco</h1>
              <p className="text-sm text-primary-foreground/80">{t('loginDescription')}</p>
            </div>
            <CardContent className="p-6">
              <div className="space-y-3 mb-6">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <f.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{f.label}</span>
                  </div>
                ))}
              </div>
              <Button onClick={handleLogin} disabled={isLoading || isAttempting} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base rounded-xl">
                {isLoading ? <span className="animate-spin h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full" /> : <><LogIn className="h-5 w-5 me-2" />{t('loginWithPi')}</>}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-4">
                {language === 'ar' ? 'بالتسجيل أنت توافق على شروط الاستخدام' : 'By signing in you agree to our Terms of Use'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
