import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from '@/components/products/ProductCard';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Products = () => {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || 'all';
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
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

  const categoryTabs = useMemo(() => {
    const tabs = [{ id: 'all', name_ar: 'الكل', name_en: 'All' }];
    categories.forEach(c => tabs.push({ id: c.name_en.toLowerCase(), name_ar: c.name_ar, name_en: c.name_en }));
    return tabs;
  }, [categories]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCategory = activeCategory === 'all' || p.category.toLowerCase() === activeCategory.toLowerCase();
      const nameField = language === 'ar' ? p.name_ar : p.name_en;
      const descField = language === 'ar' ? (p.description_ar || '') : (p.description_en || '');
      const matchSearch = !search || nameField.toLowerCase().includes(search.toLowerCase()) || descField.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [search, activeCategory, language, products]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">{t('allProducts')}</h1>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('searchProducts')} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 bg-card border-border" />
          </div>
        </div>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categoryTabs.map(cat => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className={activeCategory === cat.id
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shrink-0'
                : 'border-border text-muted-foreground hover:text-foreground shrink-0'}
            >
              {language === 'ar' ? cat.name_ar : cat.name_en}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            {language === 'ar' ? 'لا توجد منتجات مطابقة' : 'No matching products'}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Products;
