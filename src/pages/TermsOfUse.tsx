import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

const TermsOfUse = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const sections = isAr
    ? [
        { title: 'القبول بالشروط', text: 'باستخدامك لمتجر حلالكو، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام المتجر.' },
        { title: 'الطلبات والدفع', text: 'جميع المدفوعات تتم عبر Pi Network. يتم تأكيد الطلب بعد إتمام الدفع بنجاح. الأسعار قابلة للتغيير وفقاً لتقلبات سعر Pi. السعر المعتمد هو السعر عند لحظة تأكيد الدفع.' },
        { title: 'سياسة الإلغاء', text: 'يمكن إلغاء الطلب قبل شحنه. بعد الشحن لا يمكن إلغاء الطلب. في حالة الإلغاء قبل الشحن، سيتم رد المبلغ بعملة Pi خلال 3-5 أيام عمل.' },
        { title: 'سياسة الاسترجاع', text: 'يحق لك استرجاع المنتج خلال 24 ساعة من التسليم إذا كان المنتج تالفاً أو غير مطابق للوصف. يجب تقديم صور واضحة للمنتج عند طلب الاسترجاع.' },
        { title: 'الشحن والتوصيل', text: 'نسعى لتوصيل الطلبات في أسرع وقت ممكن. أوقات التوصيل تختلف حسب الموقع والمنتج. تكلفة الشحن تُحسب حسب فئة شحن المنتج ويتم عرضها قبل إتمام الطلب.' },
        { title: 'جودة المنتجات', text: 'نلتزم بتقديم منتجات طازجة وعالية الجودة. جميع المنتجات الزراعية خاضعة لمعايير الجودة. في حالة وجود مشكلة في الجودة، يرجى التواصل معنا فوراً.' },
        { title: 'حدود المسؤولية', text: 'نبذل قصارى جهدنا لضمان دقة المعلومات المعروضة. لا نتحمل مسؤولية الأضرار الناتجة عن تقلبات أسعار العملات الرقمية أو التأخير في التوصيل لأسباب خارجة عن إرادتنا.' },
        { title: 'تعديل الشروط', text: 'نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين بأي تغييرات جوهرية عبر التطبيق.' },
      ]
    : [
        { title: 'Acceptance of Terms', text: 'By using Halalco store, you agree to comply with these terms and conditions. If you do not agree to any part, please do not use the store.' },
        { title: 'Orders & Payment', text: 'All payments are processed through Pi Network. Orders are confirmed after successful payment. Prices may change according to Pi price fluctuations. The applicable price is the price at the moment of payment confirmation.' },
        { title: 'Cancellation Policy', text: 'Orders can be cancelled before shipping. After shipping, orders cannot be cancelled. If cancelled before shipping, refunds will be processed in Pi within 3-5 business days.' },
        { title: 'Return Policy', text: 'You may return a product within 24 hours of delivery if the product is damaged or does not match the description. Clear photos of the product must be provided when requesting a return.' },
        { title: 'Shipping & Delivery', text: 'We strive to deliver orders as quickly as possible. Delivery times vary by location and product. Shipping costs are calculated based on the product shipping category and displayed before checkout.' },
        { title: 'Product Quality', text: 'We are committed to providing fresh, high-quality products. All agricultural products are subject to quality standards. If there is a quality issue, please contact us immediately.' },
        { title: 'Limitation of Liability', text: 'We do our best to ensure the accuracy of displayed information. We are not responsible for damages resulting from cryptocurrency price fluctuations or delivery delays due to reasons beyond our control.' },
        { title: 'Terms Modification', text: 'We reserve the right to modify these terms at any time. Users will be notified of any material changes through the application.' },
      ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              {isAr ? 'شروط الاستخدام' : 'Terms of Use'}
            </h1>
          </div>
          <div className="space-y-6">
            {sections.map((s, i) => (
              <div key={i} className="rounded-xl bg-card p-5 border border-border/50">
                <h2 className="font-bold text-foreground mb-2">{i + 1}. {s.title}</h2>
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

export default TermsOfUse;
