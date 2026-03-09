import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Phone, User as UserIcon, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import PriceDisplay, { usePiPrice, calcPiPrice } from '@/components/products/PriceDisplay';
import { useQuery } from '@tanstack/react-query';

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
  const isAr = language === 'ar';

  const { data: piPriceData } = usePiPrice();

  const { data: shippingCategories = [] } = useQuery({
    queryKey: ['shipping-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shipping_categories').select('*');
      if (error) throw error;
      return data;
    },
  });

  const updateField = (field: keyof ShippingForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const getName = (p: typeof items[0]['product']) => language === 'ar' ? p.name_ar : p.name_en;

  // Calculate real total with dynamic pricing and shipping
  const piPrice = piPriceData?.price || null;
  
  const getItemPiPrice = (item: typeof items[0]) => {
    const priceType = (item.product as any).price_type || 'fixed';
    const priceUsd = (item.product as any).price_usd || 0;
    return calcPiPrice(priceType, item.product.price, priceUsd, piPrice);
  };

  const getShippingPi = (item: typeof items[0]) => {
    const scId = (item.product as any).shipping_category_id;
    if (!scId) return 0;
    const sc = shippingCategories.find((s: any) => s.id === scId);
    if (!sc || (sc as any).price_usd === 0) return 0;
    return piPrice ? parseFloat(((sc as any).price_usd / piPrice).toFixed(4)) : 0;
  };

  const subtotal = items.reduce((sum, i) => sum + getItemPiPrice(i) * i.quantity, 0);
  const totalShipping = items.reduce((sum, i) => sum + getShippingPi(i), 0);
  const grandTotal = parseFloat((subtotal + totalShipping).toFixed(4));

  const handlePayWithPi = async () => {
    if (!form.name || !form.phone || !form.address || !form.city) {
      toast.error(isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    if (!window.Pi) {
      toast.error('Pi SDK غير متاح');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // ✅ التعديل هنا: تجديد صلاحية الدفع قبل إنشاء الطلب لتجنب خطأ Scope
      // وتمرير دالة `onIncompletePaymentFound` لتجنب خطأ `n is not a function`
      await window.Pi.authenticate(
        ['payments'], 
        (payment) => console.log('Incomplete payment during checkout:', payment)
      );

      // إنشاء عملية الدفع
      window.Pi.createPayment(
        {
          amount: grandTotal,
          memo: isAr ? 'طلب من Halalco' : 'Order from Halalco',
          metadata: {
            items: items.map(i => ({
              id: i.product.id, qty: i.quantity,
              price: getItemPiPrice(i),
              shipping: getShippingPi(i),
            })),
            shipping: form,
            userId: user?.id,
            pi_price_at_order: piPrice,
          },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            try {
              const { error } = await supabase.functions.invoke('pi-approve', {
                body: {
                  paymentId,
                  userId: user?.id,
                  items: items.map(i => ({
                    id: i.product.id, qty: i.quantity,
                    price: getItemPiPrice(i),
                  })),
                  shipping: form,
                  total: grandTotal,
                  pi_price_at_order: piPrice,
                },
              });
              if (error) {
                console.error('Approve error:', error);
                toast.error(t('error'));
                setIsProcessing(false); // إيقاف التحميل عند الخطأ
              }
            } catch (err) {
              console.error('Approve call failed:', err);
              toast.error(t('error'));
              setIsProcessing(false); // إيقاف التحميل عند الخطأ
            }
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            try {
              const { error } = await supabase.functions.invoke('pi-complete', {
                body: { paymentId, txid },
              });
              if (error) {
                console.error('Complete error:', error);
                toast.error(t('error'));
                setIsProcessing(false); // إيقاف التحميل عند الخطأ
              } else {
                clearCart();
                toast.success(t('paymentSuccess'));
                navigate('/profile');
              }
            } catch (err) {
              console.error('Complete call failed:', err);
              toast.error(t('error'));
              setIsProcessing(false); // إيقاف التحميل عند الخطأ
            }
          },
          onCancel: () => { 
            setIsProcessing(false); 
            toast.error(isAr ? 'تم إلغاء الدفع' : 'Payment cancelled'); 
          },
          onError: (error) => { 
            console.error('Payment Error:', error);
            setIsProcessing(false); 
            toast.error(error.message || t('error')); 
          },
        }
      );
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(t('error')); 
      setIsProcessing(false); 
    }
  };

  if (items.length === 0) { navigate('/cart'); return null; }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">{t('checkout')}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-border/50 bg-card">
              <CardContent className="p-6">
                <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />{t('shippingInfo')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-foreground">{t('name')} *</Label>
                    <div className="relative mt-1">
                      <UserIcon className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={form.name} onChange={e => updateField('name', e.target.value)} className="ps-9 bg-background border-border" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-foreground">{t('phone')} *</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={form.phone} onChange={e => updateField('phone', e.target.value)} className="ps-9 bg-background border-border" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-sm text-foreground">{t('address')} *</Label>
                    <Input value={form.address} onChange={e => updateField('address', e.target.value)} className="mt-1 bg-background border-border" />
                  </div>
                  <div>
                    <Label className="text-sm text-foreground">{t('city')} *</Label>
                    <Input value={form.city} onChange={e => updateField('city', e.target.value)} className="mt-1 bg-background border-border" />
                  </div>
                  <div>
                    <Label className="text-sm text-foreground">{t('notes')}</Label>
                    <Textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} className="mt-1 bg-background border-border resize-none" rows={2} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="border-border/50 bg-card sticky top-20">
              <CardContent className="p-6">
                <h2 className="font-bold text-foreground mb-4">{isAr ? 'ملخص الطلب' : 'Order Summary'}</h2>
                <div className="space-y-2 mb-4">
                  {items.map(item => (
                    <div key={item.product.id} className="flex justify-between text-sm text-muted-foreground">
                      <span className="truncate flex-1">{getName(item.product)} × {item.quantity}</span>
                      <span className="shrink-0 ms-2">{(getItemPiPrice(item) * item.quantity).toFixed(4)} π</span>
                    </div>
                  ))}
                </div>
                {totalShipping > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground border-t border-border pt-2 mb-2">
                    <span className="flex items-center gap-1"><Truck className="h-3 w-3" />{isAr ? 'الشحن' : 'Shipping'}</span>
                    <span>{totalShipping.toFixed(4)} π</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 flex justify-between items-center mb-6">
                  <span className="font-bold text-foreground">{t('total')}</span>
                  <span className="font-bold text-primary text-lg">{grandTotal.toFixed(4)} π</span>
                </div>
                <Button onClick={handlePayWithPi} disabled={isProcessing} className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base rounded-xl hover:opacity-90 transition-opacity">
                  {isProcessing ? <span className="animate-spin h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full" /> : <><CreditCard className="h-5 w-5 me-2" />{t('payWithPi')}</>}
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
