import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import HalalcoLogo from '@/components/HalalcoLogo';

const Footer = () => {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HalalcoLogo className="h-8 w-8 text-primary" />
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
            <h3 className="font-semibold text-foreground mb-3">{isAr ? 'معلومات' : 'Information'}</h3>
            <div className="flex flex-col gap-2">
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">{isAr ? 'من نحن' : 'About Us'}</Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">{isAr ? 'شروط الاستخدام' : 'Terms of Use'}</Link>
              <Link to="/return-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">{isAr ? 'سياسة الإرجاع' : 'Return Policy'}</Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">{t('contactUs')}</h3>
            <p className="text-sm text-muted-foreground">
              {isAr ? 'البريد:' : 'Email:'} <a href="mailto:halal.egy.co@gmail.com" className="hover:text-primary transition-colors">halal.egy.co@gmail.com</a>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? 'الدعم عبر Pi Network' : 'Support via Pi Network'}
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
