import { useState } from 'react';
import { Star, MessageSquare, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const isAr = language === 'ar';
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Check if user has purchased this product
  const { data: hasPurchased = false } = useQuery({
    queryKey: ['has-purchased', productId, user?.piUid],
    queryFn: async () => {
      if (!user?.piUid) return false;
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.piUid)
        .in('status', ['confirmed', 'shipped', 'delivered']);
      if (!orders || orders.length === 0) return false;
      const orderIds = orders.map(o => o.id);
      const { data: items } = await supabase
        .from('order_items')
        .select('id')
        .in('order_id', orderIds)
        .eq('product_id', productId)
        .limit(1);
      return (items && items.length > 0) || false;
    },
    enabled: !!user?.piUid,
  });

  // Get user's existing rating
  const { data: userReview } = useQuery({
    queryKey: ['user-review', productId, user?.piUid],
    queryFn: async () => {
      if (!user?.piUid) return null;
      const { data } = await supabase
        .from('product_ratings')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.piUid)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.piUid,
  });

  // Get all reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_ratings')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Get usernames for reviewers
  const { data: reviewerProfiles = {} } = useQuery({
    queryKey: ['reviewer-profiles', reviews.map(r => r.user_id).join(',')],
    queryFn: async () => {
      if (reviews.length === 0) return {};
      const userIds = [...new Set(reviews.map(r => r.user_id))];
      const { data } = await supabase
        .from('profiles')
        .select('pi_uid, username')
        .in('pi_uid', userIds);
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => { map[p.pi_uid] = p.username; });
      return map;
    },
    enabled: reviews.length > 0,
  });

  const submitMutation = useMutation({
    mutationFn: async ({ rating, comment: c }: { rating: number; comment: string }) => {
      if (!user?.piUid) throw new Error('Not logged in');
      const { error } = await supabase
        .from('product_ratings')
        .upsert({
          product_id: productId,
          user_id: user.piUid,
          rating,
          comment: c,
        }, { onConflict: 'product_id,user_id' });
      if (error) throw error;
      // Update product average
      const { data: allRatings } = await supabase
        .from('product_ratings')
        .select('rating')
        .eq('product_id', productId);
      if (allRatings && allRatings.length > 0) {
        const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
        await supabase.from('products').update({ rating: Math.round(avg * 10) / 10 }).eq('id', productId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-review', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['avg-rating', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      setShowForm(false);
      setComment('');
      toast.success(isAr ? 'شكراً لتقييمك!' : 'Thanks for your review!');
    },
    onError: () => toast.error(isAr ? 'حدث خطأ' : 'Error occurred'),
  });

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        {isAr ? 'التقييمات والمراجعات' : 'Reviews & Ratings'}
        {reviews.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">({reviews.length})</span>
        )}
      </h2>

      {/* Average Rating Summary */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-muted/50 border border-border/50">
          <div className="text-3xl font-bold text-foreground">{avgRating}</div>
          <div>
            <div className="flex gap-0.5" dir="ltr">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-4 w-4 ${s <= avgRating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? `${reviews.length} تقييم` : `${reviews.length} reviews`}
            </p>
          </div>
        </div>
      )}

      {/* Write Review Button/Form */}
      {user && hasPurchased && (
        <div className="mb-6">
          {!showForm ? (
            <Button variant="outline" onClick={() => { setShowForm(true); setComment(userReview?.comment || ''); }}>
              <Star className="h-4 w-4 me-1" />
              {userReview ? (isAr ? 'تعديل تقييمك' : 'Edit Your Review') : (isAr ? 'اكتب تقييم' : 'Write a Review')}
            </Button>
          ) : (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <p className="text-sm font-semibold text-foreground">{isAr ? 'تقييمك' : 'Your Rating'}</p>
              <div className="flex gap-1" dir="ltr">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setHoverRating(star)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star className={`h-6 w-6 transition-colors ${
                      star <= (hoverRating || userReview?.rating || 0) ? 'fill-accent text-accent' : 'text-muted-foreground/30'
                    }`} />
                  </button>
                ))}
              </div>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={isAr ? 'اكتب تعليقك هنا...' : 'Write your comment here...'}
                rows={3}
                className="bg-background"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => submitMutation.mutate({ rating: hoverRating || userReview?.rating || 5, comment })}
                  disabled={submitMutation.isPending || (!hoverRating && !userReview?.rating)}
                  className="bg-primary text-primary-foreground"
                >
                  {isAr ? 'إرسال' : 'Submit'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Can't review message */}
      {user && !hasPurchased && (
        <div className="mb-6 p-3 rounded-xl bg-muted/50 border border-border/50 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            {isAr ? 'يمكنك التقييم فقط بعد شراء هذا المنتج' : 'You can only review after purchasing this product'}
          </p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.map((review: any) => (
          <div key={review.id} className="p-4 rounded-xl border border-border/50 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {((reviewerProfiles as any)[review.user_id] || '?')[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {(reviewerProfiles as any)[review.user_id] || (isAr ? 'مستخدم' : 'User')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
              </div>
              <div className="flex gap-0.5" dir="ltr">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            )}
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            {isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
