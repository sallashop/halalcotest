import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShoppingCart, Star, Minus, Plus, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PriceDisplay from '@/components/products/PriceDisplay';
import FavoriteButton from '@/components/products/FavoriteButton';
import ProductReviews from '@/components/products/ProductReviews';

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Get average rating
  const { data: avgRating } = useQuery({
    queryKey: ['avg-rating', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_ratings')
        .select('rating')
        .eq('product_id', id!);
      if (!data || data.length === 0) return { avg: product?.rating || 0, count: 0 };
      const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
      return { avg: Math.round(avg * 10) / 10, count: data.length };
    },
    enabled: !!id,
  });

  // Track recently viewed products
  useEffect(() => {
    if (!id) return;
    try {
      const viewed: string[] = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
      const updated = [id, ...viewed.filter(v => v !== id)].slice(0, 20);
      localStorage.setItem('recently_viewed', JSON.stringify(updated));
    } catch { /* ignore */ }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center flex-col gap-4">
          <Package className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">{language === 'ar' ? 'المنتج غير موجود' : 'Product not found'}</p>
          <Link to="/products">
            <Button variant="outline">{t('back')}</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const name = language === 'ar' ? product.name_ar : product.name_en;
  const description = language === 'ar' ? (product.description_ar || '') : (product.description_en || '');
  const unit = language === 'ar' ? (product.unit_ar || 'كيلو') : (product.unit_en || 'kg');
  const priceType = (product as any).price_type || 'fixed';
  const priceUsd = (product as any).price_usd || 0;
  const maxQty = (product as any).max_quantity || 100;
  const unitType = (product as any).unit_type || 'weight';

  const images: string[] = [];
  if (product.image_url) images.push(product.image_url);
  if ((product as any).images?.length) {
    (product as any).images.forEach((img: string) => {
      if (img && !images.includes(img)) images.push(img);
    });
  }
  if (images.length === 0) images.push('/placeholder.svg');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowIcon className="h-4 w-4" />
          {t('back')}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-border/50 card-shadow mb-3">
              <img src={images[selectedImage]} alt={name} className="h-full w-full object-cover" />
              {!product.in_stock && (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/50">
                  <span className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">
                    {t('outOfStock')}
                  </span>
                </div>
              )}
              <div className="absolute top-3 end-3">
                <FavoriteButton productId={product.id} className="bg-card/80 backdrop-blur-sm" />
              </div>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? 'border-primary' : 'border-border/50'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
            <Badge variant="outline" className="w-fit mb-2 text-xs border-primary/30 text-primary">
              {product.category}
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{name}</h1>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="text-sm text-muted-foreground">{avgRating?.avg || product.rating || 0}</span>
                {avgRating?.count ? (
                  <span className="text-xs text-muted-foreground">({avgRating.count})</span>
                ) : null}
              </div>
              <span className="text-sm text-muted-foreground">{product.sold || 0} {t('sold')}</span>
              <Badge variant="outline" className="text-xs border-muted">
                {unitType === 'weight'
                  ? (language === 'ar' ? 'بالوزن' : 'By Weight')
                  : (language === 'ar' ? 'بالقطعة' : 'By Piece')}
              </Badge>
            </div>

            <div className="text-3xl font-bold text-primary mb-1">
              <PriceDisplay priceType={priceType} priceFixed={product.price} priceUsd={priceUsd} />
            </div>
            <p className="text-sm text-muted-foreground mb-6">/ {unit}</p>

            <p className="text-muted-foreground leading-relaxed mb-4">{description}</p>

            <p className="text-xs text-muted-foreground mb-4">
              {language === 'ar'
                ? `الحد الأقصى للطلب: ${maxQty} ${unitType === 'weight' ? unit : 'قطعة'}`
                : `Max order: ${maxQty} ${unitType === 'weight' ? unit : 'pieces'}`}
            </p>

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4 mt-auto">
              <div className="flex items-center border border-border rounded-xl overflow-hidden" dir="ltr">
                <button
                  onClick={() => setQty(q => {
                    const step = unitType === 'weight' ? 0.5 : 1;
                    return Math.max(step, Math.round((q - step) * 10) / 10);
                  })}
                  className="h-10 w-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={qty || ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '') { setQty(0); return; }
                    const num = parseFloat(val);
                    if (!isNaN(num) && num >= 0 && num <= maxQty) {
                      setQty(unitType === 'weight' ? Math.round(num * 10) / 10 : Math.floor(num));
                    }
                  }}
                  onBlur={() => {
                    if (!qty || qty <= 0) {
                      setQty(unitType === 'weight' ? 0.5 : 1);
                    }
                  }}
                  step={unitType === 'weight' ? '0.5' : '1'}
                  min={unitType === 'weight' ? '0.5' : '1'}
                  max={maxQty}
                  className="h-10 w-14 text-center text-sm font-semibold text-foreground border-x border-border bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setQty(q => {
                    const step = unitType === 'weight' ? 0.5 : 1;
                    return Math.min(maxQty, Math.round((q + step) * 10) / 10);
                  })}
                  className="h-10 w-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                size="lg"
                disabled={!product.in_stock}
                onClick={() => addItem(product, qty)}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl text-base"
              >
                <ShoppingCart className="h-5 w-5 me-2" />
                {t('addToCart')}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        {id && <ProductReviews productId={id} />}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetails;
