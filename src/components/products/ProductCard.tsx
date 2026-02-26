import { ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Tables<'products'>;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { t, language } = useLanguage();
  const { addItem } = useCart();

  const name = language === 'ar' ? product.name_ar : product.name_en;
  const description = language === 'ar' ? (product.description_ar || '') : (product.description_en || '');
  const unit = language === 'ar' ? (product.unit_ar || 'كيلو') : (product.unit_en || 'kg');

  return (
    <div
      // استخدام أنيميشن Tailwind الخفيف بدلاً من framer-motion للأداء
      className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both h-full"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Soft UI Card */}
      <Card className="group overflow-hidden border-0 bg-card shadow-sm hover:shadow-lg transition-all duration-300 rounded-[1.5rem] flex flex-col h-full">
        
        {/* Image Area */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted/20 shrink-0">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Out of Stock Soft Overlay */}
          {!product.in_stock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] z-10">
              <span className="rounded-[1rem] bg-destructive/10 text-destructive border-0 px-4 py-2 text-xs font-bold shadow-inner">
                {t('outOfStock')}
              </span>
            </div>
          )}

          {/* Price Badge - Glassmorphism */}
          <div className="absolute top-3 end-3 rounded-[1rem] bg-background/90 backdrop-blur-md px-3 py-1.5 shadow-sm border border-border/10 flex items-baseline gap-1 z-10">
            <span className="font-bold text-primary text-sm leading-none">{product.price}</span>
            <span className="text-[10px] font-bold text-primary/80 leading-none">{t('piCurrency')}</span>
          </div>
        </div>

        {/* Content Area */}
        <CardContent className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
          
          {/* Title & Description */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {name}
            </h3>
            {description && (
              <p className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          <div>
            {/* Stats Row */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/10 px-2 py-1 rounded-lg shadow-inner">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-500">{product.rating || 0}</span>
              </div>
              <span className="text-[11px] font-bold text-muted-foreground bg-muted/40 px-2 py-1 rounded-lg shadow-inner">
                {product.sold || 0} {t('sold')}
              </span>
            </div>

            {/* Add to Cart Button - Full width for perfect mobile UX */}
            <Button
              disabled={!product.in_stock}
              onClick={() => addItem(product)}
              className={cn(
                "w-full h-11 gap-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.98] border-0",
                product.in_stock 
                  ? "bg-primary/10 hover:bg-primary text-primary hover:text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <ShoppingCart className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              <span className="truncate">{t('addToCart')}</span>
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default ProductCard;
