import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Phone, User as UserIcon, Truck, Save } from 'lucide-react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ShippingForm {
  name: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
}

const Checkout = () => {
  const { t, language } = useLanguage();
  // ✅ إضافة refreshToken هنا من الـ AuthContext
  const { user, refreshToken } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [form, setForm] = useState<ShippingForm>({ name: '', phone: '', address: '', city: '', notes: '' });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
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

  // Load saved address
  const { data: savedAddress } = useQuery({
    queryKey: ['saved-address', user?.piUid],
    queryFn: async () => {
      if (!user?.piUid) return null;
      const { data } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user.piUid)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.piUid,
  });

  // Auto-fill saved address
  useEffect(() => {
    if (savedAddress && !form.name && !form.phone) {
      setForm({
        name: savedAddress.name || '',
        phone: savedAddress.phone || '',
        address: savedAddress.address || '',
        city: savedAddress.city || '',
        notes: savedAddress.notes || '',
      });
    }
  }, [savedAddress]);

  const saveAddressMutation = useMutation({
    mutationFn: async () => {
      if (!user?.piUid) return;
      const { error } = await supabase
        .from('saved_addresses')
        .upsert({
          user_id: user.piUid,
          name: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          notes: form.notes,
        }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: (_data, _vars, context) => {
      queryClient.invalidateQueries({ queryKey: ['saved-address'] });
    },
  });

  const updateField = (field: keyof ShippingForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const getName = (p: typeof items[0]['product']) => language === 'ar' ? p.name_ar : p.name_en;

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
  const discount = appliedCoupon ? (subtotal * appliedCoupon.discount_percent / 100) : 0;
  const grandTotal = parseFloat((subtotal - discount + totalShipping).toFixed(4));

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle();
      
    if (error || !data) {
      toast.error(isAr ? 'كوبون غير صالح' : 'Invalid coupon');
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast.error(isAr ? 'الكوبون منتهي الصلاحية' : 'Coupon expired');
      return;
    }
    if (data.max_uses > 0 && data.used_count >= data.max_uses) {
      toast.error(isAr ? 'الكوبون استنفد' : 'Coupon maxed out');
      return;
    }
    setAppliedCoupon(data);
    toast.success(isAr ? `تم تطبيق خصم ${data.discount_percent}%` : `${data.discount_percent}% discount applied`);
  };

  const handlePayWithPi = async () => {
    if (!form.name || !form.phone || !form.address || !form.city) {
      toast.error(isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    if (!window.Pi) {
      toast.error('Pi SDK غير متاح');
      return;
    }

    if (isNaN(grandTotal) || grandTotal <= 0) {
      toast.error(isAr ? 'خطأ: السعر الإجمالي غير صالح' : 'Error: Invalid total amount');
      return;
    }

    setIsProcessing(true);

    try {
      // ✅ Silently refresh Pi token before payment to avoid "scope" errors
      if (typeof refreshToken === 'function') {
        await refreshToken();
      }

      const paymentData = {
        amount: grandTotal,
        memo: isAr ? 'طلب من Halalco' : 'Order from Halalco',
        metadata: {
          items: items.map(i => ({
            id: i.product.id || "", 
            qty: i.quantity || 1,
            price: getItemPiPrice(i) || 0,
            shipping: getShippingPi(i) || 0,
          })),
          shipping: form,
          userId: user?.id || "",
          pi_price_at_order: piPrice || 0,
          coupon_code: appliedCoupon?.code || "",
          discount_percent: appliedCoupon?.discount_percent || 0,
        },
      };

      window.Pi.createPayment(
        paymentData,
        {
          onReadyForServerApproval: async (paymentId: string) => {
            try {
              const { error } = await supabase.functions.invoke('pi-approve', {
                body: {
                  paymentId,
                  userId: user?.id || "",
                  items: items.map(i => ({
                    id: i.product.id, qty: i.quantity,
                    price: getItemPiPrice(i),
                  })),
                  shipping: form,
                  total: grandTotal,
                  pi_price_at_order: piPrice || 0,
                  coupon_code: appliedCoupon?.code || "",
                  discount_percent: appliedCoupon?.discount_percent || 0,
                },
              });
              if (error) { console.error('Approve error:', error); toast.error(t('error')); }
            } catch (err) { console.error('Approve call failed:', err); toast.error(t('error')); }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            try {
              const { error } = await supabase.functions.invoke('pi-complete', {
                body: { paymentId, txid },
              });
              if (error) { console.error('Complete error:', error); toast.error(t('error')); }
              else {
                if (appliedCoupon) {
                  await supabase.from('coupons').update({ used_count: (appliedCoupon.used_count || 0) + 1 }).eq('id', appliedCoupon.id);
                }
                // Save address for next time (silently)
                saveAddressMutation.mutate(undefined, { onSuccess: () => {}, onError: () => {} });
                clearCart();
                toast.success(t('paymentSuccess'));
                navigate('/profile');
              }
            } catch (err) { console.error('Complete call failed:', err); toast.error(t('error')); }
          },
          onCancel: () => { setIsProcessing(false); toast.error(isAr ? 'تم إلغاء الدفع' : 'Payment cancelled'); },
          onError: (err: any) => { 
            console.error('Pi SDK Error Callback:', err);
            setIsProcessing(false); 
            toast.error(isAr ? 'خطأ في شبكة Pi' : 'Pi Network Error'); 
          },
        }
      );
    } catch (err: any) { 
       console.error('Try/Catch Synchronous Error:', err);
       toast.error(isAr ? `خطأ داخلي: ${err.message || 'غير معروف'}` : `Local Error: ${err.message || 'Unknown'}`); 
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />{t('shippingInfo')}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => saveAddressMutation.mutate(undefined, { onSuccess: () => toast.success(isAr ? 'تم حفظ العنوان' : 'Address saved') })}
                    disabled={saveAddressMutation.isPending || !form.name}
                    className="text-xs text-primary"
                  >
                    <Save className="h-3 w-3 me-1" />
                    {isAr ? 'حفظ العنوان' : 'Save Address'}
                  </Button>
                </div>
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

                {/* Coupon Section */}
                <div className="border-t border-border pt-3 mb-3">
                  <Label className="text-xs text-muted-foreground mb-1 block">{isAr ? 'كوبون الخصم' : 'Coupon Code'}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder={isAr ? 'أدخل الكوبون' : 'Enter code'}
                      className="bg-background border-border text-sm h-9"
                      disabled={!!appliedCoupon}
                    />
                    {appliedCoupon ? (
                      <Button size="sm" variant="outline" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="h-9 text-xs shrink-0">
                        {isAr ? 'إزالة' : 'Remove'}
                      </Button>
                    ) : (
                      <Button size="sm" onClick={applyCoupon} className="h-9 text-xs bg-primary text-primary-foreground shrink-0">
                        {isAr ? 'تطبيق' : 'Apply'}
                      </Button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <p className="text-xs text-primary mt-1">✓ {isAr ? `خصم ${appliedCoupon.discount_percent}%` : `${appliedCoupon.discount_percent}% off`} (-{discount.toFixed(4)} π)</p>
                  )}
                </div>

                <div className="border-t border-border pt-3 flex justify-between items-center mb-6">
                  <span className="font-bold text-foreground">{t('total')}</span>
                  <span className="font-bold text-primary text-lg">{grandTotal.toFixed(4)} π</span>
                </div>
                <Button onClick={handlePayWithPi} disabled={isProcessing} className="w-full h-12 gradient-pi text-primary-foreground font-semibold text-base rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 border-0">
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
