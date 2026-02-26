import { useNavigate } from 'react-router-dom';
import { User, Package, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useEffect } from 'react';

const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">{t('profile')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Info */}
          <Card className="border-border/50 bg-card">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-bold text-foreground text-lg">{user.username}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Pi UID: {user.piUid.slice(0, 8)}...
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { logout(); navigate('/'); }}
                className="mt-4 text-destructive border-destructive/30 hover:bg-destructive/5"
              >
                <LogOut className="h-4 w-4 me-1" />
                {t('logout')}
              </Button>
            </CardContent>
          </Card>

          {/* Orders */}
          <div className="md:col-span-2">
            <Card className="border-border/50 bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="font-bold text-foreground">{t('myOrders')}</h2>
                </div>
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">{t('noOrders')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar'
                      ? 'ابدأ التسوق الآن وستظهر طلباتك هنا'
                      : 'Start shopping and your orders will appear here'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
