import { useNavigate } from 'react-router-dom';
import { User, Package, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const statusColors: Record<string, string> = {
  pending: 'bg-accent/20 text-accent-foreground',
  confirmed: 'bg-primary/20 text-primary',
  shipped: 'bg-secondary text-secondary-foreground',
  delivered: 'bg-primary/10 text-primary',
  cancelled: 'bg-destructive/20 text-destructive',
};

const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  const { data: ordersData } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-orders', {
        body: { userId: user?.id },
      });
      if (error) throw error;
      return data?.orders || [];
    },
    enabled: !!user?.id,
  });

  const orders = ordersData || [];

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
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">{t('noOrders')}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'ar'
                        ? 'ابدأ التسوق الآن وستظهر طلباتك هنا'
                        : 'Start shopping and your orders will appear here'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order: any) => (
                      <div key={order.id} className="rounded-xl border border-border/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-foreground">#{order.id.slice(0, 8)}</p>
                          <Badge className={statusColors[order.status] || ''}>
                            {t(order.status as any)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{new Date(order.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                          <span className="font-bold text-primary">{order.total?.toFixed(4)} π</span>
                        </div>
                        {order.items?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {order.items.map((item: any) => (
                              <p key={item.id} className="text-xs text-muted-foreground">
                                {language === 'ar' ? item.products?.name_ar : item.products?.name_en} × {item.quantity}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
