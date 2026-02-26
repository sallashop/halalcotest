import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion, AnimatePresence } from 'framer-motion';

const Cart = () => {
  const { t, language } = useLanguage();
  const { items, removeItem, updateQuantity, total } = useCart();
  const { isAuthenticated } = useAuth();

  const getName = (p: typeof items[0]['product']) => language === 'ar' ? p.name_ar : p.name_en;
  const getUnit = (p: typeof items[0]['product']) => language === 'ar' ? (p.unit_ar || 'كيلو') : (p.unit_en || 'kg');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">{t('shoppingCart')}</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">{t('emptyCart')}</p>
            <Link to="/products">
              <Button className="bg-primary text-primary-foreground">{t('continueShopping')}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence>
                {items.map(item => (
                  <motion.div key={item.product.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Card className="border-border/50 bg-card">
                      <CardContent className="flex items-center gap-4 p-4">
                        <img src={item.product.image_url || '/placeholder.svg'} alt={getName(item.product)} className="h-20 w-20 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm truncate">{getName(item.product)}</h3>
                          <p className="text-sm text-primary font-bold mt-1">{item.product.price} {t('piCurrency')} / {getUnit(item.product)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 border-border" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-semibold text-foreground w-6 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8 border-border" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => removeItem(item.product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div>
              <Card className="border-border/50 bg-card sticky top-20">
                <CardContent className="p-6">
                  <h2 className="font-bold text-foreground mb-4">{language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h2>
                  <div className="space-y-2 mb-4">
                    {items.map(item => (
                      <div key={item.product.id} className="flex justify-between text-sm text-muted-foreground">
                        <span>{getName(item.product)} × {item.quantity}</span>
                        <span>{(item.product.price * item.quantity).toFixed(4)} π</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between items-center mb-6">
                    <span className="font-bold text-foreground">{t('total')}</span>
                    <span className="font-bold text-primary text-lg">{total.toFixed(4)} π</span>
                  </div>
                  <Link to={isAuthenticated ? '/checkout' : '/login'}>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                      {isAuthenticated ? t('checkout') : t('login')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
