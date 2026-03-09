import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { RotateCcw } from 'lucide-react';

const ReturnPolicy = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <RotateCcw className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {isAr ? 'سياسة الإرجاع والاستبدال' : 'Return & Exchange Policy'}
          </h1>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          {isAr ? (
            <>
              <section>
                <h2 className="text-lg font-bold text-foreground">حق الإرجاع</h2>
                <p>يحق للعميل طلب إرجاع أو استبدال المنتج خلال <strong>48 ساعة</strong> من تاريخ استلام الطلب، بشرط أن يكون المنتج في حالته الأصلية ولم يتم استخدامه أو فتحه.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-foreground">شروط الإرجاع</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>يجب أن يكون المنتج في عبوته الأصلية وغير مستخدم</li>
                  <li>المنتجات الطازجة (خضروات، فواكه) يمكن إرجاعها فقط في حالة وجود عيب أو تلف</li>
                  <li>يجب إرفاق صور توضح سبب الإرجاع</li>
                  <li>لا يمكن إرجاع المنتجات التي تم استهلاكها جزئياً</li>
                </ul>
              </section>
              <section>
                <h2 className="text-lg font-bold text-foreground">خطوات الإرجاع</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>تواصل معنا عبر واتساب أو البريد الإلكتروني خلال 48 ساعة من الاستلام</li>
                  <li>أرسل صوراً للمنتج مع وصف المشكلة</li>
                  <li>سنقوم بمراجعة طلبك والرد خلال 24 ساعة</li>
                  <li>في حالة الموافقة، سيتم استرداد المبلغ أو استبدال المنتج</li>
                </ol>
              </section>
              <section>
                <h2 className="text-lg font-bold text-foreground">استرداد المبلغ</h2>
                <p>يتم استرداد المبلغ بنفس طريقة الدفع (Pi Network) خلال 3-5 أيام عمل من الموافقة على طلب الإرجاع. تكاليف الشحن غير قابلة للاسترداد إلا في حالة وجود خطأ من طرفنا.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-foreground">الحالات المستثناة</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>المنتجات المخفضة أو المعروضة في تخفيضات خاصة</li>
                  <li>المنتجات التي تم تغيير حالتها بعد الاستلام</li>
                  <li>الطلبات التي مر عليها أكثر من 48 ساعة</li>
                </ul>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-bold text-foreground">Right to Return</h2>
                <p>Customers may request a return or exchange within <strong>48 hours</strong> of receiving their order, provided the product is in its original condition and has not been used or opened.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-foreground">Return Conditions</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>Product must be in original packaging and unused</li>
                  <li>Fresh products (vegetables, fruits) can only be returned if defective or damaged</li>
                  <li>Photos must be provided showing the reason for return</li>
                  <li>Partially consumed products cannot be returned</li>
                </ul>
              </section>
              <section>
                <h2 className="text-lg font-bold text-foreground">Return Steps</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Contact us via WhatsApp or email within 48 hours of delivery</li>
                  <li>Send photos of the product with a description of the issue</li>
                  <li>We will review your request and respond within 24 hours</li>
                  <li>If approved, a refund or exchange will be processed</li>
                </ol>
              </section>
              <section>
                <h2 className="text-lg font-bold text-foreground">Refunds</h2>
                <p>Refunds are processed via the same payment method (Pi Network) within 3-5 business days after approval. Shipping costs are non-refundable unless the error was on our part.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-foreground">Exceptions</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>Discounted or sale products</li>
                  <li>Products altered after delivery</li>
                  <li>Orders older than 48 hours</li>
                </ul>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReturnPolicy;
