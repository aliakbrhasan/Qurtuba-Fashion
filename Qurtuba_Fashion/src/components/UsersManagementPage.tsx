import { useState, useEffect } from 'react';
import { Edit, Trash2, UserPlus, Shield, Users, Grid3X3, List, Key, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { authService, User as AuthUser } from '../services/auth.service';
import { rolesService, Role } from '../services/roles.service';
import { toast } from 'sonner';



interface UsersManagementPageProps {
  onNavigate?: (page: string) => void;
}

export function UsersManagementPage({ onNavigate }: UsersManagementPageProps) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<AuthUser | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({
    code: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'موظف' as 'ادمن' | 'موظف' | 'محاسب',
    role: '',
    is_active: true
  });
  const [newPassword, setNewPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isChangingPasswordSubmitting, setIsChangingPasswordSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  // Load users from auth service
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const admin = authService.isAdmin();
        setIsAuthorized(admin);
        if (!admin) {
          setError('ليس لديك صلاحية لعرض المستخدمين');
          setUsers([]);
          return;
        }
        const usersData = await authService.getUsers();
        // Ensure UI state carries sanitized Arabic fields
        setUsers(usersData.map(u => ({
          ...u,
          name: u.name,
          role: u.role
        })));
      } catch (error) {
        console.error('Error loading users:', error);
        const msg = (error as Error)?.message || '';
        if (msg.includes('ليس لديك صلاحية')) {
          setIsAuthorized(false);
        }
        setError('فشل في تحميل المستخدمين' + (msg ? ': ' + msg : ''));
        toast.error('فشل في تحميل المستخدمين');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Load roles for selects
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const rolesData = await rolesService.getRoles();
        setRoles(rolesData.map(r => ({ ...r, name: r.name })));
      } catch (error) {
        console.error('Error loading roles:', error);
      }
    };
    loadRoles();
  }, []);

  const handleAddUser = async () => {
    if (isSubmittingAdd) return;
    if (!newUser.name || !newUser.email || !newUser.role || !newUser.code || !newUser.password) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast.error('صيغة البريد الإلكتروني غير صحيحة');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    try {
      setError('');
      setIsSubmittingAdd(true);
      const result = await authService.createUser({
        code: newUser.code,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || '',
        password: newUser.password,
        status: newUser.status,
        role: newUser.role
      });

      if (result.success && result.user) {
        setUsers([...users, result.user]);
        setNewUser({
          code: '',
          name: '',
          email: '',
          phone: '',
          password: '',
          status: 'موظف',
          role: '',
          is_active: true
        });
        setIsAddUserDialogOpen(false);
        toast.success('تم إنشاء المستخدم بنجاح');
      } else {
        setError(result.error || 'فشل في إنشاء المستخدم');
        toast.error(result.error || 'فشل في إنشاء المستخدم');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError('حدث خطأ أثناء إنشاء المستخدم');
      toast.error('حدث خطأ أثناء إنشاء المستخدم');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleEditUser = (user: AuthUser) => {
    setEditingUser(user);
  };

  const handleSaveUser = async () => {
    if (!editingUser || isSavingUser) return;

    try {
      setError('');
      setIsSavingUser(true);
      const result = await authService.updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone,
        status: editingUser.status,
        role: editingUser.role,
        is_active: editingUser.is_active
      });

      if (result.success && result.user) {
        setUsers(users.map(u => u.id === editingUser.id ? result.user! : u));
        setEditingUser(null);
        toast.success('تم تحديث المستخدم بنجاح');
      } else {
        setError(result.error || 'فشل في تحديث المستخدم');
        toast.error(result.error || 'فشل في تحديث المستخدم');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('حدث خطأ أثناء تحديث المستخدم');
      toast.error('حدث خطأ أثناء تحديث المستخدم');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      return;
    }

    try {
      setError('');
      const result = await authService.deleteUser(userId);
      
      if (result.success) {
        setUsers(users.filter(u => u.id !== userId));
        toast.success('تم حذف المستخدم بنجاح');
      } else {
        setError(result.error || 'فشل في حذف المستخدم');
        toast.error(result.error || 'فشل في حذف المستخدم');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('حدث خطأ أثناء حذف المستخدم');
      toast.error('حدث خطأ أثناء حذف المستخدم');
    }
  };

  const handleChangePassword = async () => {
    if (!changingPasswordUser || isChangingPasswordSubmitting) return;

    // Clear previous errors
    setError('');

    // Validate input fields
    if (!newPassword.newPassword || !newPassword.confirmPassword) {
      const errorMsg = 'يرجى ملء جميع الحقول المطلوبة';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Trim whitespace
    const trimmedNewPassword = newPassword.newPassword.trim();
    const trimmedConfirmPassword = newPassword.confirmPassword.trim();

    // Check minimum length
    if (trimmedNewPassword.length < 6) {
      const errorMsg = 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Check if passwords match
    if (trimmedNewPassword !== trimmedConfirmPassword) {
      const errorMsg = 'كلمة المرور الجديدة وتأكيدها غير متطابقتين';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setIsChangingPasswordSubmitting(true);
      const result = await authService.updatePassword(changingPasswordUser.id, trimmedNewPassword);
      
      if (result.success) {
        setChangingPasswordUser(null);
        setNewPassword({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setError('');
        toast.success('تم تغيير كلمة المرور بنجاح');
      } else {
        const errorMsg = result.error || 'فشل في تغيير كلمة المرور';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMsg = 'حدث خطأ أثناء تغيير كلمة المرور';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsChangingPasswordSubmitting(false);
    }
  };


  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ادمن':
        return 'destructive';
      case 'موظف':
        return 'default';
      case 'محاسب':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-[#13312A] arabic-text">إدارة المستخدمين</h1>
        </div>
        
        {/* View Mode and Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="flex items-center gap-2"
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline arabic-text">البطاقات</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline arabic-text">الجدول</span>
            </Button>
          </div>
          <div className="flex gap-2">
          <Button 
            onClick={() => onNavigate?.('roles')}
            variant="outline"
            className="border-[#13312A] text-[#13312A] hover:bg-[#13312A] hover:text-white"
            disabled={!isAuthorized}
            title={!isAuthorized ? 'تحتاج لصلاحية ادمن' : undefined}
          >
            <Shield className="w-4 h-4 mr-2" />
            إدارة الأدوار
          </Button>
          
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#13312A] hover:bg-[#155446] text-white" disabled={!isAuthorized} title={!isAuthorized ? 'تحتاج لصلاحية ادمن' : undefined}>
                <UserPlus className="w-4 h-4 mr-2" />
                إضافة مستخدم
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-md h-[85vh] sm:h-[90vh] max-h-[85vh] sm:max-h-[90vh] p-3 sm:p-6 m-0 rounded-none sm:rounded-lg flex flex-col overscroll-contain">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="arabic-text">إضافة مستخدم جديد</DialogTitle>
                <DialogDescription className="arabic-text">
                  قم بإضافة مستخدم جديد للنظام
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto flex-1 min-h-0 max-h-[calc(85vh-100px)] sm:max-h-[calc(90vh-120px)] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 touch-pan-y">
                {error && (
                  <div className="flex items-center space-x-2 space-x-reverse p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 arabic-text text-sm">{error}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userCode" className="arabic-text">رمز المستخدم *</Label>
                    <Input
                      id="userCode"
                      value={newUser.code}
                      onChange={(e) => setNewUser({ ...newUser, code: e.target.value })}
                      placeholder="أدخل رمز المستخدم"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="userName" className="arabic-text">اسم المستخدم *</Label>
                    <Input
                      id="userName"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="أدخل اسم المستخدم"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userEmail" className="arabic-text">البريد الإلكتروني *</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="أدخل البريد الإلكتروني"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="userPhone" className="arabic-text">رقم الهاتف</Label>
                    <Input
                      id="userPhone"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      placeholder="أدخل رقم الهاتف"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userPassword" className="arabic-text">كلمة المرور *</Label>
                    <div className="relative">
                      <Input
                        id="userPassword"
                        type={showPassword ? "text" : "password"}
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="أدخل كلمة المرور"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="userStatus" className="arabic-text">الحالة *</Label>
                    <Select value={newUser.status} onValueChange={(value: 'ادمن' | 'موظف' | 'محاسب') => setNewUser({ ...newUser, status: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ادمن">ادمن</SelectItem>
                        <SelectItem value="موظف">موظف</SelectItem>
                        <SelectItem value="محاسب">محاسب</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="userRole" className="arabic-text">الدور *</Label>
                    <Select value={newUser.role} onValueChange={(value: string) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدور" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.length > 0 ? (
                          roles.map((r) => (
                            <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="مدير النظام">مدير النظام</SelectItem>
                            <SelectItem value="مندوب مبيعات">مندوب مبيعات</SelectItem>
                            <SelectItem value="محاسب رئيسي">محاسب رئيسي</SelectItem>
                            <SelectItem value="محاسب مالي">محاسب مالي</SelectItem>
                            <SelectItem value="موظف استقبال">موظف استقبال</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-shrink-0 mt-4">
                <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleAddUser} disabled={isSubmittingAdd} className={isSubmittingAdd ? 'opacity-60 cursor-not-allowed' : ''}>{isSubmittingAdd ? 'جارٍ الإضافة...' : 'إضافة'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      {/* قائمة المستخدمين */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-[#13312A] arabic-text">جاري تحميل بيانات المستخدمين...</div>
        </div>
      ) : viewMode === 'cards' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 arabic-text">
              <Users className="w-5 h-5" />
              قائمة المستخدمين
            </CardTitle>
            <CardDescription className="arabic-text">
              إدارة المستخدمين والصلاحيات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-[#13312A] arabic-text">لا توجد مستخدمين مسجلين</div>
                </div>
              ) : (
                users.map((user) => (
                <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 border-gray-200 rounded-lg bg-white hover:border-[#13312A] hover:shadow-lg transition-all duration-200">
                  <div className="flex-1 mb-3 sm:mb-0">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold arabic-text text-[#13312A]">{user.name}</h3>
                          <Badge variant="outline" className="text-xs w-fit border-[#13312A] text-[#13312A]">{user.code}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 arabic-text mb-1">{user.email}</p>
                        <p className="text-sm text-gray-500 arabic-text">{user.phone}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge variant={getStatusBadgeVariant(user.status)} className="text-xs px-2 py-1">
                        {user.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs px-2 py-1 border-[#13312A] text-[#13312A]">{user.role}</Badge>
                      <Badge variant={user.is_active ? "default" : "secondary"} className={`text-xs px-2 py-1 ${user.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {user.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end sm:justify-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="flex-1 sm:flex-none border-[#13312A] text-[#13312A] hover:bg-[#13312A] hover:text-white"
                      disabled={!isAuthorized}
                      title={!isAuthorized ? 'تحتاج لصلاحية ادمن' : undefined}
                    >
                      <Edit className="w-4 h-4 sm:mr-1" />
                      <span className="sm:hidden arabic-text text-xs">تعديل</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChangingPasswordUser(user)}
                      className="flex-1 sm:flex-none border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                      disabled={!isAuthorized}
                      title={!isAuthorized ? 'تحتاج لصلاحية ادمن' : undefined}
                    >
                      <Key className="w-4 h-4 sm:mr-1" />
                      <span className="sm:hidden arabic-text text-xs">كلمة مرور</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="flex-1 sm:flex-none border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      disabled={!isAuthorized}
                      title={!isAuthorized ? 'تحتاج لصلاحية ادمن' : undefined}
                    >
                      <Trash2 className="w-4 h-4 sm:mr-1" />
                      <span className="sm:hidden arabic-text text-xs">حذف</span>
                    </Button>
                  </div>
                </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-[#13312A] arabic-text flex items-center gap-2">
              <Users className="w-5 h-5" />
              قائمة المستخدمين
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">الاسم</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">الرمز</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">البريد الإلكتروني</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">الهاتف</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">الدور</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">النشاط</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <span className="font-medium text-gray-900 arabic-text">{user.name}</span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className="text-xs px-2 py-1 border-[#13312A] text-[#13312A]">
                        {user.code}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600 arabic-text">{user.email}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600 arabic-text">{user.phone}</span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={getStatusBadgeVariant(user.status)} className="text-xs px-2 py-1">
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className="text-xs px-2 py-1 border-[#13312A] text-[#13312A]">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={user.is_active ? "default" : "secondary"} className={`text-xs px-2 py-1 ${user.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {user.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="border-[#13312A] text-[#13312A] hover:bg-[#13312A] hover:text-white"
                          disabled={!isAuthorized}
                          title={!isAuthorized ? 'تحتاج لصلاحية ادمن' : undefined}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setChangingPasswordUser(user)}
                          className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                          disabled={!isAuthorized}
                          title={!isAuthorized ? 'تحتاج لصلاحية ادمن' : undefined}
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          disabled={!isAuthorized}
                          title={!isAuthorized ? 'تحتاج لصلاحية ادمن' : undefined}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* نافذة تعديل المستخدم */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="w-full max-w-md h-[100dvh] max-h-[100dvh] p-4 sm:p-6 m-0 rounded-none sm:rounded-lg flex flex-col overscroll-contain">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="arabic-text">تعديل المستخدم</DialogTitle>
              <DialogDescription className="arabic-text">
                قم بتعديل بيانات المستخدم
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 max-h-[calc(100dvh-200px)] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 touch-pan-y">
              {error && (
                <div className="flex items-center space-x-2 space-x-reverse p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 arabic-text text-sm">{error}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editUserCode" className="arabic-text">رمز المستخدم</Label>
                  <Input
                    id="editUserCode"
                    value={editingUser.code}
                    onChange={(e) => setEditingUser({ ...editingUser, code: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editUserName" className="arabic-text">اسم المستخدم</Label>
                  <Input
                    id="editUserName"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editUserEmail" className="arabic-text">البريد الإلكتروني</Label>
                  <Input
                    id="editUserEmail"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editUserPhone" className="arabic-text">رقم الهاتف</Label>
                  <Input
                    id="editUserPhone"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editUserStatus" className="arabic-text">الحالة</Label>
                  <Select 
                    value={editingUser.status} 
                    onValueChange={(value: 'ادمن' | 'موظف' | 'محاسب') => setEditingUser({ ...editingUser, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ادمن">ادمن</SelectItem>
                      <SelectItem value="موظف">موظف</SelectItem>
                      <SelectItem value="محاسب">محاسب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editUserRole" className="arabic-text">الدور</Label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(value: string) => setEditingUser({ ...editingUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.length > 0 ? (
                        roles.map((r) => (
                          <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="مدير النظام">مدير النظام</SelectItem>
                          <SelectItem value="مندوب مبيعات">مندوب مبيعات</SelectItem>
                          <SelectItem value="محاسب رئيسي">محاسب رئيسي</SelectItem>
                          <SelectItem value="محاسب مالي">محاسب مالي</SelectItem>
                          <SelectItem value="موظف استقبال">موظف استقبال</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    id="editUserActive"
                    checked={editingUser.is_active}
                    onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                    className="w-4 h-4 text-[#13312A] bg-gray-100 border-gray-300 rounded focus:ring-[#13312A] focus:ring-2"
                  />
                  <Label htmlFor="editUserActive" className="arabic-text cursor-pointer">
                    المستخدم نشط
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 mt-4">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveUser} disabled={isSavingUser}>{isSavingUser ? 'جارٍ الحفظ...' : 'حفظ'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* نافذة تغيير كلمة المرور */}
      {changingPasswordUser && (
        <Dialog open={!!changingPasswordUser} onOpenChange={() => setChangingPasswordUser(null)}>
          <DialogContent className="w-full max-w-md h-[100dvh] max-h-[100dvh] p-4 sm:p-6 m-0 rounded-none sm:rounded-lg flex flex-col overscroll-contain">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="arabic-text">تغيير كلمة المرور</DialogTitle>
              <DialogDescription className="arabic-text">
                تغيير كلمة مرور المستخدم: {changingPasswordUser.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 max-h-[calc(100dvh-200px)] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 touch-pan-y">
              {error && (
                <div className="flex items-center space-x-2 space-x-reverse p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 arabic-text text-sm">{error}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newPassword" className="arabic-text">كلمة المرور الجديدة *</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword.newPassword}
                      onChange={(e) => {
                        setNewPassword({ ...newPassword, newPassword: e.target.value });
                        // Clear error when user starts typing
                        if (error) setError('');
                      }}
                      placeholder="أدخل كلمة المرور الجديدة"
                      required
                      className={newPassword.newPassword && newPassword.newPassword.length < 6 ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {newPassword.newPassword && newPassword.newPassword.length < 6 && (
                    <p className="text-red-500 text-xs mt-1 arabic-text">كلمة المرور يجب أن تكون 6 أحرف على الأقل</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword" className="arabic-text">تأكيد كلمة المرور *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={newPassword.confirmPassword}
                      onChange={(e) => {
                        setNewPassword({ ...newPassword, confirmPassword: e.target.value });
                        // Clear error when user starts typing
                        if (error) setError('');
                      }}
                      placeholder="أعد إدخال كلمة المرور الجديدة"
                      required
                      className={newPassword.confirmPassword && newPassword.newPassword !== newPassword.confirmPassword ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {newPassword.confirmPassword && newPassword.newPassword !== newPassword.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1 arabic-text">كلمة المرور وتأكيدها غير متطابقتين</p>
                  )}
                  {newPassword.confirmPassword && newPassword.newPassword === newPassword.confirmPassword && newPassword.newPassword.length >= 6 && (
                    <p className="text-green-500 text-xs mt-1 arabic-text">✓ كلمة المرور صحيحة</p>
                  )}
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-blue-700 arabic-text text-sm">
                      <p className="font-medium">متطلبات كلمة المرور:</p>
                      <ul className="mt-1 space-y-1 text-xs">
                        <li>• يجب أن تكون 6 أحرف على الأقل</li>
                        <li>• يُفضل أن تحتوي على أرقام وحروف</li>
                        <li>• تجنب استخدام كلمات مرور بسيطة</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 mt-4">
              <Button variant="outline" onClick={() => {
                setChangingPasswordUser(null);
                setNewPassword({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                });
                setError('');
              }}>
                إلغاء
              </Button>
              <Button 
                onClick={handleChangePassword}
                disabled={
                  isChangingPasswordSubmitting ||
                  !newPassword.newPassword || 
                  !newPassword.confirmPassword || 
                  newPassword.newPassword.length < 6 || 
                  newPassword.newPassword !== newPassword.confirmPassword
                }
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPasswordSubmitting ? 'جارٍ التحديث...' : 'تغيير كلمة المرور'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
