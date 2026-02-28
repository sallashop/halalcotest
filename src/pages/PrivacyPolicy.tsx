import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const sections = isAr
    ? [
        { title: 'جمع المعلومات', text: 'نقوم بجمع المعلومات التي تقدمها لنا عند إنشاء حسابك عبر Pi Network، بما في ذلك اسم المستخدم ومعرّف Pi الخاص بك. كما نجمع معلومات الشحن التي تقدمها عند إتمام الطلبات.' },
        { title: 'استخدام المعلومات', text: 'نستخدم معلوماتك لمعالجة الطلبات وتوصيل المنتجات وتحسين خدماتنا والتواصل معك بشأن طلباتك. لا نشارك معلوماتك الشخصية مع أطراف ثالثة إلا لأغراض التوصيل.' },
        { title: 'أمان البيانات', text: 'نتخذ إجراءات أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح أو التدمير. يتم تشفير جميع المعاملات المالية عبر Pi Network.' },
        { title: 'ملفات تعريف الارتباط', text: 'نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح وتذكر تفضيلاتك مثل اللغة المفضلة. يمكنك تعطيل ملفات تعريف الارتباط من إعدادات متصفحك.' },
        { title: 'حقوقك', text: 'يحق لك الوصول إلى بياناتك الشخصية وتعديلها أو حذفها. يمكنك التواصل معنا عبر البريد الإلكتروني لأي طلبات تتعلق ببياناتك.' },
        { title: 'التحديثات', text: 'قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سيتم نشر أي تغييرات على هذه الصفحة مع تاريخ التحديث.' },
      ]
    : [
        { title: 'Information Collection', text: 'We collect information you provide when creating your account through Pi Network, including your username and Pi UID. We also collect shipping information you provide when placing orders.' },
        { title: 'Use of Information', text: 'We use your information to process orders, deliver products, improve our services, and communicate with you about your orders. We do not share your personal information with third parties except for delivery purposes.' },
        { title: 'Data Security', text: 'We take appropriate security measures to protect your personal information from unauthorized access, modification, disclosure, or destruction. All financial transactions are encrypted through Pi Network.' },
        { title: 'Cookies', text: 'We use cookies to improve your browsing experience and remember your preferences such as language. You can disable cookies from your browser settings.' },
        { title: 'Your Rights', text: 'You have the right to access, modify, or delete your personal data. You can contact us via email for any data-related requests.' },
        { title: 'Updates', text: 'We may update this privacy policy from time to time. Any changes will be posted on this page with the update date.' },
      ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </h1>
          </div>
          <div className="space-y-6">
            {sections.map((s, i) => (
              <div key={i} className="rounded-xl bg-card p-5 border border-border/50">
                <h2 className="font-bold text-foreground mb-2">{s.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-8 text-center">
            {isAr ? 'آخر تحديث: فبراير 2026' : 'Last updated: February 2026'}
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
