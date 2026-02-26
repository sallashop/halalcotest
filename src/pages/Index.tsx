import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Leaf, Truck, Shield, Sprout, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import heroImage from '@/assets/hero-farm.jpg';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/products/ProductCard';

const Index = () => {
  const { t, language } = useLanguage();
  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  const { data: products = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('sold', { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: piPrice } = useQuery({
    queryKey: ['pi-price'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('pi-price');
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  const features = [
    { icon: Sprout, title: t('freshProducts'), desc: t('freshDesc') },
    { icon: Shield, title: t('securePayment'), desc: t('secureDesc') },
    { icon: Truck, title: t('fastDelivery'), desc: t('fastDesc') },
  ];

  const priceChange = piPrice?.change24h ?? 0;
  const isUp = priceChange >= 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Farm" className="h-full w-full object-cover" />
          <div className="absolute inset-0 gradient-hero opacity-80" />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="h-6 w-6 text-accent" />
              <span className="text-sm font-medium text-primary-foreground/80">{t('piNetwork')}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-primary-foreground mb-4 leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-2 font-medium">
              {t('heroSubtitle')}
            </p>
            <p className="text-sm text-primary-foreground/70 mb-8">{t('heroDescription')}</p>
            <Link to="/products">
              <Button size="lg" className="gradient-accent text-accent-foreground font-semibold shadow-lg hover:opacity-90 transition-opacity px-8 text-base">
                {t('shopNow')}
                <ArrowIcon className="h-4 w-4 ms-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Pi Price Ticker */}
      {piPrice?.price && (
        <section className="container mx-auto px-4 -mt-16 relative z-20 mb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-card p-4 card-shadow border border-border/50 flex items-center justify-between flex-wrap gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">π</div>
              <div>
                <p className="text-xs text-muted-foreground">{t('piPrice')}</p>
                <p className="text-lg font-bold text-foreground">${piPrice.price.toFixed(4)}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${isUp ? 'text-primary' : 'text-destructive'}`}>
              {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {piPrice.changePercent}%
            </div>
            <div className="text-xs text-muted-foreground">
              H: ${piPrice.high24h?.toFixed(4)} • L: ${piPrice.low24h?.toFixed(4)}
            </div>
          </motion.div>
        </section>
      )}

      <section className={`container mx-auto px-4 ${piPrice?.price ? '-mt-2' : '-mt-12'} relative z-10`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-4 rounded-2xl bg-card p-5 card-shadow border border-border/50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">{t('categories')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <Link to={`/products?category=${cat.name_en.toLowerCase()}`}>
                  <div className="relative group rounded-2xl overflow-hidden aspect-square card-shadow border border-border/50 cursor-pointer">
                    <img
                      src={cat.image_url || '/placeholder.svg'}
                      alt={language === 'ar' ? cat.name_ar : cat.name_en}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                    <div className="absolute bottom-0 start-0 end-0 p-4">
                      <h3 className="font-bold text-primary-foreground text-lg">
                        {language === 'ar' ? cat.name_ar : cat.name_en}
                      </h3>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t('allProducts')}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'ar' ? 'أفضل المنتجات الطازجة' : 'Best fresh products'}
            </p>
          </div>
          <Link to="/products">
            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/5">
              {language === 'ar' ? 'عرض الكل' : 'View All'}
              <ArrowIcon className="h-3 w-3 ms-1" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
