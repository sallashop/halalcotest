import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface PriceDisplayProps {
  priceType: string;
  priceFixed: number;
  priceUsd: number;
  className?: string;
  showUnit?: boolean;
  unitLabel?: string;
}

const PriceDisplay = memo(({ priceType, priceFixed, priceUsd, className = '', showUnit, unitLabel }: PriceDisplayProps) => {
  const { t, language } = useLanguage();

  const { data: piPrice } = useQuery({
    queryKey: ['pi-price-live'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('pi-price');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
    staleTime: 20000,
    enabled: priceType === 'variable',
  });

  let displayPrice: number;
  if (priceType === 'variable' && piPrice?.price) {
    displayPrice = parseFloat((priceUsd / piPrice.price).toFixed(4));
  } else if (priceType === 'variable') {
    displayPrice = priceUsd; // fallback show USD
  } else {
    displayPrice = priceFixed;
  }

  return (
    <span className={className}>
      {displayPrice} {t('piCurrency')}
      {showUnit && unitLabel && <span className="text-muted-foreground text-xs"> / {unitLabel}</span>}
    </span>
  );
});

PriceDisplay.displayName = 'PriceDisplay';

export default PriceDisplay;

// Hook to get current Pi price for checkout
export const usePiPrice = () => {
  return useQuery({
    queryKey: ['pi-price-live'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('pi-price');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
    staleTime: 20000,
  });
};

// Helper to calculate Pi price from USD
export const calcPiPrice = (priceType: string, priceFixed: number, priceUsd: number, piPriceUsd: number | null): number => {
  if (priceType === 'variable' && piPriceUsd && piPriceUsd > 0) {
    return parseFloat((priceUsd / piPriceUsd).toFixed(4));
  }
  return priceFixed;
};
