import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, Plus, Pencil, Trash2, LayoutDashboard, DollarSign, AlertTriangle, Grid3X3 } from 'lucide-react';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type ProductForm = {
  name_ar: string; name_en: string;
  description_ar: string; description_en: string;
  price: number; image_url: string;
  category: string; unit_ar: string; unit_en: string;
  in_stock: boolean;
};

type CategoryForm = {
  name_ar: string; name_en: string;
  image_url: string; sort_order: number;
};

const emptyProduct: ProductForm = {
  name_ar: '', name_en: '', description_ar: '', description_en: '',
  price: 0, image_url: '', category: 'vegetables',
  unit_ar: 'كيلو', unit_en: 'kg', in_stock: true,
};

const emptyCategory: CategoryForm = {
  name_ar: '', name_en: '', image_url: '', sort_order: 0,
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

  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Tables<'products'> | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'product' | 'category'>('product');

  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Tables<'categories'> | null>(null);
  const [catForm, setCatForm] = useState<CategoryForm>(emptyCategory);

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

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Product mutations
  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from('products').update(data).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(data);
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

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(t('success'));
    },
  });

  const openEdit = (p: Tables<'products'>) => {
    setEditingProduct(p);
    setForm({
      name_ar: p.name_ar, name_en: p.name_en,
      description_ar: p.description_ar || '', description_en: p.description_en || '',
      price: p.price, image_url: p.image_url || '',
      category: p.category, unit_ar: p.unit_ar || 'كيلو', unit_en: p.unit_en || 'kg',
      in_stock: p.in_stock ?? true,
    });
    setProductDialog(true);
  };

  const openAdd = () => { setEditingProduct(null); setForm(emptyProduct); setProductDialog(true); };

  const handleSave = () => {
    if (!form.name_ar || !form.name_en) { toast.error(language === 'ar' ? 'أدخل اسم المنتج' : 'Enter product name'); return; }
    saveMutation.mutate(editingProduct ? { ...form, id: editingProduct.id } : form);
  };

  const openEditCategory = (c: Tables<'categories'>) => {
    setEditingCategory(c);
    setCatForm({ name_ar: c.name_ar, name_en: c.name_en, image_url: c.image_url || '', sort_order: c.sort_order || 0 });
    setCategoryDialog(true);
  };

  const openAddCategory = () => { setEditingCategory(null); setCatForm(emptyCategory); setCategoryDialog(true); };

  const handleSaveCategory = () => {
    if (!catForm.name_ar || !catForm.name_en) { toast.error(language === 'ar' ? 'أدخل اسم القسم' : 'Enter category name'); return; }
    saveCategoryMutation.mutate(editingCategory ? { ...catForm, id: editingCategory.id } : catForm);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    if (deleteType === 'category') deleteCategoryMutation.mutate(deleteId);
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
          <TabsList className="bg-muted mb-6">
            <TabsTrigger value="products">{t('manageProducts')}</TabsTrigger>
            <TabsTrigger value="categories">{t('manageCategories')}</TabsTrigger>
            <TabsTrigger value="orders">{t('manageOrders')}</TabsTrigger>
          </TabsList>

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
                      <h3 className="font-semibold text-foreground text-sm truncate">{language === 'ar' ? p.name_ar : p.name_en}</h3>
                      <p className="text-xs text-muted-foreground">{p.price} π • {p.category}</p>
                    </div>
                    <Badge variant={p.in_stock ? 'default' : 'destructive'} className={p.in_stock ? 'bg-primary/10 text-primary' : ''}>
                      {p.in_stock ? (language === 'ar' ? 'متوفر' : 'In Stock') : t('outOfStock')}
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
                      <h3 className="font-bold text-primary-foreground">{language === 'ar' ? cat.name_ar : cat.name_en}</h3>
                    </div>
                  </div>
                  <CardContent className="p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {language === 'ar' ? `ترتيب: ${cat.sort_order}` : `Order: ${cat.sort_order}`}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditCategory(cat)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setDeleteType('category'); setDeleteId(cat.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at!).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
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
                        <Select value={order.status} onValueChange={(v) => updateOrderStatus.mutate({ id: order.id, status: v })}>
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
              <Label className="text-xs">{language === 'ar' ? 'الوصف (عربي)' : 'Description (AR)'}</Label>
              <Textarea value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} className="mt-1" rows={2} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">{language === 'ar' ? 'الوصف (EN)' : 'Description (EN)'}</Label>
              <Textarea value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} className="mt-1" rows={2} />
            </div>
            <div>
              <Label className="text-xs">{t('productPrice')} (π)</Label>
              <Input type="number" step="0.0001" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t('productCategory')}</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.name_en.toLowerCase()}>{language === 'ar' ? c.name_ar : c.name_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">{language === 'ar' ? 'رابط الصورة' : 'Image URL'}</Label>
              <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="mt-1" placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs">{language === 'ar' ? 'الوحدة (عربي)' : 'Unit (AR)'}</Label>
              <Input value={form.unit_ar} onChange={e => setForm(f => ({ ...f, unit_ar: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{language === 'ar' ? 'الوحدة (EN)' : 'Unit (EN)'}</Label>
              <Input value={form.unit_en} onChange={e => setForm(f => ({ ...f, unit_en: e.target.value }))} className="mt-1" />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch checked={form.in_stock} onCheckedChange={v => setForm(f => ({ ...f, in_stock: v }))} />
              <Label className="text-sm">{language === 'ar' ? 'متوفر' : 'In Stock'}</Label>
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
              <Input value={catForm.image_url} onChange={e => setCatForm(f => ({ ...f, image_url: e.target.value }))} className="mt-1" placeholder="https://..." />
              {catForm.image_url && (
                <img src={catForm.image_url} alt="preview" className="mt-2 h-24 w-full rounded-lg object-cover" />
              )}
            </div>
            <div>
              <Label className="text-xs">{language === 'ar' ? 'الترتيب' : 'Sort Order'}</Label>
              <Input type="number" value={catForm.sort_order} onChange={e => setCatForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCategoryDialog(false)}>{t('cancel')}</Button>
            <Button onClick={handleSaveCategory} disabled={saveCategoryMutation.isPending} className="bg-primary text-primary-foreground">{t('save')}</Button>
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
    </div>
  );
};

export default Admin;
