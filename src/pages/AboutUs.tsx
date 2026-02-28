import { Leaf, Users, Target, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HalalcoLogo from '@/components/HalalcoLogo';
import { motion } from 'framer-motion';

const AboutUs = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const sections = [
    {
      icon: Target,
      title: isAr ? 'رسالتنا' : 'Our Mission',
      text: isAr
        ? 'نسعى لتوفير منتجات زراعية طبيعية وطازجة بأعلى جودة، مع تمكين المزارعين والمستهلكين من خلال تقنية Pi Network للدفع اللامركزي.'
        : 'We strive to provide fresh, natural agricultural products of the highest quality, empowering farmers and consumers through Pi Network decentralized payment technology.',
    },
    {
      icon: Heart,
      title: isAr ? 'قيمنا' : 'Our Values',
      text: isAr
        ? 'الجودة والنزاهة والشفافية هي أساس عملنا. نحرص على أن تصل المنتجات من المزرعة إلى بابك بأفضل حالة وبأسعار عادلة.'
        : 'Quality, integrity, and transparency are the foundation of our work. We ensure products reach your door from the farm in the best condition at fair prices.',
    },
    {
      icon: Users,
      title: isAr ? 'فريقنا' : 'Our Team',
      text: isAr
        ? 'فريق متخصص من خبراء الزراعة والتقنية يعملون معاً لتقديم أفضل تجربة تسوق زراعية رقمية في منطقتنا.'
        : 'A specialized team of agriculture and technology experts working together to deliver the best digital agricultural shopping experience in our region.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <HalalcoLogo className="h-20 w-20 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-3">
            {isAr ? 'من نحن' : 'About Us'}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'حلالكو هو متجر إلكتروني متخصص في المنتجات الزراعية الطازجة، نربط المزارعين مباشرة بالمستهلكين مع دعم الدفع بعملة Pi Network.'
              : 'Halalco is an online marketplace specialized in fresh agricultural products, connecting farmers directly with consumers with Pi Network payment support.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {sections.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-card p-6 border border-border/50 card-shadow"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-bold text-foreground text-lg mb-2">{s.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
