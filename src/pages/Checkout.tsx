import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Phone, User as UserIcon, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ShippingForm {
  name: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
}

const Checkout = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [form, setForm] = useState<ShippingForm>({ name: '', phone: '', address: '', city: '', notes: '' });

  const updateField = (field: keyof ShippingForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const getName = (p: typeof items[0]['product']) => language === 'ar' ? p.name_ar : p.name_en;

  const handlePayWithPi = async () => {
    if (!form.name || !form.phone || !form.address || !form.city) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    if (!window.Pi) {
      toast.error('Pi SDK غير متاح');
      return;
    }
    setIsProcessing(true);
    try {
      window.Pi.createPayment(
        {
          amount: total,
          memo: language === 'ar' ? 'طلب من Halalco' : 'Order from Halalco',
          metadata: {
            items: items.map(i => ({ id: i.product.id, qty: i.quantity, price: i.product.price })),
            shipping: form,
            userId: user?.id,
          },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            try {
              const { data, error } = await supabase.functions.invoke('pi-approve', {
                body: {
                  paymentId,
                  userId: user?.id,
                  items: items.map(i => ({ id: i.product.id, qty: i.quantity, price: i.product.price })),
                  shipping: form,
                  total,
                },
              });
              if (error) {
                console.error('Approve error:', error);
                toast.error(t('error'));
              }
            } catch (err) {
              console.error('Approve call failed:', err);
              toast.error(t('error'));
            }
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            try {
              const { data, error } = await supabase.functions.invoke('pi-complete', {
                body: { paymentId, txid },
              });
              if (error) {
                console.error('Complete error:', error);
                toast.error(t('error'));
              } else {
                clearCart();
                toast.success(t('paymentSuccess'));
                navigate('/profile');
              }
            } catch (err) {
              console.error('Complete call failed:', err);
              toast.error(t('error'));
            }
          },
          onCancel: () => { setIsProcessing(false); toast.error(language === 'ar' ? 'تم إلغاء الدفع' : 'Payment cancelled'); },
          onError: () => { setIsProcessing(false); toast.error(t('error')); },
        }
      );
    } catch { toast.error(t('error')); setIsProcessing(false); }
  };

  if (items.length === 0) { navigate('/cart'); return null; }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex items-center gap-3 mb-8">
           <div className="flex h-12 w-12 items-center justify-center rounded-[1.5rem] bg-primary/10 shadow-inner shrink-0">
             <CreditCard className="h-6 w-6 text-primary" strokeWidth={2.5} />
           </div>
           <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('checkout')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            
            {/* Shipping Info Card - Soft UI */}
            <Card className="border-0 shadow-lg shadow-black/5 bg-card rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-muted/10 border-b border-border/10 pb-5">
                <CardTitle className="font-bold text-foreground flex items-center gap-3 text-xl">
                  <div className="p-2 bg-primary/10 rounded-xl shadow-inner text-primary">
                    <MapPin className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  {t('shippingInfo')}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-5 sm:p-6 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-foreground">{t('name')} *</Label>
                    <div className="relative">
                      <UserIcon className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={form.name} 
                        onChange={e => updateField('name', e.target.value)} 
                        className="ps-11 h-12 rounded-xl bg-muted/30 border-0 shadow-inner focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors" 
                        placeholder={language === 'ar' ? 'الاسم بالكامل' : 'Full Name'}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-foreground">{t('phone')} *</Label>
                    <div className="relative">
                      <Phone className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={form.phone} 
                        onChange={e => updateField('phone', e.target.value)} 
                        className="ps-11 h-12 rounded-xl bg-muted/30 border-0 shadow-inner focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors" 
                        dir="ltr"
                        placeholder="+00000000000"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="text-sm font-bold text-foreground">{t('address')} *</Label>
                    <Input 
                      value={form.address} 
                      onChange={e => updateField('address', e.target.value)} 
                      className="h-12 rounded-xl bg-muted/30 border-0 shadow-inner focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors" 
                      placeholder={language === 'ar' ? 'العنوان التفصيلي' : 'Detailed Address'}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-foreground">{t('city')} *</Label>
                    <Input 
                      value={form.city} 
                      onChange={e => updateField('city', e.target.value)} 
                      className="h-12 rounded-xl bg-muted/30 border-0 shadow-inner focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors" 
                      placeholder={language === 'ar' ? 'المدينة' : 'City'}
                    />
                  </div>
                  
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="text-sm font-bold text-foreground">{t('notes')}</Label>
                    <Textarea 
                      value={form.notes} 
                      onChange={e => updateField('notes', e.target.value)} 
                      className="min-h-[100px] rounded-xl bg-muted/30 border-0 shadow-inner focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors resize-none" 
                      placeholder={language === 'ar' ? 'أي ملاحظات إضافية للتوصيل...' : 'Any additional delivery notes...'}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-0 shadow-xl shadow-black/5 bg-card rounded-[2rem] sticky top-24 overflow-hidden">
              <div className="bg-muted/10 p-5 border-b border-border/10">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-3">
                   <div className="p-2 bg-primary/10 rounded-xl shadow-inner text-primary">
                     <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
                   </div>
                   {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                </h2>
              </div>
              
              <CardContent className="p-5 sm:p-6">
                <div className="bg-muted/20 rounded-[1.5rem] p-4 shadow-inner space-y-3 mb-6 border-0 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                  {items.map(item => (
                    <div key={item.product.id} className="flex justify-between items-center text-sm text-muted-foreground font-medium">
                      <span className="truncate pr-4 leading-relaxed flex-1">
                        {getName(item.product)} <span className="font-bold text-foreground">× {item.quantity}</span>
                      </span>
                      <span className="shrink-0 font-bold text-foreground" dir="ltr">{(item.product.price * item.quantity).toFixed(4)} π</span>
                    </div>
                  ))}
                </div>
                
                <div className="bg-primary/5 p-4 rounded-[1.5rem] shadow-sm border-0 mb-6 flex justify-between items-center">
                  <span className="font-bold text-foreground text-base">{t('total')}</span>
                  <div dir="ltr" className="flex items-baseline gap-1">
                    <span className="font-black text-primary text-xl">{total.toFixed(4)}</span>
                    <span className="font-bold text-primary/80 text-sm">π</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handlePayWithPi} 
                  disabled={isProcessing} 
                  className="w-full h-14 gap-2 gradient-pi shadow-lg shadow-primary/20 text-primary-foreground font-bold text-base sm:text-lg rounded-2xl transition-transform hover:-translate-y-0.5 active:scale-95 border-0"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                       <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
                       {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                    </span>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" strokeWidth={2.5} />
                      {t('payWithPi')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
