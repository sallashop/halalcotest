
-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
USING (true);

-- Admins can manage categories
CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.pi_uid = (auth.jwt() ->> 'sub') AND profiles.is_admin = true
));

CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.pi_uid = (auth.jwt() ->> 'sub') AND profiles.is_admin = true
));

CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.pi_uid = (auth.jwt() ->> 'sub') AND profiles.is_admin = true
));

-- Trigger for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
