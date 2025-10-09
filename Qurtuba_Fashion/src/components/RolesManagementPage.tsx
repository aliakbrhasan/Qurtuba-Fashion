import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield, ArrowLeft, Grid3X3, List, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { rolesService, Role, Page, Action } from '../services/roles.service';
import { toast } from 'sonner';

// This will be loaded from the service

interface RolesManagementPageProps {
  onBack: () => void;
}

export function RolesManagementPage({ onBack }: RolesManagementPageProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePages, setAvailablePages] = useState<Page[]>([]);
  const [availableActions, setAvailableActions] = useState<Action[]>([]);
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: '',
    description: '',
    permissions: [],
    allowedPages: [],
    allowedActions: [],
    isActive: true
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, pagesData, actionsData] = await Promise.all([
        rolesService.getRoles(),
        rolesService.getPages(),
        rolesService.getActions()
      ]);
      
      setRoles(rolesData);
      setAvailablePages(pagesData);
      setAvailableActions(actionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRole.name?.trim()) {
      toast.error('اسم الدور مطلوب');
      return;
    }
    
    if (!newRole.description?.trim()) {
      toast.error('وصف الدور مطلوب');
      return;
    }

    // Check if role name already exists
    const existingRole = roles.find(role => 
      role.name.toLowerCase() === newRole.name?.toLowerCase()
    );
    if (existingRole) {
      toast.error('اسم الدور موجود مسبقاً');
      return;
    }

    try {
      setSaving(true);
      const roleData = {
        name: newRole.name.trim(),
        description: newRole.description.trim(),
        permissions: newRole.permissions || [],
        allowedPages: newRole.allowedPages || [],
        allowedActions: newRole.allowedActions || [],
        isActive: newRole.isActive || true
      };

      const createdRole = await rolesService.createRole(roleData);
      setRoles([...roles, createdRole]);
      
      setNewRole({
        name: '',
        description: '',
        permissions: [],
        allowedPages: [],
        allowedActions: [],
        isActive: true
      });
      setIsAddRoleDialogOpen(false);
      toast.success('تم إنشاء الدور بنجاح');
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('حدث خطأ في إنشاء الدور');
    } finally {
      setSaving(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
  };

  const handleSaveRole = async () => {
    if (!editingRole) return;

    if (!editingRole.name?.trim()) {
      toast.error('اسم الدور مطلوب');
      return;
    }
    
    if (!editingRole.description?.trim()) {
      toast.error('وصف الدور مطلوب');
      return;
    }

    // Check if role name already exists (excluding current role)
    const existingRole = roles.find(role => 
      role.id !== editingRole.id && 
      role.name.toLowerCase() === editingRole.name?.toLowerCase()
    );
    if (existingRole) {
      toast.error('اسم الدور موجود مسبقاً');
      return;
    }

    try {
      setSaving(true);
      const updatedRoleData = {
        ...editingRole,
        name: editingRole.name.trim(),
        description: editingRole.description.trim()
      };
      
      const updatedRole = await rolesService.updateRole(editingRole.id, updatedRoleData);
      setRoles(roles.map(r => r.id === editingRole.id ? updatedRole : r));
      setEditingRole(null);
      toast.success('تم تحديث الدور بنجاح');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('حدث خطأ في تحديث الدور');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const roleToDelete = roles.find(r => r.id === roleId);
    if (!roleToDelete) return;

    // Check if this is a default role
    const defaultRoles = ['1', '2', '3']; // Default role IDs
    if (defaultRoles.includes(roleId)) {
      toast.error('لا يمكن حذف الأدوار الافتراضية');
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف دور "${roleToDelete.name}"؟\n\nسيتم حذف الدور نهائياً ولا يمكن التراجع عن هذا الإجراء.`)) return;

    try {
      setSaving(true);
      await rolesService.deleteRole(roleId);
      setRoles(roles.filter(r => r.id !== roleId));
      toast.success('تم حذف الدور بنجاح');
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('حدث خطأ في حذف الدور');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePage = (roleId: string, pageId: string) => {
    setEditingRole(prevRole => {
      if (!prevRole) return null;
      const currentPages = prevRole.allowedPages || [];
      const newPages = currentPages.includes(pageId)
        ? currentPages.filter(p => p !== pageId)
        : [...currentPages, pageId];
      return { ...prevRole, allowedPages: newPages };
    });
  };

  const handleToggleAction = (roleId: string, actionId: string) => {
    setEditingRole(prevRole => {
      if (!prevRole) return null;
      const currentActions = prevRole.allowedActions || [];
      const newActions = currentActions.includes(actionId)
        ? currentActions.filter(a => a !== actionId)
        : [...currentActions, actionId];
      return { ...prevRole, allowedActions: newActions };
    });
  };

  const handleToggleNewRolePage = (pageId: string) => {
    setNewRole(prevRole => {
      const currentPages = prevRole.allowedPages || [];
      const newPages = currentPages.includes(pageId)
        ? currentPages.filter(p => p !== pageId)
        : [...currentPages, pageId];
      return { ...prevRole, allowedPages: newPages };
    });
  };

  const handleToggleNewRoleAction = (actionId: string) => {
    setNewRole(prevRole => {
      const currentActions = prevRole.allowedActions || [];
      const newActions = currentActions.includes(actionId)
        ? currentActions.filter(a => a !== actionId)
        : [...currentActions, actionId];
      return { ...prevRole, allowedActions: newActions };
    });
  };

  const handleSelectAllPages = () => {
    const allPageIds = availablePages.map(p => p.id);
    setNewRole(prevRole => ({ ...prevRole, allowedPages: allPageIds }));
  };

  const handleDeselectAllPages = () => {
    setNewRole(prevRole => ({ ...prevRole, allowedPages: [] }));
  };

  const handleSelectAllActions = () => {
    const allActionIds = availableActions.map(a => a.id);
    setNewRole(prevRole => ({ ...prevRole, allowedActions: allActionIds }));
  };

  const handleDeselectAllActions = () => {
    setNewRole(prevRole => ({ ...prevRole, allowedActions: [] }));
  };

  const handleToggleCategoryActions = (category: string, isSelected: boolean) => {
    const categoryActions = availableActions.filter(action => action.category === category);
    const categoryActionIds = categoryActions.map(action => action.id);
    
    setNewRole(prevRole => {
      const currentActions = prevRole.allowedActions || [];
      let newActions;
      
      if (isSelected) {
        // إضافة جميع إجراءات القسم
        newActions = [...new Set([...currentActions, ...categoryActionIds])];
      } else {
        // إزالة جميع إجراءات القسم
        newActions = currentActions.filter(actionId => !categoryActionIds.includes(actionId));
      }
      
      return { ...prevRole, allowedActions: newActions };
    });
  };

  const isCategoryFullySelected = (category: string) => {
    const categoryActions = availableActions.filter(action => action.category === category);
    const categoryActionIds = categoryActions.map(action => action.id);
    const currentActions = newRole.allowedActions || [];
    
    return categoryActionIds.every(actionId => currentActions.includes(actionId));
  };

  const isCategoryPartiallySelected = (category: string) => {
    const categoryActions = availableActions.filter(action => action.category === category);
    const categoryActionIds = categoryActions.map(action => action.id);
    const currentActions = newRole.allowedActions || [];
    
    const selectedCount = categoryActionIds.filter(actionId => currentActions.includes(actionId)).length;
    return selectedCount > 0 && selectedCount < categoryActionIds.length;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#13312A]" />
            <span className="arabic-text text-lg">جاري تحميل البيانات...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {/* Title and Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <h1 className="text-3xl font-bold text-[#13312A] arabic-text">إدارة الأدوار</h1>
        </div>
        
        {/* View Mode and Add Button */}
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
          <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#13312A] hover:bg-[#155446] text-white">
              <Plus className="w-4 h-4 mr-2" />
              إضافة دور جديد
            </Button>
          </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="arabic-text">إضافة دور جديد</DialogTitle>
              <DialogDescription className="arabic-text">
                قم بإضافة دور جديد مع الصلاحيات المطلوبة
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 flex-1 min-h-0 px-6 py-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="roleName" className="arabic-text">اسم الدور</Label>
                  <Input
                    id="roleName"
                    value={newRole.name || ''}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="أدخل اسم الدور"
                  />
                </div>
                <div>
                  <Label htmlFor="roleDescription" className="arabic-text">وصف الدور</Label>
                  <Input
                    id="roleDescription"
                    value={newRole.description || ''}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    placeholder="أدخل وصف الدور"
                  />
                </div>
              </div>

              {/* اختيار الصفحات المسموحة */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="arabic-text text-base font-semibold">الصفحات المسموحة</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllPages}
                      className="text-xs px-3 py-1"
                    >
                      تحديد الكل
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAllPages}
                      className="text-xs px-3 py-1"
                    >
                      إلغاء الكل
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-2 sm:p-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {availablePages.map((page) => (
                    <div key={page.id} className="flex items-start space-x-3 space-x-reverse p-2 sm:p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
                      <input
                        type="checkbox"
                        id={`new-role-page-${page.id}`}
                        checked={(newRole.allowedPages || []).includes(page.id)}
                        onChange={() => handleToggleNewRolePage(page.id)}
                        className="roles-checkbox mt-0.5 flex-shrink-0"
                      />
                      <label htmlFor={`new-role-page-${page.id}`} className="text-sm arabic-text cursor-pointer flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{page.name}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{page.description}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* اختيار الإجراءات المسموحة */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="arabic-text text-base font-semibold">الإجراءات المسموحة</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllActions}
                      className="text-xs px-3 py-1"
                    >
                      تحديد الكل
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAllActions}
                      className="text-xs px-3 py-1"
                    >
                      إلغاء الكل
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {Object.entries(
                    availableActions.reduce((acc, action) => {
                      if (!acc[action.category]) {
                        acc[action.category] = [];
                      }
                      acc[action.category].push(action);
                      return acc;
                    }, {} as Record<string, Action[]>)
                  ).map(([category, actions]) => (
                    <div key={category} className="border rounded-lg p-2 sm:p-4 bg-gray-50">
                      {/* عنوان القسم مع checkbox عام */}
                      <div className="flex items-center space-x-3 space-x-reverse mb-2 sm:mb-3 p-2 bg-white rounded-lg border">
                        <input
                          type="checkbox"
                          id={`new-role-category-${category}`}
                          checked={isCategoryFullySelected(category)}
                          ref={(input) => {
                            if (input) {
                              input.indeterminate = isCategoryPartiallySelected(category);
                            }
                          }}
                          onChange={(e) => handleToggleCategoryActions(category, e.target.checked)}
                          className="roles-checkbox flex-shrink-0"
                        />
                        <label htmlFor={`new-role-category-${category}`} className="text-sm font-semibold arabic-text cursor-pointer flex-1 min-w-0">
                          <div className="truncate">{category}</div>
                        </label>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          ({actions.filter(action => (newRole.allowedActions || []).includes(action.id)).length} / {actions.length})
                        </span>
                      </div>
                      
                      {/* قائمة الإجراءات */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {actions.map((action) => (
                          <div key={action.id} className="flex items-start space-x-3 space-x-reverse p-2 bg-white rounded border hover:shadow-sm transition-shadow">
                            <input
                              type="checkbox"
                              id={`new-role-action-${action.id}`}
                              checked={(newRole.allowedActions || []).includes(action.id)}
                              onChange={() => handleToggleNewRoleAction(action.id)}
                              className="roles-checkbox mt-0.5 flex-shrink-0"
                            />
                            <label htmlFor={`new-role-action-${action.id}`} className="text-xs arabic-text cursor-pointer flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{action.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{action.description}</div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddRoleDialogOpen(false)} disabled={saving}>
                إلغاء
              </Button>
              <Button onClick={handleAddRole} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  'إضافة'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* قائمة الأدوار */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="relative h-full flex flex-col bg-white border-2 border-gray-200 hover:border-[#13312A] hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Shield className="w-5 h-5 text-[#13312A] flex-shrink-0" />
                    <CardTitle className="arabic-text truncate text-[#13312A]">{role.name}</CardTitle>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRole(role)}
                      className="flex-1 sm:flex-none border-[#13312A] text-[#13312A] hover:bg-[#13312A] hover:text-white"
                    >
                      <Edit className="w-4 h-4 sm:mr-1" />
                      <span className="sm:hidden arabic-text text-xs">تعديل</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                      disabled={['1', '2', '3'].includes(role.id)}
                      className="flex-1 sm:flex-none border-red-500 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      title={['1', '2', '3'].includes(role.id) ? 'لا يمكن حذف الأدوار الافتراضية' : 'حذف الدور'}
                    >
                      <Trash2 className="w-4 h-4 sm:mr-1" />
                      <span className="sm:hidden arabic-text text-xs">حذف</span>
                    </Button>
                  </div>
                </div>
                <CardDescription className="arabic-text text-sm line-clamp-2 text-gray-600">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col bg-white">
                {/* عرض الصفحات المسموحة */}
                <div>
                  <p className="text-sm font-medium text-gray-700 arabic-text mb-2">الصفحات المسموحة:</p>
                  <div className="flex flex-wrap gap-1">
                    {(role.allowedPages || []).map((pageId) => {
                      const page = availablePages.find(p => p.id === pageId);
                      return page ? (
                        <Badge key={pageId} variant="outline" className="text-xs px-2 py-1 border-[#13312A] text-[#13312A]">
                          {page.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* عرض الإجراءات المسموحة */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 arabic-text mb-2">الإجراءات المسموحة:</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {Object.entries(
                      availableActions.reduce((acc, action) => {
                        if (!acc[action.category]) {
                          acc[action.category] = [];
                        }
                        if ((role.allowedActions || []).includes(action.id)) {
                          acc[action.category].push(action);
                        }
                        return acc;
                      }, {} as Record<string, Action[]>)
                    ).map(([category, actions]) => (
                      actions.length > 0 && (
                        <div key={category} className="border rounded p-2 bg-gray-50 border-gray-200">
                          <h5 className="text-xs font-semibold arabic-text text-gray-600 mb-1 flex items-center justify-between">
                            <span className="truncate">{category}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">({actions.length})</span>
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {actions.slice(0, 2).map((action) => (
                              <Badge key={action.id} variant="secondary" className="text-xs px-2 py-1 truncate max-w-[120px] bg-[#13312A] text-white">
                                {action.name}
                              </Badge>
                            ))}
                            {actions.length > 2 && (
                              <Badge variant="outline" className="text-xs px-2 py-1 border-gray-400 text-gray-600">
                                +{actions.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-auto">
                  <div className="flex items-center gap-2">
                    <Badge variant={role.isActive ? "default" : "secondary"} className={`text-xs px-2 py-1 ${role.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {role.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                    {['1', '2', '3'].includes(role.id) && (
                      <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                        افتراضي
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 arabic-text">
                    {role.created_at}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">اسم الدور</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">الوصف</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">الصفحات المسموحة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">الإجراءات المسموحة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">تاريخ الإنشاء</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 arabic-text">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#13312A] flex-shrink-0" />
                        <span className="font-medium text-gray-900 arabic-text">{role.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600 arabic-text line-clamp-2">{role.description}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(role.allowedPages || []).slice(0, 3).map((pageId) => {
                          const page = availablePages.find(p => p.id === pageId);
                          return page ? (
                            <Badge key={pageId} variant="outline" className="text-xs px-2 py-1 border-[#13312A] text-[#13312A]">
                              {page.name}
                            </Badge>
                          ) : null;
                        })}
                        {(role.allowedPages || []).length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-1 border-gray-400 text-gray-600">
                            +{(role.allowedPages || []).length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(role.allowedActions || []).slice(0, 3).map((actionId) => {
                          const action = availableActions.find(a => a.id === actionId);
                          return action ? (
                            <Badge key={actionId} variant="secondary" className="text-xs px-2 py-1 bg-[#13312A] text-white truncate max-w-[100px]">
                              {action.name}
                            </Badge>
                          ) : null;
                        })}
                        {(role.allowedActions || []).length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-1 border-gray-400 text-gray-600">
                            +{(role.allowedActions || []).length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={role.isActive ? "default" : "secondary"} className={`text-xs px-2 py-1 ${role.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {role.isActive ? 'نشط' : 'غير نشط'}
                        </Badge>
                        {['1', '2', '3'].includes(role.id) && (
                          <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                            افتراضي
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-gray-500 arabic-text">{role.created_at}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                          className="border-[#13312A] text-[#13312A] hover:bg-[#13312A] hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={['1', '2', '3'].includes(role.id)}
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          title={['1', '2', '3'].includes(role.id) ? 'لا يمكن حذف الأدوار الافتراضية' : 'حذف الدور'}
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

      {/* نافذة تعديل الدور */}
      {editingRole && (
        <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="arabic-text">تعديل الدور</DialogTitle>
              <DialogDescription className="arabic-text">
                قم بتعديل بيانات الدور والصلاحيات
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 flex-1 min-h-0 px-6 py-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editRoleName" className="arabic-text">اسم الدور</Label>
                  <Input
                    id="editRoleName"
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editRoleDescription" className="arabic-text">وصف الدور</Label>
                  <Input
                    id="editRoleDescription"
                    value={editingRole.description}
                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  />
                </div>
              </div>

              {/* اختيار الصفحات المسموحة */}
              <div>
                <Label className="arabic-text text-base font-semibold">الصفحات المسموحة</Label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-2 sm:p-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {availablePages.map((page) => (
                    <div key={page.id} className="flex items-start space-x-3 space-x-reverse p-2 sm:p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
                      <input
                        type="checkbox"
                        id={`edit-role-page-${page.id}`}
                        checked={(editingRole.allowedPages || []).includes(page.id)}
                        onChange={() => handleTogglePage(editingRole.id, page.id)}
                        className="roles-checkbox mt-0.5 flex-shrink-0"
                      />
                      <label htmlFor={`edit-role-page-${page.id}`} className="text-sm arabic-text cursor-pointer flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{page.name}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{page.description}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* اختيار الإجراءات المسموحة */}
              <div>
                <Label className="arabic-text text-base font-semibold">الإجراءات المسموحة</Label>
                <div className="mt-2 space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {Object.entries(
                    availableActions.reduce((acc, action) => {
                      if (!acc[action.category]) {
                        acc[action.category] = [];
                      }
                      acc[action.category].push(action);
                      return acc;
                    }, {} as Record<string, Action[]>)
                  ).map(([category, actions]) => (
                    <div key={category} className="border rounded-lg p-2 sm:p-4 bg-gray-50">
                      {/* عنوان القسم مع checkbox عام */}
                      <div className="flex items-center space-x-3 space-x-reverse mb-2 sm:mb-3 p-2 bg-white rounded-lg border">
                        <input
                          type="checkbox"
                          id={`edit-role-category-${category}`}
                          checked={actions.every(action => (editingRole.allowedActions || []).includes(action.id))}
                          ref={(input) => {
                            if (input) {
                              const selectedCount = actions.filter(action => (editingRole.allowedActions || []).includes(action.id)).length;
                              input.indeterminate = selectedCount > 0 && selectedCount < actions.length;
                            }
                          }}
                          onChange={(e) => {
                            const categoryActionIds = actions.map(action => action.id);
                            const currentActions = editingRole.allowedActions || [];
                            let newActions;
                            
                            if (e.target.checked) {
                              newActions = [...new Set([...currentActions, ...categoryActionIds])];
                            } else {
                              newActions = currentActions.filter(actionId => !categoryActionIds.includes(actionId));
                            }
                            
                            setEditingRole({ ...editingRole, allowedActions: newActions });
                          }}
                          className="roles-checkbox flex-shrink-0"
                        />
                        <label htmlFor={`edit-role-category-${category}`} className="text-sm font-semibold arabic-text cursor-pointer flex-1 min-w-0">
                          <div className="truncate">{category}</div>
                        </label>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          ({actions.filter(action => (editingRole.allowedActions || []).includes(action.id)).length} / {actions.length})
                        </span>
                      </div>
                      
                      {/* قائمة الإجراءات */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {actions.map((action) => (
                          <div key={action.id} className="flex items-start space-x-3 space-x-reverse p-2 bg-white rounded border hover:shadow-sm transition-shadow">
                            <input
                              type="checkbox"
                              id={`edit-role-action-${action.id}`}
                              checked={(editingRole.allowedActions || []).includes(action.id)}
                              onChange={() => handleToggleAction(editingRole.id, action.id)}
                              className="roles-checkbox mt-0.5 flex-shrink-0"
                            />
                            <label htmlFor={`edit-role-action-${action.id}`} className="text-xs arabic-text cursor-pointer flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{action.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{action.description}</div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRole(null)} disabled={saving}>
                إلغاء
              </Button>
              <Button onClick={handleSaveRole} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  'حفظ'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
