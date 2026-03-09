import { Gift, Copy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const CouponBanner = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const { data: coupons = [] } = useQuery({
    queryKey: ['active-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      // Filter expired and maxed out
      return (data || []).filter((c: any) => {
        if (c.expires_at && new Date(c.expires_at) < new Date()) return false;
        if (c.max_uses > 0 && c.used_count >= c.max_uses) return false;
        return true;
      });
    },
  });

  if (coupons.length === 0) return null;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(isAr ? 'تم نسخ الكوبون!' : 'Coupon copied!');
  };

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {coupons.map((coupon: any, i: number) => (
          <motion.div
            key={coupon.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-4 card-shadow"
          >
            <div className="absolute top-0 end-0 h-20 w-20 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  {isAr ? coupon.description_ar || 'خصم خاص' : coupon.description_en || 'Special Discount'}
                </p>
                <p className="text-2xl font-extrabold text-primary">{coupon.discount_percent}%</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold text-sm tracking-wider border border-dashed border-primary/30">
                    {coupon.code}
                  </code>
                  <button
                    onClick={() => copyCode(coupon.code)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CouponBanner;
