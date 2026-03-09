import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, Plus, Pencil, Trash2, LayoutDashboard, DollarSign, AlertTriangle, Grid3X3, Upload, X, Truck, Info, Tag, MessageCircle, Save, BarChart3, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import SalesReports from '@/components/admin/SalesReports';
import TrackingDialog from '@/components/admin/TrackingDialog';
import TeamManagement from '@/components/admin/TeamManagement';

type ProductForm = {
  name_ar: string; name_en: string;
  description_ar: string; description_en: string;
  price: number; price_type: string; price_usd: number;
  image_url: string;
  category: string; unit_ar: string; unit_en: string;
  in_stock: boolean;
  images: string[];
  shipping_category_id: string | null;
  max_quantity: number;
  unit_type: string;
};

const MAX_IMAGE_SIZE = 30 * 1024;
const MAX_IMAGES = 3;

type CategoryForm = {
  name_ar: string; name_en: string;
  image_url: string; sort_order: number;
};

type ShippingCatForm = {
  name_ar: string; name_en: string;
  price_usd: number;
};

const emptyProduct: ProductForm = {
  name_ar: '', name_en: '', description_ar: '', description_en: '',
  price: 0, price_type: 'fixed', price_usd: 0,
  image_url: '', category: 'vegetables',
  unit_ar: 'كيلو', unit_en: 'kg', in_stock: true,
  images: [], shipping_category_id: null,
  max_quantity: 100, unit_type: 'weight',
};

const emptyCategory: CategoryForm = {
  name_ar: '', name_en: '', image_url: '', sort_order: 0,
};

const emptyShippingCat: ShippingCatForm = {
  name_ar: '', name_en: '', price_usd: 0,
};

const statusColors: Record<string, string> = {
  pending: 'bg-accent/20 text-accent-foreground',
  confirmed: 'bg-primary/20 text-primary',
  shipped: 'bg-secondary text-secondary-foreground',
  delivered: 'bg-primary/10 text-primary',
  cancelled: 'bg-destructive/20 text-destructive',
};

const Admin = () => {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAr = language === 'ar';

  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Tables<'products'> | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'product' | 'category' | 'shipping' | 'coupon'>('product');

  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Tables<'categories'> | null>(null);
  const [catForm, setCatForm] = useState<CategoryForm>(emptyCategory);

  const [shippingDialog, setShippingDialog] = useState(false);
  const [editingShipping, setEditingShipping] = useState<any>(null);
  const [shipForm, setShipForm] = useState<ShippingCatForm>(emptyShippingCat);

  const [couponDialog, setCouponDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [couponForm, setCouponForm] = useState({ code: '', discount_percent: 0, max_uses: 0, description_ar: '', description_en: '', is_active: true, expires_at: '' });

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [trackingDialog, setTrackingDialog] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const catFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingCatImage, setUploadingCatImage] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ['admin-order-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('order_items').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: shippingCategories = [] } = useQuery({
    queryKey: ['shipping-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shipping_categories').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Product mutations
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...rest } = data;
      if (id) {
        const { error } = await supabase.from('products').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setProductDialog(false);
      setEditingProduct(null);
      setForm(emptyProduct);
      toast.success(t('success'));
    },
    onError: () => toast.error(t('error')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDeleteId(null);
      toast.success(t('success'));
    },
  });

  // Category mutations
  const saveCategoryMutation = useMutation({
    mutationFn: async (data: CategoryForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from('categories').update(data).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryDialog(false);
      setEditingCategory(null);
      setCatForm(emptyCategory);
      toast.success(t('success'));
    },
    onError: () => toast.error(t('error')),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteId(null);
      toast.success(t('success'));
    },
  });

  // Shipping category mutations
  const saveShippingMutation = useMutation({
    mutationFn: async (data: ShippingCatForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from('shipping_categories').update(data).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('shipping_categories').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-categories'] });
      setShippingDialog(false);
      setEditingShipping(null);
      setShipForm(emptyShippingCat);
      toast.success(t('success'));
    },
    onError: () => toast.error(t('error')),
  });

  const deleteShippingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shipping_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-categories'] });
      setDeleteId(null);
      toast.success(t('success'));
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status, tracking_number, tracking_receipt_url }: { id: string; status: string; tracking_number?: string; tracking_receipt_url?: string }) => {
      const updateData: any = { status };
      if (tracking_number !== undefined) updateData.tracking_number = tracking_number;
      if (tracking_receipt_url !== undefined) updateData.tracking_receipt_url = tracking_receipt_url;
      const { error } = await supabase.from('orders').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(t('success'));
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    if (newStatus === 'shipped') {
      setTrackingOrderId(orderId);
      setTrackingDialog(true);
    } else {
      updateOrderStatus.mutate({ id: orderId, status: newStatus });
    }
  };

  const handleTrackingSave = (orderId: string, trackingNumber: string, receiptUrl: string) => {
    updateOrderStatus.mutate({
      id: orderId,
      status: 'shipped',
      tracking_number: trackingNumber,
      tracking_receipt_url: receiptUrl,
    });
    setTrackingDialog(false);
    setTrackingOrderId('');
  };

  // Coupons
  const { data: coupons = [] } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveCouponMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { id, ...rest } = data;
        const { error } = await supabase.from('coupons').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupons').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      queryClient.invalidateQueries({ queryKey: ['active-coupons'] });
      setCouponDialog(false);
      setEditingCoupon(null);
      toast.success(t('success'));
    },
    onError: () => toast.error(t('error')),
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setDeleteId(null);
      toast.success(t('success'));
    },
  });

  // WhatsApp settings
  const { data: whatsappSetting } = useQuery({
    queryKey: ['whatsapp-setting'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'whatsapp_number').maybeSingle();
      return data?.value || '';
    },
  });

  useEffect(() => {
    if (whatsappSetting) setWhatsappNumber(whatsappSetting);
  }, [whatsappSetting]);

  const saveWhatsappMutation = useMutation({
    mutationFn: async (num: string) => {
      const { error } = await supabase.from('settings').upsert({ key: 'whatsapp_number', value: num }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-setting'] });
      toast.success(t('success'));
    },
  });

  const openEdit = (p: Tables<'products'>) => {
    setEditingProduct(p);
    setForm({
      name_ar: p.name_ar, name_en: p.name_en,
      description_ar: p.description_ar || '', description_en: p.description_en || '',
      price: p.price, price_type: (p as any).price_type || 'fixed', price_usd: (p as any).price_usd || 0,
      image_url: p.image_url || '',
      category: p.category, unit_ar: p.unit_ar || 'كيلو', unit_en: p.unit_en || 'kg',
      in_stock: p.in_stock ?? true,
      images: (p as any).images || [],
      shipping_category_id: (p as any).shipping_category_id || null,
      max_quantity: (p as any).max_quantity || 100,
      unit_type: (p as any).unit_type || 'weight',
    });
    setProductDialog(true);
  };

  const openAdd = () => { setEditingProduct(null); setForm(emptyProduct); setProductDialog(true); };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    const currentCount = form.images.length;
    const remaining = MAX_IMAGES - currentCount;
    if (remaining <= 0) {
      toast.error(isAr ? `الحد الأقصى ${MAX_IMAGES} صور` : `Maximum ${MAX_IMAGES} images`);
      return;
    }
    setUploadingImages(true);
    const newImages: string[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(isAr ? `${file.name}: حجم الصورة يجب أن يكون أقل من 30KB` : `${file.name}: Image must be under 30KB`);
        continue;
      }
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (error) { toast.error(isAr ? 'خطأ في رفع الصورة' : 'Upload error'); continue; }
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      newImages.push(urlData.publicUrl);
    }
    setForm(f => ({ ...f, images: [...f.images, ...newImages] }));
    setUploadingImages(false);
  };

  const removeImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    if (!form.name_ar || !form.name_en) { toast.error(isAr ? 'أدخل اسم المنتج' : 'Enter product name'); return; }
    const finalForm: any = { ...form };
    if (!finalForm.image_url && finalForm.images.length > 0) {
      finalForm.image_url = finalForm.images[0];
    }
    if (finalForm.shipping_category_id === '') finalForm.shipping_category_id = null;
    if (editingProduct) finalForm.id = editingProduct.id;
    saveMutation.mutate(finalForm);
  };

  const openEditCategory = (c: Tables<'categories'>) => {
    setEditingCategory(c);
    setCatForm({ name_ar: c.name_ar, name_en: c.name_en, image_url: c.image_url || '', sort_order: c.sort_order || 0 });
    setCategoryDialog(true);
  };

  const openAddCategory = () => { setEditingCategory(null); setCatForm(emptyCategory); setCategoryDialog(true); };

  const handleCatImageUpload = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(isAr ? 'حجم الصورة يجب أن يكون أقل من 30KB' : 'Image must be under 30KB');
      return;
    }
    setUploadingCatImage(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('category-images').upload(path, file);
    if (error) {
      toast.error(isAr ? 'خطأ في رفع الصورة' : 'Upload error');
      setUploadingCatImage(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('category-images').getPublicUrl(path);
    setCatForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setUploadingCatImage(false);
  };

  const handleSaveCategory = () => {
    if (!catForm.name_ar || !catForm.name_en) { toast.error(isAr ? 'أدخل اسم القسم' : 'Enter category name'); return; }
    saveCategoryMutation.mutate(editingCategory ? { ...catForm, id: editingCategory.id } : catForm);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    if (deleteType === 'category') deleteCategoryMutation.mutate(deleteId);
    else if (deleteType === 'shipping') deleteShippingMutation.mutate(deleteId);
    else if (deleteType === 'coupon' as any) deleteCouponMutation.mutate(deleteId);
    else deleteMutation.mutate(deleteId);
  };

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          {t('adminDashboard')}
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-border/50 bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Package className="h-5 w-5 text-primary" /></div>
              <div><p className="text-xs text-muted-foreground">{t('totalProducts')}</p><p className="text-xl font-bold text-foreground">{products.length}</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-accent" /></div>
              <div><p className="text-xs text-muted-foreground">{t('totalOrders')}</p><p className="text-xl font-bold text-foreground">{orders.length}</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-primary" /></div>
              <div><p className="text-xs text-muted-foreground">{t('revenue')}</p><p className="text-xl font-bold text-foreground">{totalRevenue.toFixed(4)} π</p></div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products">
          <div className="overflow-x-auto mb-6 -mx-4 px-4">
            <TabsList className="bg-muted inline-flex w-auto min-w-full sm:min-w-0 gap-1">
              <TabsTrigger value="products" className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">{t('manageProducts')}</TabsTrigger>
              <TabsTrigger value="categories" className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">{t('manageCategories')}</TabsTrigger>
              <TabsTrigger value="shipping" className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">{isAr ? 'الشحن' : 'Shipping'}</TabsTrigger>
              <TabsTrigger value="orders" className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">{t('manageOrders')}</TabsTrigger>
              <TabsTrigger value="reports" className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">
                <BarChart3 className="h-4 w-4 me-1" />{isAr ? 'التقارير' : 'Reports'}
              </TabsTrigger>
              <TabsTrigger value="coupons" className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">{isAr ? 'الكوبونات' : 'Coupons'}</TabsTrigger>
              <TabsTrigger value="team" className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">
                <Users className="h-4 w-4 me-1" />{isAr ? 'الفريق' : 'Team'}
              </TabsTrigger>
              <TabsTrigger value="settings" className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">{isAr ? 'الإعدادات' : 'Settings'}</TabsTrigger>
            </TabsList>
          </div>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex justify-end mb-4">
              <Button onClick={openAdd} className="bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 me-1" />{t('addProduct')}
              </Button>
            </div>
            <div className="grid gap-3">
              {products.map(p => (
                <Card key={p.id} className="border-border/50 bg-card">
                  <CardContent className="flex items-center gap-4 p-4">
                    <img src={p.image_url || '/placeholder.svg'} alt={p.name_ar} className="h-14 w-14 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm truncate">{isAr ? p.name_ar : p.name_en}</h3>
                      <p className="text-xs text-muted-foreground">
                        {(p as any).price_type === 'variable' ? `$${(p as any).price_usd}` : `${p.price} π`} • {p.category}
                        {(p as any).price_type === 'variable' && <Badge variant="outline" className="ms-2 text-[10px] border-accent/30 text-accent-foreground">{isAr ? 'متغير' : 'Variable'}</Badge>}
                      </p>
                    </div>
                    <Badge variant={p.in_stock ? 'default' : 'destructive'} className={p.in_stock ? 'bg-primary/10 text-primary' : ''}>
                      {p.in_stock ? (isAr ? 'متوفر' : 'In Stock') : t('outOfStock')}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setDeleteType('product'); setDeleteId(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="flex justify-end mb-4">
              <Button onClick={openAddCategory} className="bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 me-1" />{t('addCategory')}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map(cat => (
                <Card key={cat.id} className="border-border/50 bg-card overflow-hidden">
                  <div className="relative aspect-video">
                    <img src={cat.image_url || '/placeholder.svg'} alt={cat.name_ar} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                    <div className="absolute bottom-0 start-0 end-0 p-3">
                      <h3 className="font-bold text-primary-foreground">{isAr ? cat.name_ar : cat.name_en}</h3>
                    </div>
                  </div>
                  <CardContent className="p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{isAr ? `ترتيب: ${cat.sort_order}` : `Order: ${cat.sort_order}`}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditCategory(cat)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setDeleteType('category'); setDeleteId(cat.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Shipping Tab */}
          <TabsContent value="shipping">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setEditingShipping(null); setShipForm(emptyShippingCat); setShippingDialog(true); }} className="bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 me-1" />{isAr ? 'إضافة فئة شحن' : 'Add Shipping Category'}
              </Button>
            </div>
            <div className="grid gap-3">
              {shippingCategories.map((sc: any) => (
                <Card key={sc.id} className="border-border/50 bg-card">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm">{isAr ? sc.name_ar : sc.name_en}</h3>
                      <p className="text-xs text-muted-foreground">
                        {sc.price_usd === 0
                          ? (isAr ? 'شحن مجاني' : 'Free shipping')
                          : `$${sc.price_usd} USD`}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingShipping(sc); setShipForm({ name_ar: sc.name_ar, name_en: sc.name_en, price_usd: sc.price_usd }); setShippingDialog(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setDeleteType('shipping'); setDeleteId(sc.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </CardContent>
                </Card>
              ))}
              {shippingCategories.length === 0 && (
                <p className="text-center text-muted-foreground py-8">{isAr ? 'لا توجد فئات شحن بعد' : 'No shipping categories yet'}</p>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            {orders.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">{t('noOrders')}</div>
            ) : (
              <div className="grid gap-3">
                {orders.map(order => (
                  <Card key={order.id} className="border-border/50 bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at!).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[order.status] || ''}>{t(order.status as any)}</Badge>
                          <span className="font-bold text-primary text-sm">{order.total.toFixed(4)} π</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {order.shipping_name} • {order.shipping_city} • {order.shipping_phone}
                        </p>
                        <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
                          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">{t('pending')}</SelectItem>
                            <SelectItem value="confirmed">{t('confirmed')}</SelectItem>
                            <SelectItem value="shipped">{t('shipped')}</SelectItem>
                            <SelectItem value="delivered">{t('delivered')}</SelectItem>
                            <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Tracking info */}
                      {(order as any).tracking_number && (
                        <div className="mt-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                          <p className="text-xs text-foreground flex items-center gap-1">
                            <Truck className="h-3 w-3 text-primary" />
                            {isAr ? 'رقم الشحنة:' : 'Tracking:'} <span dir="ltr" className="font-mono">{(order as any).tracking_number}</span>
                          </p>
                          {(order as any).tracking_receipt_url && (
                            <a href={(order as any).tracking_receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                              <Eye className="h-3 w-3" />{isAr ? 'عرض إيصال الشحن' : 'View receipt'}
                            </a>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <SalesReports orders={orders} products={products} orderItems={orderItems as any} />
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setEditingCoupon(null); setCouponForm({ code: '', discount_percent: 0, max_uses: 0, description_ar: '', description_en: '', is_active: true, expires_at: '' }); setCouponDialog(true); }} className="bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 me-1" />{isAr ? 'إضافة كوبون' : 'Add Coupon'}
              </Button>
            </div>
            <div className="grid gap-3">
              {coupons.map((c: any) => (
                <Card key={c.id} className="border-border/50 bg-card">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="font-bold text-foreground">{c.code}</code>
                        <Badge variant={c.is_active ? 'default' : 'destructive'} className={c.is_active ? 'bg-primary/10 text-primary text-xs' : 'text-xs'}>
                          {c.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Inactive')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.discount_percent}% {isAr ? 'خصم' : 'off'} • {c.used_count}/{c.max_uses || '∞'} {isAr ? 'استخدام' : 'uses'}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditingCoupon(c);
                      setCouponForm({ code: c.code, discount_percent: c.discount_percent, max_uses: c.max_uses || 0, description_ar: c.description_ar || '', description_en: c.description_en || '', is_active: c.is_active, expires_at: c.expires_at ? c.expires_at.split('T')[0] : '' });
                      setCouponDialog(true);
                    }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setDeleteType('coupon'); setDeleteId(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </CardContent>
                </Card>
              ))}
              {coupons.length === 0 && <p className="text-center text-muted-foreground py-8">{isAr ? 'لا توجد كوبونات' : 'No coupons yet'}</p>}
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <TeamManagement isAr={isAr} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="border-border/50 bg-card max-w-md">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  {isAr ? 'رقم واتساب التواصل' : 'WhatsApp Contact Number'}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {isAr ? 'أدخل رقم الواتساب مع رمز الدولة (مثال: 201234567890)' : 'Enter WhatsApp number with country code (e.g. 201234567890)'}
                </p>
                <div className="flex gap-2">
                  <Input
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                    placeholder="201234567890"
                    className="bg-background border-border"
                    dir="ltr"
                  />
                  <Button
                    onClick={() => saveWhatsappMutation.mutate(whatsappNumber)}
                    disabled={saveWhatsappMutation.isPending}
                    className="bg-primary text-primary-foreground shrink-0"
                  >
                    <Save className="h-4 w-4 me-1" />{t('save')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      {/* Product Dialog */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? t('editProduct') : t('addProduct')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t('productName')} (عربي)</Label>
              <Input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t('productName')} (EN)</Label>
              <Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">{isAr ? 'الوصف (عربي)' : 'Description (AR)'}</Label>
              <Textarea value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} className="mt-1" rows={2} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">{isAr ? 'الوصف (EN)' : 'Description (EN)'}</Label>
              <Textarea value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} className="mt-1" rows={2} />
            </div>

            {/* Price Type */}
            <div className="sm:col-span-2">
              <Label className="text-xs mb-2 block">{isAr ? 'نوع السعر' : 'Price Type'}</Label>
              <div className="flex gap-3">
                <Button
                  type="button" variant={form.price_type === 'fixed' ? 'default' : 'outline'} size="sm"
                  onClick={() => setForm(f => ({ ...f, price_type: 'fixed' }))}
                  className={form.price_type === 'fixed' ? 'bg-primary text-primary-foreground' : ''}
                >
                  {isAr ? 'سعر ثابت (π)' : 'Fixed (π)'}
                </Button>
                <Button
                  type="button" variant={form.price_type === 'variable' ? 'default' : 'outline'} size="sm"
                  onClick={() => setForm(f => ({ ...f, price_type: 'variable' }))}
                  className={form.price_type === 'variable' ? 'bg-primary text-primary-foreground' : ''}
                >
                  {isAr ? 'سعر متغير ($)' : 'Variable ($)'}
                </Button>
              </div>
            </div>

            {form.price_type === 'fixed' ? (
              <div className="sm:col-span-2">
                <Label className="text-xs">{t('productPrice')} (π)</Label>
                <Input type="number" step="0.0001" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className="mt-1" />
              </div>
            ) : (
              <div className="sm:col-span-2">
                <Label className="text-xs flex items-center gap-1">
                  {isAr ? 'السعر بالدولار ($)' : 'Price in USD ($)'}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      {isAr
                        ? 'أدخل تكلفة المنتج بالدولار. سيتم قسمتها على سعر Pi الحالي لعرض السعر بعملة Pi تلقائياً. السعر يتغير مع تغير سعر Pi.'
                        : 'Enter the product cost in USD. It will be divided by the current Pi price to display the price in Pi automatically. Price updates as Pi price changes.'}
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input type="number" step="0.01" value={form.price_usd} onChange={e => setForm(f => ({ ...f, price_usd: parseFloat(e.target.value) || 0 }))} className="mt-1" placeholder="e.g. 5.00" />
                <p className="text-xs text-muted-foreground mt-1">
                  {isAr ? 'السعر المعروض = تكلفة الدولار ÷ سعر Pi الحالي' : 'Displayed price = USD cost ÷ current Pi price'}
                </p>
              </div>
            )}

            <div>
              <Label className="text-xs">{t('productCategory')}</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.name_en.toLowerCase()}>{isAr ? c.name_ar : c.name_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">{isAr ? 'فئة الشحن' : 'Shipping Category'}</Label>
              <Select value={form.shipping_category_id || 'none'} onValueChange={v => setForm(f => ({ ...f, shipping_category_id: v === 'none' ? null : v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isAr ? 'بدون شحن' : 'No shipping'}</SelectItem>
                  {shippingCategories.map((sc: any) => (
                    <SelectItem key={sc.id} value={sc.id}>
                      {isAr ? sc.name_ar : sc.name_en} {sc.price_usd === 0 ? (isAr ? '(مجاني)' : '(Free)') : `($${sc.price_usd})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs">{isAr ? 'صور المنتج' : 'Product Images'} ({form.images.length}/{MAX_IMAGES})</Label>
              <p className="text-xs text-muted-foreground mb-2">{isAr ? 'الحد الأقصى 30 كيلوبايت لكل صورة' : 'Max 30KB per image'}</p>
              <div className="flex gap-2 flex-wrap mb-2">
                {form.images.map((img, i) => (
                  <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-border">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute top-0 end-0 bg-destructive text-destructive-foreground rounded-bl-lg p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {form.images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImages}
                    className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors"
                  >
                    {uploadingImages ? (
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">{isAr ? 'رابط الصورة الرئيسية (اختياري)' : 'Main Image URL (optional)'}</Label>
              <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="mt-1" placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs">{isAr ? 'الوحدة (عربي)' : 'Unit (AR)'}</Label>
              <Input value={form.unit_ar} onChange={e => setForm(f => ({ ...f, unit_ar: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{isAr ? 'الوحدة (EN)' : 'Unit (EN)'}</Label>
              <Input value={form.unit_en} onChange={e => setForm(f => ({ ...f, unit_en: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{isAr ? 'نوع البيع' : 'Sell Type'}</Label>
              <Select value={form.unit_type} onValueChange={v => setForm(f => ({ ...f, unit_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight">{isAr ? 'بالوزن' : 'By Weight'}</SelectItem>
                  <SelectItem value="piece">{isAr ? 'بالقطعة' : 'By Piece'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{isAr ? 'الحد الأقصى للكمية' : 'Max Quantity'}</Label>
              <Input type="number" value={form.max_quantity} onChange={e => setForm(f => ({ ...f, max_quantity: parseInt(e.target.value) || 1 }))} className="mt-1" min={1} />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch checked={form.in_stock} onCheckedChange={v => setForm(f => ({ ...f, in_stock: v }))} />
              <Label className="text-sm">{isAr ? 'متوفر' : 'In Stock'}</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setProductDialog(false)}>{t('cancel')}</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-primary text-primary-foreground">{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? t('editCategory') : t('addCategory')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">{t('categoryName')} (عربي)</Label>
              <Input value={catForm.name_ar} onChange={e => setCatForm(f => ({ ...f, name_ar: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t('categoryName')} (EN)</Label>
              <Input value={catForm.name_en} onChange={e => setCatForm(f => ({ ...f, name_en: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t('categoryImage')}</Label>
              <div className="mt-1 flex items-center gap-3">
                {catForm.image_url ? (
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-border">
                    <img src={catForm.image_url} alt="preview" className="h-full w-full object-cover" />
                    <button onClick={() => setCatForm(f => ({ ...f, image_url: '' }))} className="absolute top-0 end-0 bg-destructive text-destructive-foreground rounded-bl-lg p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => catFileInputRef.current?.click()}
                    disabled={uploadingCatImage}
                    className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors"
                  >
                    {uploadingCatImage ? (
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
              <input ref={catFileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleCatImageUpload(e.target.files)} />
              <p className="text-xs text-muted-foreground mt-1">{isAr ? 'الحد الأقصى 30 كيلوبايت' : 'Max 30KB'}</p>
            </div>
            <div>
              <Label className="text-xs">{isAr ? 'الترتيب' : 'Sort Order'}</Label>
              <Input type="number" value={catForm.sort_order} onChange={e => setCatForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCategoryDialog(false)}>{t('cancel')}</Button>
            <Button onClick={handleSaveCategory} disabled={saveCategoryMutation.isPending} className="bg-primary text-primary-foreground">{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping Category Dialog */}
      <Dialog open={shippingDialog} onOpenChange={setShippingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingShipping ? (isAr ? 'تعديل فئة الشحن' : 'Edit Shipping Category') : (isAr ? 'إضافة فئة شحن' : 'Add Shipping Category')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">{isAr ? 'اسم الفئة (عربي)' : 'Category Name (AR)'}</Label>
              <Input value={shipForm.name_ar} onChange={e => setShipForm(f => ({ ...f, name_ar: e.target.value }))} className="mt-1" placeholder={isAr ? 'مثال: شحن عادي' : 'e.g. Standard shipping'} />
            </div>
            <div>
              <Label className="text-xs">{isAr ? 'اسم الفئة (EN)' : 'Category Name (EN)'}</Label>
              <Input value={shipForm.name_en} onChange={e => setShipForm(f => ({ ...f, name_en: e.target.value }))} className="mt-1" placeholder="e.g. Standard shipping" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1">
                {isAr ? 'تكلفة الشحن ($)' : 'Shipping Cost ($)'}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {isAr ? 'أدخل 0 للشحن المجاني. التكلفة بالدولار تُقسم على سعر Pi لعرضها بعملة Pi.' : 'Enter 0 for free shipping. USD cost is divided by Pi price to display in Pi.'}
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input type="number" step="0.01" value={shipForm.price_usd} onChange={e => setShipForm(f => ({ ...f, price_usd: parseFloat(e.target.value) || 0 }))} className="mt-1" />
              {shipForm.price_usd === 0 && <p className="text-xs text-primary mt-1">{isAr ? '✓ شحن مجاني' : '✓ Free shipping'}</p>}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShippingDialog(false)}>{t('cancel')}</Button>
            <Button
              onClick={() => {
                if (!shipForm.name_ar || !shipForm.name_en) { toast.error(isAr ? 'أدخل اسم الفئة' : 'Enter category name'); return; }
                saveShippingMutation.mutate(editingShipping ? { ...shipForm, id: editingShipping.id } : shipForm);
              }}
              disabled={saveShippingMutation.isPending}
              className="bg-primary text-primary-foreground"
            >{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coupon Dialog */}
      <Dialog open={couponDialog} onOpenChange={setCouponDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? (isAr ? 'تعديل الكوبون' : 'Edit Coupon') : (isAr ? 'إضافة كوبون' : 'Add Coupon')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">{isAr ? 'كود الكوبون' : 'Coupon Code'}</Label>
              <Input value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="mt-1 font-mono" placeholder="SAVE20" dir="ltr" />
            </div>
            <div>
              <Label className="text-xs">{isAr ? 'نسبة الخصم (%)' : 'Discount %'}</Label>
              <Input type="number" min={1} max={100} value={couponForm.discount_percent} onChange={e => setCouponForm(f => ({ ...f, discount_percent: parseFloat(e.target.value) || 0 }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{isAr ? 'الحد الأقصى للاستخدام (0 = بلا حدود)' : 'Max uses (0 = unlimited)'}</Label>
              <Input type="number" min={0} value={couponForm.max_uses} onChange={e => setCouponForm(f => ({ ...f, max_uses: parseInt(e.target.value) || 0 }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{isAr ? 'الوصف (عربي)' : 'Description (AR)'}</Label>
              <Input value={couponForm.description_ar} onChange={e => setCouponForm(f => ({ ...f, description_ar: e.target.value }))} className="mt-1" placeholder={isAr ? 'خصم خاص لعملائنا' : 'Special discount'} />
            </div>
            <div>
              <Label className="text-xs">{isAr ? 'الوصف (EN)' : 'Description (EN)'}</Label>
              <Input value={couponForm.description_en} onChange={e => setCouponForm(f => ({ ...f, description_en: e.target.value }))} className="mt-1" placeholder="Special discount" />
            </div>
            <div>
              <Label className="text-xs">{isAr ? 'تاريخ الانتهاء (اختياري)' : 'Expiry date (optional)'}</Label>
              <Input type="date" value={couponForm.expires_at} onChange={e => setCouponForm(f => ({ ...f, expires_at: e.target.value }))} className="mt-1" dir="ltr" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={couponForm.is_active} onCheckedChange={v => setCouponForm(f => ({ ...f, is_active: v }))} />
              <Label className="text-sm">{isAr ? 'نشط' : 'Active'}</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCouponDialog(false)}>{t('cancel')}</Button>
            <Button
              onClick={() => {
                if (!couponForm.code) { toast.error(isAr ? 'أدخل كود الكوبون' : 'Enter coupon code'); return; }
                const data: any = { ...couponForm };
                if (!data.expires_at) data.expires_at = null;
                else data.expires_at = new Date(data.expires_at).toISOString();
                if (editingCoupon) data.id = editingCoupon.id;
                saveCouponMutation.mutate(data);
              }}
              disabled={saveCouponMutation.isPending}
              className="bg-primary text-primary-foreground"
            >{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('confirmDelete')}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t('no')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('yes')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tracking Dialog */}
      <TrackingDialog
        open={trackingDialog}
        onOpenChange={setTrackingDialog}
        orderId={trackingOrderId}
        isAr={isAr}
        onSave={handleTrackingSave}
        isSaving={updateOrderStatus.isPending}
      />
    </div>
  );
};

export default Admin;
