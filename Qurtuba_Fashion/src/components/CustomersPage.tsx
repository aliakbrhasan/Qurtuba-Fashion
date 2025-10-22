import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Plus,
  Search,
  Edit,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Star,
  Printer,
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  Eye,
  FilterX,
  RefreshCw,
  User,
  CheckCircle
} from 'lucide-react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Customer } from '../types/customer';
import { openPrintWindow, formatPrintDateTime } from './print/PrintUtils';
import { formatCurrency, formatDate } from './PrintableInvoice';
import { databaseService } from '../db/database.service';
import { usePermissions } from '../hooks/usePermissions';
import { authService } from '../services/auth.service';

interface CustomersPageProps {
  customers: Customer[];
  onCustomerSelect: (customer: Customer) => void;
  loading?: boolean;
  onCreateInvoiceForCustomer?: (customer: Customer) => void;
  onEditCustomer?: (customer: Customer) => void;
}

export function CustomersPage({ customers, onCustomerSelect, loading = false, onCreateInvoiceForCustomer }: CustomersPageProps) {
  const [currentUser] = useState(authService.getCurrentUser());
  const { hasActionPermission } = usePermissions(currentUser);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLabel, setFilterLabel] = useState('all');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    label: 'جديد'
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editDraft, setEditDraft] = useState<Customer | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (isEditOpen && editCustomer) {
      // Initialize draft once per open to avoid re-mounts while typing
      setEditDraft(JSON.parse(JSON.stringify(editCustomer)) as Customer);
    }
  }, [isEditOpen, editCustomer]);

  // Lightweight date formatter for human-readable dates
  const formatHumanDate = (dateString: string | null) => {
    if (!dateString) return 'لا يوجد طلبات';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'أمس';
      if (diffDays < 7) return `منذ ${diffDays} أيام`;
      if (diffDays < 30) return `منذ ${Math.ceil(diffDays / 7)} أسابيع`;
      
      // Format as MM-YYYY HH:MM for older dates
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${month}-${year} ${hours}:${minutes}`;
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'جديد': return 'bg-blue-100 text-blue-800';
      case 'منتظم': return 'bg-green-100 text-green-800';
      case 'وفي': return 'bg-purple-100 text-purple-800';
      case 'ذهبي': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLabelIcon = (label: string) => {
    switch (label) {
      case 'ذهبي': return <Star className="w-3 h-3" />;
      default: return null;
    }
  };

  const getLabelPrintStyle = (label: string): React.CSSProperties => {
    switch (label) {
      case 'ذهبي':
        return {
          backgroundColor: 'rgba(246, 196, 120, 0.25)',
          color: '#8a5a00',
          border: '1px solid rgba(246, 196, 120, 0.5)',
        };
      case 'وفي':
        return {
          backgroundColor: 'rgba(134, 88, 190, 0.18)',
          color: '#533288',
          border: '1px solid rgba(134, 88, 190, 0.35)',
        };
      case 'منتظم':
        return {
          backgroundColor: 'rgba(21, 84, 70, 0.15)',
          color: '#155446',
          border: '1px solid rgba(21, 84, 70, 0.4)',
        };
      case 'جديد':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
          color: '#1d4ed8',
          border: '1px solid rgba(59, 130, 246, 0.35)',
        };
      default:
        return {
          backgroundColor: 'rgba(198, 154, 114, 0.2)',
          color: '#13312A',
          border: '1px solid rgba(198, 154, 114, 0.4)',
        };
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      return;
    }

    try {
      setIsCreating(true);
      const customerData = {
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address,
        label: newCustomer.label,
        totalSpent: 0,
        lastOrder: undefined,
        measurements: {
          height: 0,
          shoulder: 0,
          waist: 0,
          chest: 0,
          collar: 0
        },
        notes: '',
        created_at: new Date().toISOString()
      };

      await databaseService.createCustomer(customerData);
      
      // Reset form
      setNewCustomer({
        name: '',
        phone: '',
        address: '',
        label: 'جديد'
      });
      setIsNewCustomerOpen(false);
      
      // Refresh the page to show new customer
      window.location.reload();
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Sorting helpers
  const defaultDescFields = new Set(['totalSpent', 'ordersCount', 'lastOrder']);
  const handleHeaderSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(defaultDescFields.has(field) ? 'desc' : 'asc');
    }
  };

  const compareValues = (a: any, b: any, direction: 'asc' | 'desc') => {
    const multiplier = direction === 'asc' ? 1 : -1;
    if (typeof a === 'number' && typeof b === 'number') {
      return (a - b) * multiplier;
    }
    const aDate = new Date(a);
    const bDate = new Date(b);
    if (!Number.isNaN(aDate.getTime()) && !Number.isNaN(bDate.getTime())) {
      return (aDate.getTime() - bDate.getTime()) * multiplier;
    }
    return String(a ?? '').localeCompare(String(b ?? ''), 'ar', { sensitivity: 'base' }) * multiplier;
  };

  // Ensure unique customers by id to avoid duplicate keys from legacy data
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, Customer>();
    for (const c of customers) {
      map.set(String(c.id), c);
    }
    return Array.from(map.values());
  }, [customers]);

  // Enhanced filtering and sorting logic
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = uniqueCustomers.filter(customer => {
      // Search filter
      const matchesSearch = (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (customer.phone || '').includes(searchTerm) ||
                           (customer.address || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Label filter
      const matchesFilter = filterLabel === 'all' || customer.label === filterLabel;
      
      return matchesSearch && matchesFilter;
    });

    // Sort filtered results
    return [...filtered].sort((a, b) => {
      switch (sortField) {
        case 'name':
          return compareValues(a.name, b.name, sortDirection);
        case 'phone':
          return compareValues(a.phone, b.phone, sortDirection);
        case 'address':
          return compareValues(a.address, b.address, sortDirection);
        case 'label':
          return compareValues(a.label, b.label, sortDirection);
        case 'ordersCount':
          return compareValues(a.orders.length, b.orders.length, sortDirection);
        case 'lastOrder':
          return compareValues(a.lastOrder, b.lastOrder, sortDirection);
        case 'totalSpent':
          return compareValues(a.totalSpent, b.totalSpent, sortDirection);
        default:
          return 0;
      }
    });
  }, [uniqueCustomers, searchTerm, filterLabel, sortField, sortDirection]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredAndSortedCustomers.length;
    const newCustomers = filteredAndSortedCustomers.filter(c => c.label === 'جديد').length;
    const regularCustomers = filteredAndSortedCustomers.filter(c => c.label === 'منتظم').length;
    const loyalCustomers = filteredAndSortedCustomers.filter(c => c.label === 'وفي').length;
    const goldenCustomers = filteredAndSortedCustomers.filter(c => c.label === 'ذهبي').length;
    const totalSpent = filteredAndSortedCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalOrders = filteredAndSortedCustomers.reduce((sum, c) => sum + c.orders.length, 0);
    
    return { total, newCustomers, regularCustomers, loyalCustomers, goldenCustomers, totalSpent, totalOrders };
  }, [filteredAndSortedCustomers]);

  const handlePrintCustomers = () => {
    const totalCustomers = filteredAndSortedCustomers.length;
    const totalOrders = filteredAndSortedCustomers.reduce((sum, customer) => sum + customer.orders.length, 0);
    const totalSpent = filteredAndSortedCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const averageOrders = totalCustomers > 0 ? (totalOrders / totalCustomers).toFixed(1) : '0';
    const labelCounts = filteredAndSortedCustomers.reduce<Record<string, number>>((acc, customer) => {
      acc[customer.label] = (acc[customer.label] || 0) + 1;
      return acc;
    }, {});
    const now = new Date();

    openPrintWindow('قائمة الزبائن', (
      <>
        <header className="print-header">
          <h1 className="print-title">سجل الزبائن</h1>
          <p className="print-subtitle">قائمة ببيانات الزبائن وتفاصيل التعامل معهم داخل مركز أزياء قرطبة</p>
          <div className="print-meta">
            <span>تاريخ الطباعة: {formatPrintDateTime(now)}</span>
            <span>عدد الزبائن: {totalCustomers}</span>
          </div>
        </header>

        <section className="print-section">
          <h2 className="section-title">ملخص سريع</h2>
          <div className="metrics-grid">
            <div className="metric-card accent">
              <span className="metric-label">عدد الزبائن الحالي</span>
              <span className="metric-value">{totalCustomers}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">إجمالي الإنفاق</span>
              <span className="metric-value">{formatCurrency(totalSpent)}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">عدد الطلبات المسجلة</span>
              <span className="metric-value">{totalOrders}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">متوسط الطلبات لكل زبون</span>
              <span className="metric-value">{averageOrders}</span>
            </div>
            {Object.entries(labelCounts).map(([label, count]) => (
              <div className="metric-card" key={label}>
                <span className="metric-label">زبائن {label}</span>
                <span className="metric-value">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="print-section">
          <h2 className="section-title">جدول الزبائن</h2>
          <p className="section-description">يسرد الجدول التفاصيل الأساسية عن كل زبون بما في ذلك معلومات التواصل والتصنيف.</p>
          <div className="print-table-wrapper">
            <table className="print-table">
              <thead>
                <tr>
                  <th>اسم الزبون</th>
                  <th>الهاتف</th>
                  <th>العنوان</th>
                  <th>التصنيف</th>
                  <th>آخر طلب</th>
                  <th>إجمالي الإنفاق</th>
                  <th>عدد الطلبات</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.address}</td>
                    <td>
                      <span className="status-pill" style={getLabelPrintStyle(customer.label)}>
                        {customer.label}
                      </span>
                    </td>
                    <td>{formatDate(customer.lastOrder)}</td>
                    <td>{formatCurrency(customer.totalSpent)}</td>
                    <td>{customer.orders.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="print-section">
          <h2 className="section-title">تفاصيل الزبائن</h2>
          <p className="section-description">يقدم هذا القسم عرضاً تفصيلياً لتاريخ كل زبون وقياساته والطلبات التي تمت متابعتها.</p>
          <div className="detail-cards">
            {filteredAndSortedCustomers.map((customer) => (
              <article className="detail-card" key={`customer-${customer.id}`}>
                <div className="detail-card-header">
                  <h3 className="detail-title">{customer.name}</h3>
                  <span className="status-pill" style={getLabelPrintStyle(customer.label)}>
                    {customer.label}
                  </span>
                </div>
                <div className="detail-grid two-column">
                  <div className="detail-item">
                    <span className="item-label">الهاتف</span>
                    <span className="item-value">{customer.phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="item-label">العنوان</span>
                    <span className="item-value">{customer.address}</span>
                  </div>
                  <div className="detail-item">
                    <span className="item-label">آخر طلب</span>
                    <span className="item-value">{formatDate(customer.lastOrder)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="item-label">إجمالي الإنفاق</span>
                    <span className="item-value">{formatCurrency(customer.totalSpent)}</span>
                  </div>
                </div>

                <div className="detail-subsection">
                  <h4 className="subsection-title">القياسات الأساسية</h4>
                  <div className="detail-grid two-column">
                    <div className="detail-item">
                      <span className="item-label">الطول</span>
                      <span className="item-value">{customer.measurements.height} سم</span>
                    </div>
                    <div className="detail-item">
                      <span className="item-label">الأكتاف</span>
                      <span className="item-value">{customer.measurements.shoulder} سم</span>
                    </div>
                    <div className="detail-item">
                      <span className="item-label">الردن</span>
                      <span className="item-value">{customer.measurements.waist} سم</span>
                    </div>
                    <div className="detail-item">
                      <span className="item-label">الصدر</span>
                      <span className="item-value">{customer.measurements.chest} سم</span>
                    </div>
                  </div>
                </div>

                <div className="detail-subsection">
                  <h4 className="subsection-title">سجل الطلبات</h4>
                  <ul className="list">
                    {customer.orders.length > 0 ? (
                      customer.orders.map((order) => (
                        <li className="list-item" key={order.id}>
                          <div className="item-label">#{order.id} — {order.type}</div>
                          <div className="item-value">الحالة: {order.status}</div>
                          <div className="item-value">الفترة: {formatDate(order.orderDate)} إلى {formatDate(order.deliveryDate)}</div>
                          <div className="item-value">قيمة الطلب: {formatCurrency(order.total)} | المدفوع: {formatCurrency(order.paid)}</div>
                        </li>
                      ))
                    ) : (
                      <li className="list-item">لا توجد طلبات مسجلة لهذا الزبون.</li>
                    )}
                  </ul>
                </div>

                {customer.notes && (
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="item-label">ملاحظات إضافية</span>
                      <span className="item-value">{customer.notes}</span>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </>
    ));
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6E9CA] to-[#FDFBF7]">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg border border-[#C69A72]/20 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#13312A] arabic-text mb-1">إدارة الزبائن</h1>
              <p className="text-[#155446] arabic-text">إدارة شاملة لبيانات العملاء والزبائن</p>
            </div>
            
            {/* Action Buttons - Same order as Invoices Page */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-2 border-[#155446] text-[#155446] hover:bg-[#155446] hover:text-white flex items-center gap-2 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Filter className="w-5 h-5" />
                <span className="arabic-text">تصفية متقدمة</span>
              </Button>
              
              {hasActionPermission('print_customers_list') && (
                <Button
                  variant="outline"
                  onClick={handlePrintCustomers}
                  className="border-2 border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] hover:text-white flex items-center gap-2 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Printer className="w-5 h-5" />
                  <span className="arabic-text">طباعة القائمة</span>
                </Button>
              )}
              
              {hasActionPermission('create_customer') && (
                <Button
                  onClick={() => setIsNewCustomerOpen(true)}
                  className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] flex items-center gap-2 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                  <span className="arabic-text">زبون جديد</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards - Only show if user has permission */}
        {hasActionPermission('view_financial_reports') && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-[#155446] to-[#13312A] border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-[#13312A]" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2 text-black">{stats.total}</div>
                <div className="text-sm opacity-90 arabic-text text-black">إجمالي الزبائن</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-[#13312A]" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2 text-black">{stats.regularCustomers}</div>
                <div className="text-sm opacity-90 arabic-text text-black">منتظمون</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-[#13312A]" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2 text-black">{stats.goldenCustomers}</div>
                <div className="text-sm opacity-90 arabic-text text-black">زبائن ذهبيون</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-[#C69A72] to-[#B8860B] border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-[#13312A]" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2 text-black">{formatCurrency(stats.totalSpent)}</div>
                <div className="text-sm opacity-90 arabic-text text-black">إجمالي الإنفاق</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Basic Filters */}
        <Card className="bg-white rounded-xl shadow-lg border border-[#C69A72]/20">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#155446] w-5 h-5" />
                <Input
                  placeholder="بحث عن الزبائن، الأسماء، أو أرقام الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 pl-4 py-3 bg-white border-2 border-[#C69A72]/30 rounded-xl text-right text-lg focus:border-[#155446] focus:ring-2 focus:ring-[#155446]/20 transition-all duration-300"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={sortField} onValueChange={(val: string) => { setSortField(val); setSortDirection(defaultDescFields.has(val) ? 'desc' : 'asc'); }}>
                  <SelectTrigger className="w-48 border-2 border-[#C69A72]/30 rounded-xl" aria-label="ترتيب حسب" title="ترتيب حسب">
                    <SelectValue placeholder="ترتيب حسب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">الاسم</SelectItem>
                    <SelectItem value="totalSpent">إجمالي الإنفاق</SelectItem>
                    <SelectItem value="ordersCount">عدد الطلبات</SelectItem>
                    <SelectItem value="lastOrder">آخر طلب</SelectItem>
                    <SelectItem value="label">التصنيف</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-[#C69A72]/30">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="flex items-center gap-2"
                    aria-label="عرض بشكل جدول"
                    title="عرض بشكل جدول"
                  >
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline arabic-text">جدول</span>
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="flex items-center gap-2"
                    aria-label="عرض بشكل شبكة"
                    title="عرض بشكل شبكة"
                  >
                    <Grid3X3 className="w-4 h-4" />
                    <span className="hidden sm:inline arabic-text">شبكة</span>
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterLabel('all');
                    setSortField('name');
                    setSortDirection('asc');
                  }}
                  className="border-2 border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-2 px-4 py-3 rounded-xl"
                >
                  <FilterX className="w-4 h-4" />
                  <span className="arabic-text">مسح الفلاتر</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="bg-white rounded-xl shadow-lg border border-[#C69A72]/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-[#13312A] arabic-text mb-4">تصفية متقدمة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label className="text-[#155446] arabic-text font-semibold mb-2 block">تصنيف الزبون</Label>
                  <Select value={filterLabel} onValueChange={setFilterLabel}>
                    <SelectTrigger className="border-2 border-[#C69A72]/30 rounded-xl" aria-label="تصفية حسب التصنيف" title="تصفية حسب التصنيف">
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع التصنيفات</SelectItem>
                      <SelectItem value="جديد">جديد</SelectItem>
                      <SelectItem value="منتظم">منتظم</SelectItem>
                      <SelectItem value="وفي">وفي</SelectItem>
                      <SelectItem value="ذهبي">ذهبي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={() => setShowFilters(false)}
                    className="w-full bg-[#155446] hover:bg-[#13312A] text-white flex items-center gap-2 px-4 py-3 rounded-xl"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="arabic-text">تطبيق الفلاتر</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#155446] mx-auto mb-4"></div>
              <div className="text-[#13312A] arabic-text text-lg">جاري تحميل بيانات الزبائن...</div>
            </div>
          </div>
        )}

        {/* Customers Display */}
        {!loading && (
          <>
            {filteredAndSortedCustomers.length === 0 ? (
              <Card className="bg-white rounded-xl shadow-lg border border-[#C69A72]/20">
                <CardContent className="p-16 text-center">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#13312A] arabic-text mb-2">لا توجد زبائن</h3>
                  <p className="text-[#155446] arabic-text mb-6">لم يتم العثور على زبائن تطابق معايير البحث</p>
                  <Button
                    onClick={() => setIsNewCustomerOpen(true)}
                    className="bg-[#155446] hover:bg-[#13312A] text-white px-8 py-3 text-lg rounded-xl"
                  >
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة زبون جديد
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Table View */}
                {viewMode === 'table' && (
                  <Card className="bg-white rounded-xl shadow-lg border border-[#C69A72]/20 overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-[#13312A] to-[#155446] hover:bg-gradient-to-r hover:from-[#13312A] hover:to-[#155446]">
                            <TableHead className="text-black arabic-text text-right font-bold text-base select-none">
                              <div className="flex items-center justify-between cursor-pointer" onClick={() => handleHeaderSort('name')}>
                                <span>اسم الزبون</span>
                                {sortField === 'name' ? (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 opacity-70" />}
                              </div>
                            </TableHead>
                            <TableHead className="text-black arabic-text text-right font-bold text-base select-none">
                              <div className="flex items-center justify-between cursor-pointer" onClick={() => handleHeaderSort('phone')}>
                                <span>الهاتف</span>
                                {sortField === 'phone' ? (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 opacity-70" />}
                              </div>
                            </TableHead>
                            <TableHead className="text-black arabic-text text-right font-bold text-base select-none">
                              <div className="flex items-center justify-between cursor-pointer" onClick={() => handleHeaderSort('address')}>
                                <span>العنوان</span>
                                {sortField === 'address' ? (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 opacity-70" />}
                              </div>
                            </TableHead>
                            <TableHead className="text-black arabic-text text-right font-bold text-base select-none">
                              <div className="flex items-center justify-between cursor-pointer" onClick={() => handleHeaderSort('label')}>
                                <span>التصنيف</span>
                                {sortField === 'label' ? (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 opacity-70" />}
                              </div>
                            </TableHead>
                            <TableHead className="text-black arabic-text text-right font-bold text-base select-none">
                              <div className="flex items-center justify-between cursor-pointer" onClick={() => handleHeaderSort('lastOrder')}>
                                <span>آخر طلب</span>
                                {sortField === 'lastOrder' ? (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 opacity-70" />}
                              </div>
                            </TableHead>
                            <TableHead className="text-black arabic-text text-right font-bold text-base select-none">
                              <div className="flex items-center justify-between cursor-pointer" onClick={() => handleHeaderSort('totalSpent')}>
                                <span>إجمالي الإنفاق</span>
                                {sortField === 'totalSpent' ? (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 opacity-70" />}
                              </div>
                            </TableHead>
                            <TableHead className="text-black arabic-text text-right font-bold text-base select-none">
                              <div className="flex items-center justify-between cursor-pointer" onClick={() => handleHeaderSort('ordersCount')}>
                                <span>عدد الطلبات</span>
                                {sortField === 'ordersCount' ? (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 opacity-70" />}
                              </div>
                            </TableHead>
                            <TableHead className="text-black arabic-text text-right font-bold text-base">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAndSortedCustomers.map((customer) => (
                            <TableRow 
                              key={customer.id} 
                              className="hover:bg-gradient-to-r hover:from-[#F6E9CA]/50 hover:to-[#FDFBF7] cursor-pointer transition-all duration-300 border-b border-[#C69A72]/20"
                              onClick={() => onCustomerSelect(customer)}
                            >
                              <TableCell className="text-[#13312A] arabic-text font-semibold text-lg">{customer.name}</TableCell>
                              <TableCell className="text-[#13312A] font-mono">{customer.phone}</TableCell>
                              <TableCell className="text-[#13312A] arabic-text">{customer.address}</TableCell>
                              <TableCell>
                                <Badge className={`${getLabelColor(customer.label)} px-3 py-1 text-sm font-semibold rounded-full flex items-center gap-1 w-fit`}>
                                  {getLabelIcon(customer.label)}
                                  {customer.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-[#13312A] arabic-text">{formatHumanDate(customer.lastOrder)}</TableCell>
                              <TableCell className="text-[#13312A] font-bold text-lg">{formatCurrency(customer.totalSpent)}</TableCell>
                              <TableCell className="text-[#13312A] font-bold text-lg">{customer.orders.length}</TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onCustomerSelect(customer)}
                                    className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] hover:text-white rounded-lg"
                                    aria-label={`عرض تفاصيل ${customer.name}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 px-3" aria-label={`مزید إجراءات لـ ${customer.name}`} title={`مزید إجراءات لـ ${customer.name}`}>
                                      <MoreVertical className="w-4 h-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-white border-[#C69A72] rounded-xl shadow-lg">
                                      <DropdownMenuItem onClick={() => onCustomerSelect(customer)} className="arabic-text">
                                        <Eye className="w-4 h-4 ml-2" />
                                        عرض التفاصيل
                                      </DropdownMenuItem>
                                      {hasActionPermission('edit_customer') && (
                                        <DropdownMenuItem className="arabic-text" onClick={() => { setEditCustomer(customer); setIsEditOpen(true); }}>
                                          <Edit className="w-4 h-4 ml-2" />
                                          تعديل البيانات
                                        </DropdownMenuItem>
                                      )}
                                      {hasActionPermission('create_invoice') && (
                                        <DropdownMenuItem className="arabic-text" onClick={() => onCreateInvoiceForCustomer?.(customer)}>
                                          <Plus className="w-4 h-4 ml-2" />
                                          إضافة طلب جديد
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                )}

                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAndSortedCustomers.map((customer) => (
                      <Card 
                        key={customer.id} 
                        className="bg-white rounded-xl shadow-lg border border-[#C69A72]/20 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                        onClick={() => onCustomerSelect(customer)}
                      >
                        <CardContent className="p-6">
                          {/* Header with name and badge */}
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[#13312A] arabic-text truncate flex-1">{customer.name}</h3>
                            <Badge className={`${getLabelColor(customer.label)} flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full flex-shrink-0`}>
                              {getLabelIcon(customer.label)}
                              {customer.label}
                            </Badge>
                          </div>

                          {/* Customer details */}
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-3 text-[#155446]">
                              <Phone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                              <span className="text-sm truncate" title={customer.phone}>{customer.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[#155446]">
                              <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                              <span className="text-sm truncate arabic-text" title={customer.address}>{customer.address}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[#155446]">
                              <Calendar className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                              <span className="text-sm arabic-text">آخر طلب: {formatHumanDate(customer.lastOrder)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[#155446]">
                              <CreditCard className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                              <span className="text-sm arabic-text">{formatCurrency(customer.totalSpent)}</span>
                            </div>
                          </div>

                          {/* Footer with orders count and action buttons */}
                          <div className="flex items-center justify-between pt-4 border-t border-[#C69A72]/20">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-[#13312A]">{customer.orders.length}</p>
                              <p className="text-xs text-[#155446] arabic-text">طلب</p>
                            </div>

                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onCustomerSelect(customer)}
                                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] hover:text-white rounded-lg"
                                aria-label={`عرض تفاصيل ${customer.name}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline" className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] hover:text-white rounded-lg" aria-label={`مزید إجراءات لـ ${customer.name}`} title={`مزید إجراءات لـ ${customer.name}`}>
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white border-[#C69A72] rounded-xl shadow-lg">
                                  <DropdownMenuItem onClick={() => onCustomerSelect(customer)} className="arabic-text">
                                    <Eye className="w-4 h-4 ml-2" />
                                    عرض التفاصيل
                                  </DropdownMenuItem>
                                  {hasActionPermission('edit_customer') && (
                                    <DropdownMenuItem className="arabic-text">
                                      <Edit className="w-4 h-4 ml-2" />
                                      تعديل
                                    </DropdownMenuItem>
                                  )}
                                  {hasActionPermission('create_invoice') && (
                                    <DropdownMenuItem className="arabic-text">
                                      <Plus className="w-4 h-4 ml-2" />
                                      طلب جديد
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Inline New Customer Dialog to avoid remounts on each keypress */}
      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent className="max-w-2xl bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text">إضافة زبون جديد</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text">
              أدخل بيانات الزبون الجديد
            </DialogDescription>
          </DialogHeader>
          
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleCreateCustomer(); }}>
            <Card className="bg-white border-[#C69A72]">
              <CardHeader>
                <CardTitle className="text-[#13312A] arabic-text text-lg">البيانات الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-[#13312A] arabic-text">الاسم الكامل</Label>
                  <Input 
                    placeholder="أدخل الاسم الكامل" 
                    className="bg-white border-[#C69A72] text-right"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#13312A] arabic-text">رقم الهاتف</Label>
                    <Input 
                      placeholder="077xxxxxxxx" 
                      className="bg-white border-[#C69A72] text-right"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-[#13312A] arabic-text">تصنيف الزبون</Label>
                    <Select 
                      value={newCustomer.label}
                      onValueChange={(value: string) => setNewCustomer({...newCustomer, label: value})}
                    >
                      <SelectTrigger className="bg-white border-[#C69A72]" aria-label="تصنيف الزبون" title="تصنيف الزبون">
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="جديد">جديد</SelectItem>
                        <SelectItem value="منتظم">منتظم</SelectItem>
                        <SelectItem value="وفي">وفي</SelectItem>
                        <SelectItem value="ذهبي">ذهبي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">العنوان</Label>
                  <Input 
                    placeholder="أدخل العنوان الكامل" 
                    className="bg-white border-[#C69A72] text-right"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-end">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setIsNewCustomerOpen(false)} 
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
                disabled={isCreating}
              >
                إلغاء
              </Button>
              <Button 
                type="submit"
                className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]"
                disabled={isCreating}
              >
                {isCreating ? 'جاري الحفظ...' : 'حفظ الزبون'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inline Edit Customer Dialog to avoid remounts on each keypress */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setEditDraft(null); }}>
        <DialogContent className="max-w-2xl bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text">تعديل بيانات الزبون</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text">
              عدّل الحقول المطلوبة ثم احفظ التغييرات
            </DialogDescription>
          </DialogHeader>
          {editDraft && (
            <form
              className="space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setIsSavingEdit(true);
                  await databaseService.updateCustomer(String(editDraft.id), {
                    name: editDraft.name,
                    phone: editDraft.phone,
                    address: editDraft.address,
                    measurements: editDraft.measurements,
                  });
                  setIsEditOpen(false);
                } catch (err) {
                  console.error('Error updating customer:', err);
                } finally {
                  setIsSavingEdit(false);
                }
              }}
            >
              <Card className="bg-white border-[#C69A72]">
                <CardHeader>
                  <CardTitle className="text-[#13312A] arabic-text text-lg">البيانات الأساسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-[#13312A] arabic-text">الاسم الكامل</Label>
                    <Input
                      className="bg-white border-[#C69A72] text-right"
                      value={editDraft.name}
                      onChange={(e) => setEditDraft({ ...(editDraft as Customer), name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[#13312A] arabic-text">رقم الهاتف</Label>
                      <Input
                        className="bg-white border-[#C69A72] text-right"
                        value={editDraft.phone}
                        onChange={(e) => setEditDraft({ ...(editDraft as Customer), phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-[#13312A] arabic-text">العنوان</Label>
                      <Input
                        className="bg-white border-[#C69A72] text-right"
                        value={editDraft.address}
                        onChange={(e) => setEditDraft({ ...(editDraft as Customer), address: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-[#C69A72]">
                <CardHeader>
                  <CardTitle className="text-[#13312A] arabic-text text-lg">القياسات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* الصف الأول: الطول، الكتف، الردن - 3 أعمدة */}
                  <div className="grid grid-cols-3 gap-4 min-w-0">
                    <div className="min-w-[120px]">
                      <Label className="text-[#13312A] arabic-text">الطول (سم)</Label>
                      <Input
                        type="number"
                        className="bg-white border-[#C69A72] text-right min-w-0"
                        value={editDraft.measurements?.height ?? 0}
                        onChange={(e) => setEditDraft({
                          ...(editDraft as Customer),
                          measurements: { ...(editDraft.measurements || {}), height: Number(e.target.value) }
                        })}
                      />
                    </div>
                    <div className="min-w-[120px]">
                      <Label className="text-[#13312A] arabic-text">الكتف (سم)</Label>
                      <Input
                        type="number"
                        className="bg-white border-[#C69A72] text-right min-w-0"
                        value={editDraft.measurements?.shoulder ?? 0}
                        onChange={(e) => setEditDraft({
                          ...(editDraft as Customer),
                          measurements: { ...(editDraft.measurements || {}), shoulder: Number(e.target.value) }
                        })}
                      />
                    </div>
                    <div className="min-w-[120px]">
                      <Label className="text-[#13312A] arabic-text">الردن (سم)</Label>
                      <Input
                        type="number"
                        className="bg-white border-[#C69A72] text-right min-w-0"
                        value={editDraft.measurements?.waist ?? 0}
                        onChange={(e) => setEditDraft({
                          ...(editDraft as Customer),
                          measurements: { ...(editDraft.measurements || {}), waist: Number(e.target.value) }
                        })}
                      />
                    </div>
                  </div>
                  {/* الصف الثاني: الصدر، الياقة - 2 أعمدة */}
                  <div className="grid grid-cols-2 gap-4 min-w-0">
                    <div className="min-w-[120px]">
                      <Label className="text-[#13312A] arabic-text">الصدر (سم)</Label>
                      <Input
                        type="number"
                        className="bg-white border-[#C69A72] text-right min-w-0"
                        value={editDraft.measurements?.chest ?? 0}
                        onChange={(e) => setEditDraft({
                          ...(editDraft as Customer),
                          measurements: { ...(editDraft.measurements || {}), chest: Number(e.target.value) }
                        })}
                      />
                    </div>
                    <div className="min-w-[120px]">
                      <Label className="text-[#13312A] arabic-text">الياقة (سم)</Label>
                      <Input
                        type="number"
                        className="bg-white border-[#C69A72] text-right min-w-0"
                        value={editDraft.measurements?.collar ?? 0}
                        onChange={(e) => setEditDraft({
                          ...(editDraft as Customer),
                          measurements: { ...(editDraft.measurements || {}), collar: Number(e.target.value) }
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
                  disabled={isSavingEdit}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}