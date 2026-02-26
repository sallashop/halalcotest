import { ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import { Tables } from '@/integrations/supabase/types';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className="group overflow-hidden border-border/50 bg-card card-shadow hover:card-hover-shadow transition-all duration-300">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          {!product.in_stock && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/50">
              <span className="rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground">
                {t('outOfStock')}
              </span>
            </div>
          )}
          <div className="absolute top-2 end-2 rounded-full bg-card/90 backdrop-blur-sm px-2 py-0.5 text-xs font-semibold text-primary">
            {product.price} {t('piCurrency')}
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">{name}</h3>
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-accent text-accent" />
                <span className="text-xs text-muted-foreground">{product.rating || 0}</span>
              </div>
              <span className="text-xs text-muted-foreground">{product.sold || 0} {t('sold')}</span>
            </div>
            <Button
              size="sm"
              disabled={!product.in_stock}
              onClick={() => addItem(product)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8 px-3"
            >
              <ShoppingCart className="h-3 w-3 me-1" />
              {t('addToCart')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProductCard;
