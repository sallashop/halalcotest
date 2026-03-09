import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tables } from '@/integrations/supabase/types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Package, Calendar } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, startOfWeek, startOfMonth, isSameDay } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

type Props = {
  orders: Tables<'orders'>[];
  products: Tables<'products'>[];
  orderItems: { order_id: string; product_id: string; quantity: number; price: number }[];
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444'];

const SalesReports = ({ orders, products, orderItems }: Props) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const dateLocale = isAr ? ar : enUS;

  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = subDays(new Date(), periodDays);

  // Filter orders by period
  const filteredOrders = useMemo(() => {
    return orders.filter(o => new Date(o.created_at!) >= startDate);
  }, [orders, startDate]);

  // Daily revenue data
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    return days.map(day => {
      const dayOrders = filteredOrders.filter(o => 
        isSameDay(new Date(o.created_at!), day)
      );
      return {
        date: format(day, 'MM/dd', { locale: dateLocale }),
        fullDate: format(day, 'PPP', { locale: dateLocale }),
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
      };
    });
  }, [filteredOrders, startDate, dateLocale]);

  // Order status distribution
  const statusData = useMemo(() => {
    const statusCount: Record<string, number> = {};
    filteredOrders.forEach(o => {
      statusCount[o.status] = (statusCount[o.status] || 0) + 1;
    });
    const statusLabels: Record<string, string> = {
      pending: isAr ? 'قيد الانتظار' : 'Pending',
      confirmed: isAr ? 'مؤكد' : 'Confirmed',
      shipped: isAr ? 'تم الشحن' : 'Shipped',
      delivered: isAr ? 'تم التوصيل' : 'Delivered',
      cancelled: isAr ? 'ملغي' : 'Cancelled',
    };
    return Object.entries(statusCount).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
    }));
  }, [filteredOrders, isAr]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    filteredOrders.forEach(order => {
      const items = orderItems.filter(i => i.order_id === order.id);
      items.forEach(item => {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          if (!productSales[product.id]) {
            productSales[product.id] = {
              name: isAr ? product.name_ar : product.name_en,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[product.id].quantity += item.quantity;
          productSales[product.id].revenue += item.price * item.quantity;
        }
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrders, orderItems, products, isAr]);

  // Stats
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered').length;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {isAr ? 'تقارير المبيعات' : 'Sales Reports'}
        </h2>
        <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 me-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{isAr ? 'آخر 7 أيام' : 'Last 7 days'}</SelectItem>
            <SelectItem value="30d">{isAr ? 'آخر 30 يوم' : 'Last 30 days'}</SelectItem>
            <SelectItem value="90d">{isAr ? 'آخر 90 يوم' : 'Last 90 days'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
                <p className="text-lg font-bold text-foreground">{totalRevenue.toFixed(2)} π</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? 'عدد الطلبات' : 'Total Orders'}</p>
                <p className="text-lg font-bold text-foreground">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? 'متوسط الطلب' : 'Avg. Order'}</p>
                <p className="text-lg font-bold text-foreground">{avgOrderValue.toFixed(2)} π</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? 'تم التوصيل' : 'Delivered'}</p>
                <p className="text-lg font-bold text-foreground">{deliveredOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            {isAr ? 'الإيرادات اليومية' : 'Daily Revenue'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${v.toFixed(0)}π`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`${value.toFixed(4)} π`, isAr ? 'الإيرادات' : 'Revenue']}
                  labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Orders Chart */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            {isAr ? 'عدد الطلبات اليومية' : 'Daily Orders'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [value, isAr ? 'الطلبات' : 'Orders']}
                />
                <Bar 
                  dataKey="orders" 
                  fill="hsl(var(--accent))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Order Status Pie */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              {isAr ? 'توزيع حالات الطلبات' : 'Order Status Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {isAr ? 'لا توجد بيانات' : 'No data'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              {isAr ? 'أكثر المنتجات مبيعاً' : 'Top Selling Products'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.quantity} {isAr ? 'مبيع' : 'sold'} • {product.revenue.toFixed(2)} π
                      </p>
                    </div>
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(product.quantity / (topProducts[0]?.quantity || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                {isAr ? 'لا توجد مبيعات بعد' : 'No sales yet'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesReports;
