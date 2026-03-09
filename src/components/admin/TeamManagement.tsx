import { useState } from 'react';
import { Search, Users, Shield, ShieldCheck, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TeamManagementProps {
  isAr: boolean;
}

const roleIcons: Record<string, any> = {
  admin: ShieldCheck,
  moderator: Shield,
  user: UserCircle,
};

const roleColors: Record<string, string> = {
  admin: 'bg-primary/10 text-primary',
  moderator: 'bg-accent/20 text-accent-foreground',
  user: 'bg-muted text-muted-foreground',
};

const TeamManagement = ({ isAr }: TeamManagementProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: searchResults = [], isFetching } = useQuery({
    queryKey: ['team-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchQuery.trim()}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: searchQuery.trim().length >= 2,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or('is_admin.eq.true,role.eq.admin,role.eq.moderator')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const isAdmin = role === 'admin';
      const { error } = await supabase
        .from('profiles')
        .update({ role, is_admin: isAdmin })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-search'] });
      toast.success(isAr ? 'تم تحديث الصلاحية' : 'Role updated');
    },
    onError: () => toast.error(isAr ? 'حدث خطأ' : 'Error updating role'),
  });

  const getRoleLabel = (role: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      admin: { ar: 'مدير', en: 'Admin' },
      moderator: { ar: 'مشرف', en: 'Moderator' },
      user: { ar: 'مستخدم', en: 'User' },
    };
    return isAr ? labels[role]?.ar || role : labels[role]?.en || role;
  };

  const renderUserCard = (profile: any, showRoleChange: boolean = true) => {
    const currentRole = profile.role || (profile.is_admin ? 'admin' : 'user');
    const RoleIcon = roleIcons[currentRole] || UserCircle;

    return (
      <Card key={profile.id} className="border-border/50 bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <RoleIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm truncate">{profile.username}</h3>
            <p className="text-xs text-muted-foreground truncate">{profile.pi_uid}</p>
          </div>
          <Badge className={roleColors[currentRole] || roleColors.user}>
            {getRoleLabel(currentRole)}
          </Badge>
          {showRoleChange && (
            <Select
              value={currentRole}
              onValueChange={(v) => updateRoleMutation.mutate({ userId: profile.id, role: v })}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{isAr ? 'مستخدم' : 'User'}</SelectItem>
                <SelectItem value="moderator">{isAr ? 'مشرف' : 'Moderator'}</SelectItem>
                <SelectItem value="admin">{isAr ? 'مدير' : 'Admin'}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            {isAr ? 'البحث عن مستخدم' : 'Search User'}
          </h3>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث باسم المستخدم...' : 'Search by username...'}
              className="ps-9 bg-background border-border"
            />
          </div>
          {isFetching && (
            <p className="text-xs text-muted-foreground mt-2">{isAr ? 'جاري البحث...' : 'Searching...'}</p>
          )}
          {searchQuery.trim().length >= 2 && searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {searchResults.map((p: any) => renderUserCard(p))}
            </div>
          )}
          {searchQuery.trim().length >= 2 && !isFetching && searchResults.length === 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-center py-4">
              {isAr ? 'لم يتم العثور على نتائج' : 'No results found'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current Team */}
      <div>
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {isAr ? 'الفريق الحالي' : 'Current Team'}
          <Badge variant="secondary" className="ms-auto text-xs">{teamMembers.length}</Badge>
        </h3>
        {teamMembers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {isAr ? 'لا يوجد أعضاء فريق بعد' : 'No team members yet'}
          </p>
        ) : (
          <div className="space-y-2">
            {teamMembers.map((p: any) => renderUserCard(p))}
          </div>
        )}
      </div>

      {/* Role descriptions */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">{isAr ? 'الصلاحيات' : 'Permissions'}</h4>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">{isAr ? 'مدير' : 'Admin'}</span>
                <p>{isAr ? 'كل الصلاحيات: إدارة المنتجات، الطلبات، الفريق، والإعدادات' : 'Full access: manage products, orders, team, and settings'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">{isAr ? 'مشرف' : 'Moderator'}</span>
                <p>{isAr ? 'إدارة الطلبات والمنتجات فقط' : 'Manage orders and products only'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManagement;
