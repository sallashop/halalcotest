import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// مكون تنسيق السعر
const PriceFormatter = ({ value, className = "" }: { value: number, className?: string }) => {
  const formatted = value.toFixed(7);
  const [intPart, decPart] = formatted.split('.');
  const isLargeNumber = parseInt(intPart) > 0;

  if (!isLargeNumber) {
     return <span className={className}>{formatted}</span>;
  }

  return (
    <span className={cn("inline-flex items-baseline", className)}>
      <span>{intPart}</span>
      <span className="text-[0.6em] font-medium opacity-85 ml-0.5">.{decPart}</span>
    </span>
  );
};

// مكون التحكم في الكمية - Soft UI & Borderless مع دعم الوزن
const QuantityControl = ({ 
  quantity, 
  onUpdate,
  isWeight = false 
}: { 
  quantity: number; 
  onUpdate: (newQty: number) => void;
  isWeight?: boolean;
}) => {
  const [localValue, setLocalValue] = useState(quantity.toString());

  useEffect(() => {
    setLocalValue(quantity.toString());
  }, [quantity]);

  const step = isWeight ? 0.5 : 1;
  const minVal = isWeight ? 0.5 : 1;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val); 

    // السماح للمستخدم بتفريغ الحقل مؤقتاً أثناء الكتابة
    if (val === '') return;

    const newQty = isWeight ? parseFloat(val) : parseInt(val);
    if (!isNaN(newQty) && newQty >= minVal) {
      onUpdate(isWeight ? Math.round(newQty * 10) / 10 : newQty);
    }
  };

  const handleBlur = () => {
    const currentNum = isWeight ? parseFloat(localValue) : parseInt(localValue);
    if (localValue === '' || isNaN(currentNum) || currentNum < minVal) {
      setLocalValue(quantity.toString());
      onUpdate(quantity);
    }
  };

  const handleDecrement = () => {
    const newQty = quantity - step;
    if (newQty >= minVal) {
      onUpdate(isWeight ? Math.round(newQty * 10) / 10 : newQty);
    }
  };

  const handleIncrement = () => {
    const newQty = quantity + step;
    onUpdate(isWeight ? Math.round(newQty * 10) / 10 : newQty);
  };

  return (
    <div className="flex items-center gap-1 bg-muted/40 rounded-[1rem] p-1 shadow-inner">
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-background shadow-sm hover:bg-background/80 hover:shadow text-muted-foreground hover:text-destructive transition-all border-0"
        onClick={handleDecrement}
        disabled={quantity <= minVal}
      >
        <Minus className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2.5} />
      </Button>

      <Input 
        type="number" 
        min={minVal}
        step={step}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur} 
        className="w-10 sm:w-14 h-7 sm:h-8 text-xs sm:text-sm text-center font-bold bg-transparent border-none shadow-none focus-visible:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-background shadow-sm hover:bg-background/80 hover:shadow text-muted-foreground hover:text-primary transition-all border-0"
        onClick={handleIncrement}
      >
        <Plus className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2.5} />
      </Button>
    </div>
  );
};

const Cart = () => {
  const { t, language } = useLanguage();
  const { items, removeItem, updateQuantity, total } = useCart();
  const { isAuthenticated } = useAuth();

  const getName = (p: typeof items[0]['product']) => language === 'ar' ? p.name_ar : p.name_en;
  const getUnit = (p: typeof items[0]['product']) => language === 'ar' ? (p.unit_ar || 'كيلو') : (p.unit_en || 'kg');

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-8 relative">
            <div className="absolute inset-0 rounded-full gradient-pi blur-3xl opacity-20" />
            <div className="relative flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary/10 to-secondary/10 shadow-inner">
              <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-primary/60" strokeWidth={2.5} />
            </div>
          </div>
          
          <h2 className="mb-3 text-2xl sm:text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-center">
            {t('emptyCartTitle') || t('emptyCart')}
          </h2>
          
          <p className="mb-8 text-muted-foreground font-medium text-sm sm:text-base text-center max-w-md">
            {t('emptyCartMsg') || t('emptyCart')}
          </p>
          
          <Link to="/products">
            <Button size="lg" className="gap-3 gradient-pi shadow-lg shadow-primary/20 px-8 py-6 text-base font-bold rounded-2xl border-0 hover:-translate-y-0.5 transition-transform">
              <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
              {t('continueShopping')}
              <ArrowLeft className={cn("h-5 w-5", language === 'en' && "rotate-180")} strokeWidth={2.5} />
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[1.5rem] bg-primary/10 shadow-inner shrink-0">
            <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7 text-primary" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">{t('shoppingCart')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Cart Items with AnimatePresence */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.div 
                  key={item.product.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden border-0 shadow-[0_2px_15px_rgb(0,0,0,0.03)] bg-card hover:bg-muted/20 transition-colors duration-300 rounded-[1.5rem]">
                    <CardContent className="flex gap-4 p-4 sm:p-5">
                      
                      <div className="relative shrink-0">
                        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-[1rem] overflow-hidden bg-background shadow-inner">
                          <img 
                            src={item.product.image_url || '/placeholder.svg'} 
                            alt={getName(item.product)} 
                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" 
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-1 flex-col justify-between min-w-0 py-1">
                        <div className="text-start">
                          <h3 className="font-bold text-sm sm:text-base text-foreground/90 truncate">{getName(item.product)}</h3>
                          <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-muted-foreground bg-muted/40 w-fit px-2 py-0.5 rounded-lg">
                            <span dir="ltr">{item.product.price} Pi</span>
                            <span>/ {getUnit(item.product)}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-end justify-between gap-3 mt-3">
                          <div className="scale-90 origin-bottom-right sm:scale-100 sm:origin-bottom-center rtl:origin-bottom-left">
                             {/* ✅ تمرير خاصية isWeight لتفعيل الكسور في الإدخال */}
                             <QuantityControl 
                                quantity={item.quantity} 
                                onUpdate={(newQty) => updateQuantity(item.product.id, newQty)} 
                                isWeight={item.product.unit_type === 'weight'}
                             />
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-end font-black text-lg sm:text-xl text-primary" dir="ltr">
                               <div className="flex items-baseline gap-1">
                                  <PriceFormatter value={item.product.price * item.quantity} />
                                  <span className="text-xs sm:text-sm text-primary/80">Pi</span>
                               </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-colors border-0 shadow-sm" 
                              onClick={() => removeItem(item.product.id)}
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                            </Button>
                          </div>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 delay-300 fill-mode-both">
            <Card className="border-0 shadow-xl shadow-black/5 bg-card rounded-[2rem] sticky top-24 overflow-hidden">
              <div className="bg-muted/10 p-5 border-b border-border/10">
                <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-3">
                   <div className="p-2 bg-primary/10 rounded-xl shadow-inner text-primary">
                     <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
                   </div>
                   {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                </h2>
              </div>

              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="bg-muted/20 rounded-[1.5rem] p-4 shadow-inner space-y-3 border-0">
                  {items.map(item => (
                    <div key={item.product.id} className="flex justify-between text-xs sm:text-sm font-bold text-muted-foreground">
                      <span className="truncate pr-4">{getName(item.product)} <span className="text-foreground">× {item.quantity}</span></span>
                      <span className="shrink-0 text-foreground" dir="ltr">{(item.product.price * item.quantity).toFixed(4)} Pi</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center bg-primary/5 p-4 rounded-[1.5rem] shadow-sm border-0">
                    <span className="text-base sm:text-lg font-black text-foreground">{t('total')}</span>
                    <div className="text-end" dir="ltr">
                      <div className="text-2xl sm:text-3xl font-black text-primary flex items-baseline gap-1">
                         <PriceFormatter value={total} />
                         <span className="text-sm sm:text-base text-primary/80">Pi</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Link to={isAuthenticated ? '/checkout' : '/login'} className="block">
                    <Button className="w-full gap-3 gradient-pi shadow-lg shadow-primary/20 h-16 text-base sm:text-lg font-black transition-transform hover:-translate-y-0.5 active:scale-95 rounded-2xl border-0">
                      {isAuthenticated ? t('checkout') : t('login')}
                      <ArrowLeft className={cn("h-5 w-5 sm:h-6 sm:w-6", language === 'en' && "rotate-180")} strokeWidth={2.5} />
                    </Button>
                  </Link>
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

export default Cart;
