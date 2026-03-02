import { useNavigate } from 'react-router-dom';
import { User, Package, LogOut, MapPin, Phone, Calendar, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PriceDisplay from '@/components/products/PriceDisplay';

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
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  const { data: ordersData, isLoading } = useQuery({
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

  const memberSince = new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">{t('profile')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Info */}
          <Card className="border-border/50 bg-card">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h2 className="font-bold text-foreground text-lg mb-1">{user.username}</h2>
              <p className="text-xs text-muted-foreground mb-4">
                <Calendar className="inline h-3 w-3 me-1" />
                {language === 'ar' ? `عضو منذ ${memberSince}` : `Member since ${memberSince}`}
              </p>

              <div className="text-sm text-muted-foreground mb-4 space-y-1">
                <p>
                  <ShoppingBag className="inline h-3.5 w-3.5 me-1" />
                  {orders.length} {language === 'ar' ? 'طلب' : 'orders'}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => { logout(); navigate('/'); }}
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
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
                  <Badge variant="secondary" className="ms-auto text-xs">
                    {orders.length}
                  </Badge>
                </div>

                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-sm">{t('loading')}</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">{t('noOrders')}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'ar'
                        ? 'ابدأ التسوق الآن وستظهر طلباتك هنا'
                        : 'Start shopping and your orders will appear here'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => navigate('/products')}
                    >
                      {t('shopNow')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order: any) => {
                      const isExpanded = expandedOrder === order.id;
                      return (
                        <div
                          key={order.id}
                          className="rounded-xl border border-border/50 overflow-hidden transition-colors hover:border-border"
                        >
                          {/* Order header - clickable */}
                          <button
                            className="w-full p-4 text-start flex items-center justify-between"
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold text-foreground">
                                  #{order.id.slice(0, 8)}
                                </p>
                                <Badge className={statusColors[order.status] || ''}>
                                  {t(order.status as any)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>
                                  {new Date(order.created_at).toLocaleDateString(
                                    language === 'ar' ? 'ar-EG' : 'en-US',
                                    { year: 'numeric', month: 'short', day: 'numeric' }
                                  )}
                                </span>
                                <span className="font-bold text-primary">
                                  {order.total?.toFixed(4)} π
                                </span>
                                {order.items?.length > 0 && (
                                  <span>
                                    {order.items.length} {language === 'ar' ? 'منتج' : 'items'}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                          </button>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="border-t border-border/50 p-4 space-y-4 bg-muted/30">
                              {/* Items */}
                              {order.items?.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-foreground mb-2">
                                    {language === 'ar' ? 'المنتجات' : 'Products'}
                                  </p>
                                  <div className="space-y-2">
                                    {order.items.map((item: any) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between text-sm"
                                      >
                                        <span className="text-muted-foreground">
                                          {language === 'ar'
                                            ? item.products?.name_ar
                                            : item.products?.name_en}{' '}
                                          <span className="text-xs">× {item.quantity}</span>
                                        </span>
                                        <span className="font-medium text-foreground">
                                          {Number(item.price).toFixed(4)} π
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Shipping info */}
                              {(order.shipping_name || order.shipping_address) && (
                                <div>
                                  <p className="text-xs font-semibold text-foreground mb-2">
                                    {t('shippingInfo')}
                                  </p>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    {order.shipping_name && (
                                      <p>
                                        <User className="inline h-3 w-3 me-1" />
                                        {order.shipping_name}
                                      </p>
                                    )}
                                    {order.shipping_phone && (
                                      <p>
                                        <Phone className="inline h-3 w-3 me-1" />
                                        {order.shipping_phone}
                                      </p>
                                    )}
                                    {order.shipping_address && (
                                      <p>
                                        <MapPin className="inline h-3 w-3 me-1" />
                                        {order.shipping_address}
                                        {order.shipping_city ? `, ${order.shipping_city}` : ''}
                                      </p>
                                    )}
                                    {order.shipping_notes && (
                                      <p className="italic">{order.shipping_notes}</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Pi price at order */}
                              {order.pi_price_at_order && (
                                <p className="text-xs text-muted-foreground">
                                  {language === 'ar'
                                    ? `سعر Pi وقت الطلب: $${Number(order.pi_price_at_order).toFixed(4)}`
                                    : `Pi price at order: $${Number(order.pi_price_at_order).toFixed(4)}`}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
