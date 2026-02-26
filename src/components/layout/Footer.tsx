import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t, language } = useLanguage();

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Halalco</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('aboutDescription')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">{t('quickLinks')}</h3>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('home')}</Link>
              <Link to="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('products')}</Link>
              <Link to="/cart" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('cart')}</Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">{t('contactUs')}</h3>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'البريد: info@halalco.pi' : 'Email: info@halalco.pi'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'ar' ? 'الدعم عبر Pi Network' : 'Support via Pi Network'}
            </p>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 Halalco. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
