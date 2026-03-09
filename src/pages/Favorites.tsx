import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

const Favorites = () => {
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isAr = language === 'ar';

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.piUid],
    queryFn: async () => {
      if (!user?.piUid) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.piUid);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const productIds = data.map((f: any) => f.product_id);
      const { data: products, error: pErr } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);
      if (pErr) throw pErr;
      return products || [];
    },
    enabled: !!user?.piUid,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Heart className="h-6 w-6 text-destructive" />
          {isAr ? 'قائمة المفضلة' : 'My Wishlist'}
        </h1>
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">
              {isAr ? 'لا توجد منتجات في المفضلة' : 'No products in your wishlist'}
            </p>
            <Button variant="outline" onClick={() => navigate('/products')}>
              {isAr ? 'تصفح المنتجات' : 'Browse Products'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {favorites.map((product: any, i: number) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
