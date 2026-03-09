import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface FavoriteButtonProps {
  productId: string;
  className?: string;
}

const FavoriteButton = ({ productId, className = '' }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const isAr = language === 'ar';

  const { data: isFavorite = false } = useQuery({
    queryKey: ['is-favorite', productId, user?.piUid],
    queryFn: async () => {
      if (!user?.piUid) return false;
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.piUid)
        .eq('product_id', productId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.piUid,
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!user?.piUid) throw new Error('Not logged in');
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.piUid)
          .eq('product_id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.piUid, product_id: productId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-favorite', productId] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(isFavorite
        ? (isAr ? 'تمت الإزالة من المفضلة' : 'Removed from wishlist')
        : (isAr ? 'تمت الإضافة للمفضلة' : 'Added to wishlist')
      );
    },
    onError: () => toast.error(isAr ? 'سجل الدخول أولاً' : 'Please login first'),
  });

  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggleMutation.mutate(); }}
      className={`p-1.5 rounded-full transition-colors ${className}`}
      disabled={toggleMutation.isPending}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground hover:text-destructive'
        }`}
      />
    </button>
  );
};

export default FavoriteButton;
