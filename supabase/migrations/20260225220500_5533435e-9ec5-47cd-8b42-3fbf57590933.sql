
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  pi_uid TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (user_id = auth.jwt()->>'sub' OR pi_uid = auth.jwt()->>'sub');
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.jwt()->>'sub' OR pi_uid = auth.jwt()->>'sub');
CREATE POLICY "Anyone can insert profile" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT TO anon USING (true);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'vegetables',
  unit_ar TEXT DEFAULT 'كيلو',
  unit_en TEXT DEFAULT 'kg',
  in_stock BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 0,
  sold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE pi_uid = auth.jwt()->>'sub' AND is_admin = true)
);
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE pi_uid = auth.jwt()->>'sub' AND is_admin = true)
);
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE pi_uid = auth.jwt()->>'sub' AND is_admin = true)
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total NUMERIC NOT NULL DEFAULT 0,
  shipping_name TEXT DEFAULT '',
  shipping_phone TEXT DEFAULT '',
  shipping_address TEXT DEFAULT '',
  shipping_city TEXT DEFAULT '',
  shipping_notes TEXT DEFAULT '',
  pi_payment_id TEXT,
  pi_txid TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (user_id = auth.jwt()->>'sub');
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (user_id = auth.jwt()->>'sub');
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE pi_uid = auth.jwt()->>'sub' AND is_admin = true)
);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE pi_uid = auth.jwt()->>'sub' AND is_admin = true)
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.jwt()->>'sub')
);
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.jwt()->>'sub')
);
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE pi_uid = auth.jwt()->>'sub' AND is_admin = true)
);

-- Seed some products
INSERT INTO public.products (name_ar, name_en, description_ar, description_en, price, image_url, category, unit_ar, unit_en, in_stock, rating, sold) VALUES
('طماطم طازجة', 'Fresh Tomatoes', 'طماطم عضوية طازجة من المزرعة', 'Fresh organic tomatoes from the farm', 0.5, 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=300&fit=crop', 'vegetables', 'كيلو', 'kg', true, 4.8, 234),
('خيار بلدي', 'Local Cucumbers', 'خيار بلدي طازج ومقرمش', 'Fresh and crunchy local cucumbers', 0.3, 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&h=300&fit=crop', 'vegetables', 'كيلو', 'kg', true, 4.6, 189),
('برتقال بلدي', 'Local Oranges', 'برتقال حلو طازج غني بفيتامين C', 'Sweet fresh oranges rich in Vitamin C', 0.8, 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=300&fit=crop', 'fruits', 'كيلو', 'kg', true, 4.9, 312),
('فراولة طازجة', 'Fresh Strawberries', 'فراولة حمراء طازجة وحلوة', 'Fresh sweet red strawberries', 1.2, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=300&fit=crop', 'fruits', 'كيلو', 'kg', true, 4.7, 156),
('أرز مصري', 'Egyptian Rice', 'أرز مصري فاخر عالي الجودة', 'Premium quality Egyptian rice', 1.5, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop', 'grains', 'كيلو', 'kg', true, 4.5, 423),
('نعناع طازج', 'Fresh Mint', 'نعناع أخضر طازج عطري', 'Fresh aromatic green mint', 0.2, 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&h=300&fit=crop', 'herbs', 'حزمة', 'bunch', true, 4.4, 98),
('جبنة بيضاء', 'White Cheese', 'جبنة بيضاء بلدي طازجة', 'Fresh local white cheese', 2.0, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=300&fit=crop', 'dairy', 'كيلو', 'kg', true, 4.8, 167),
('بطاطس طازجة', 'Fresh Potatoes', 'بطاطس بلدي طازجة عالية الجودة', 'High quality fresh local potatoes', 0.4, 'https://images.unsplash.com/photo-1518977676601-b53f82ber630?w=400&h=300&fit=crop', 'vegetables', 'كيلو', 'kg', true, 4.3, 289);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
