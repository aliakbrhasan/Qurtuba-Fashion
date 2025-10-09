import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Upload, Calendar as CalendarIcon, Check, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList, CommandSeparator } from './ui/command';
import { cn } from './ui/utils';
import { InvoiceService, InvoiceFormData } from '@/services/invoice.service';
import { useInvoices } from '@/hooks/useInvoices';
import { ImageUploadWithCrop } from './ui/ImageUploadWithCrop';
import { ImageService } from '@/services/image.service';

interface NewInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FabricOption {
  id: string;
  label: string;
}

export function NewInvoiceDialog({ isOpen, onOpenChange }: NewInvoiceDialogProps) {
  const { createInvoice } = useInvoices();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    total: '',
    paidAmount: '',
    notes: '',
    measurements: {
      height: '',
      shoulder: '',
      waist: '',
      chest: ''
    }
  });

  // Image state
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [fabricOptions, setFabricOptions] = useState<FabricOption[]>([
    { id: 'cotton', label: 'قطن' },
    { id: 'silk', label: 'حرير' },
    { id: 'wool', label: 'صوف' },
    { id: 'linen', label: 'كتان' },
  ]);
  const [selectedFabricOptions, setSelectedFabricOptions] = useState<string[]>([]);
  const [selectedFabricSources, setSelectedFabricSources] = useState<string[]>([]);
  const fabricSourceOptions: { id: string; label: string }[] = [
    { id: 'outside', label: 'خارج المحل' },
    { id: 'inside', label: 'داخل المحل' },
  ];
  const [isFabricPopoverOpen, setIsFabricPopoverOpen] = useState(false);
  const [isSourcePopoverOpen, setIsSourcePopoverOpen] = useState(false);
  const [isFabricManagerOpen, setIsFabricManagerOpen] = useState(false);
  const [fabricOptionsDraft, setFabricOptionsDraft] = useState<FabricOption[]>([]);
  const [fabricManagerError, setFabricManagerError] = useState('');
  const [isQuickAddDialogOpen, setIsQuickAddDialogOpen] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState('');
  const [quickAddError, setQuickAddError] = useState('');

  // Collar (نوع الياقة)
  const [collarOptions, setCollarOptions] = useState<FabricOption[]>([
    { id: 'regular', label: 'عادية' },
    { id: 'mandarin', label: 'صينية' },
    { id: 'formal', label: 'رسمية' },
  ]);
  const [selectedCollarOptions, setSelectedCollarOptions] = useState<string[]>([]);
  const [isCollarPopoverOpen, setIsCollarPopoverOpen] = useState(false);
  const [isCollarManagerOpen, setIsCollarManagerOpen] = useState(false);
  const [collarOptionsDraft, setCollarOptionsDraft] = useState<FabricOption[]>([]);
  const [collarManagerError, setCollarManagerError] = useState('');
  const [isCollarQuickAddOpen, setIsCollarQuickAddOpen] = useState(false);
  const [collarQuickAddValue, setCollarQuickAddValue] = useState('');
  const [collarQuickAddError, setCollarQuickAddError] = useState('');

  // Chest style (أسلوب الصدر)
  const [chestStyleOptions, setChestStyleOptions] = useState<FabricOption[]>([
    { id: 'single', label: 'صدر واحد' },
    { id: 'double', label: 'صدر مزدوج' },
  ]);
  const [selectedChestStyleOptions, setSelectedChestStyleOptions] = useState<string[]>([]);
  const [isChestStylePopoverOpen, setIsChestStylePopoverOpen] = useState(false);
  const [isChestStyleManagerOpen, setIsChestStyleManagerOpen] = useState(false);
  const [chestStyleOptionsDraft, setChestStyleOptionsDraft] = useState<FabricOption[]>([]);
  const [chestStyleManagerError, setChestStyleManagerError] = useState('');
  const [isChestStyleQuickAddOpen, setIsChestStyleQuickAddOpen] = useState(false);
  const [chestStyleQuickAddValue, setChestStyleQuickAddValue] = useState('');
  const [chestStyleQuickAddError, setChestStyleQuickAddError] = useState('');

  // Sleeve end (نهاية الكم)
  const [sleeveEndOptions, setSleeveEndOptions] = useState<FabricOption[]>([
    { id: 'cuff', label: 'كم بحاشية' },
    { id: 'plain', label: 'كم عادي' },
  ]);
  const [selectedSleeveEndOptions, setSelectedSleeveEndOptions] = useState<string[]>([]);
  const [isSleeveEndPopoverOpen, setIsSleeveEndPopoverOpen] = useState(false);
  const [isSleeveEndManagerOpen, setIsSleeveEndManagerOpen] = useState(false);
  const [sleeveEndOptionsDraft, setSleeveEndOptionsDraft] = useState<FabricOption[]>([]);
  const [sleeveEndManagerError, setSleeveEndManagerError] = useState('');
  const [isSleeveEndQuickAddOpen, setIsSleeveEndQuickAddOpen] = useState(false);
  const [sleeveEndQuickAddValue, setSleeveEndQuickAddValue] = useState('');
  const [sleeveEndQuickAddError, setSleeveEndQuickAddError] = useState('');

  // Bunija (نوع البنيجة)
  const [bunijaOptions] = useState<FabricOption[]>([
    { id: 'single', label: 'بنايج' },
    { id: 'half', label: 'نصف بنيجة' },
    { id: 'double', label: 'بنيجتين' },
  ]);
  const [selectedBunijaOptions, setSelectedBunijaOptions] = useState<string[]>([]);
  const [isBunijaPopoverOpen, setIsBunijaPopoverOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDeliveryDate('');
      setSelectedFabricOptions([]);
      setSelectedFabricSources([]);
      setIsFabricPopoverOpen(false);
      setIsSourcePopoverOpen(false);
      setIsFabricManagerOpen(false);
      setIsQuickAddDialogOpen(false);
      // reset design fields
      setSelectedCollarOptions([]);
      setSelectedChestStyleOptions([]);
      setSelectedSleeveEndOptions([]);
      setSelectedBunijaOptions([]);
      setIsCollarPopoverOpen(false);
      setIsChestStylePopoverOpen(false);
      setIsSleeveEndPopoverOpen(false);
      setIsBunijaPopoverOpen(false);
      setIsCollarManagerOpen(false);
      setIsChestStyleManagerOpen(false);
      setIsSleeveEndManagerOpen(false);
      setIsCollarQuickAddOpen(false);
      setIsChestStyleQuickAddOpen(false);
      setIsSleeveEndQuickAddOpen(false);
      // Reset form data
      setFormData({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        total: '',
        paidAmount: '',
        notes: '',
        measurements: {
          height: '',
          shoulder: '',
          waist: '',
          chest: ''
        }
      });
      setSubmitError(null);
      // Reset image state
      setSelectedImage('');
      setImageFile(null);
    }
  }, [isOpen]);

  // Image handling functions
  const handleImageSelect = (file: File, imageUrl: string) => {
    setImageFile(file);
    setSelectedImage(imageUrl);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setSelectedImage('');
  };

  const uploadImageToStorage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      setIsUploadingImage(true);
      
      // Compress image if needed
      let fileToUpload = imageFile;
      if (ImageService.needsCompression(imageFile)) {
        fileToUpload = await ImageService.compressImage(imageFile, 0.85, 1200);
      }

      // Upload to storage
      const result = await ImageService.uploadImage(fileToUpload, 'fabric-images');
      return result.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      setSubmitError('فشل في رفع الصورة. يرجى المحاولة مرة أخرى.');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName.trim() || !formData.customerPhone.trim() || !formData.total) {
      setSubmitError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Upload image if selected
      let imageUrl = '';
      if (imageFile) {
        const uploadedImageUrl = await uploadImageToStorage();
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        } else {
          return; // Stop if image upload failed
        }
      }

      const invoiceData: InvoiceFormData = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerAddress: formData.customerAddress.trim(),
        total: parseFloat(formData.total),
        paidAmount: parseFloat(formData.paidAmount) || 0,
        status: parseFloat(formData.paidAmount) >= parseFloat(formData.total) ? 'مدفوع' : 'معلق',
        deliveryDate: deliveryDate || new Date().toISOString().split('T')[0],
        notes: formData.notes.trim(),
        items: [{
          itemName: 'خدمة خياطة',
          description: 'خدمة خياطة مخصصة',
          quantity: 1,
          unitPrice: parseFloat(formData.total),
          totalPrice: parseFloat(formData.total)
        }],
        measurements: {
          length: parseFloat(formData.measurements.height) || 0,
          shoulder: parseFloat(formData.measurements.shoulder) || 0,
          waist: parseFloat(formData.measurements.waist) || 0,
          chest: parseFloat(formData.measurements.chest) || 0
        },
        designDetails: {
          fabricType: fabricOptions.filter(opt => selectedFabricOptions.includes(opt.id)).map(opt => opt.label),
          fabricSource: fabricSourceOptions.filter(opt => selectedFabricSources.includes(opt.id)).map(opt => opt.label),
          collarType: collarOptions.filter(opt => selectedCollarOptions.includes(opt.id)).map(opt => opt.label),
          chestStyle: chestStyleOptions.filter(opt => selectedChestStyleOptions.includes(opt.id)).map(opt => opt.label),
          sleeveEnd: sleeveEndOptions.filter(opt => selectedSleeveEndOptions.includes(opt.id)).map(opt => opt.label)
        },
        fabricImageUrl: imageUrl
      };

      await createInvoice(invoiceData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating invoice:', error);
      setSubmitError('حدث خطأ في إنشاء الفاتورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFabricLabels = fabricOptions
    .filter((option) => selectedFabricOptions.includes(option.id))
    .map((option) => option.label);

  const toggleFabricOption = (optionId: string) => {
    setSelectedFabricOptions((previous) =>
      previous.includes(optionId)
        ? previous.filter((item) => item !== optionId)
        : [...previous, optionId],
    );
  };

  const toggleFabricSource = (sourceId: string) => {
    setSelectedFabricSources((previous) =>
      previous.includes(sourceId)
        ? previous.filter((item) => item !== sourceId)
        : [...previous, sourceId],
    );
  };

  // Collars helpers
  const toggleCollarOption = (optionId: string) => {
    setSelectedCollarOptions((previous) =>
      previous.includes(optionId)
        ? previous.filter((item) => item !== optionId)
        : [...previous, optionId],
    );
  };

  const openCollarManager = (open: boolean) => {
    setIsCollarManagerOpen(open);
    if (open) {
      setCollarOptionsDraft(collarOptions.map((o) => ({ ...o })));
      setCollarManagerError('');
    }
  };

  const submitCollarOptions: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const cleaned = collarOptionsDraft.map((o) => ({ ...o, label: o.label.trim() })).filter((o) => o.label !== '');
    const labels = cleaned.map((o) => o.label);
    if (new Set(labels).size !== labels.length) {
      setCollarManagerError('الرجاء عدم تكرار أسماء الأنواع.');
      return;
    }
    setCollarOptions(cleaned);
    setSelectedCollarOptions((prev) => prev.filter((id) => cleaned.some((o) => o.id === id)));
    setIsCollarManagerOpen(false);
  };

  const collarDraftLabelChange = (id: string, label: string) => {
    setCollarOptionsDraft((prev) => prev.map((o) => (o.id === id ? { ...o, label } : o)));
  };
  const collarDraftDelete = (id: string) => {
    setCollarOptionsDraft((prev) => prev.filter((o) => o.id !== id));
  };
  const collarDraftAdd = () => {
    const id = `collar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setCollarOptionsDraft((prev) => [...prev, { id, label: 'خيار جديد' }]);
  };
  const openCollarQuickAdd = (open: boolean) => {
    setIsCollarQuickAddOpen(open);
    if (!open) {
      setCollarQuickAddValue('');
      setCollarQuickAddError('');
    }
  };
  const submitCollarQuickAdd: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const value = collarQuickAddValue.trim();
    if (!value) {
      setCollarQuickAddError('الرجاء إدخال اسم الخيار.');
      return;
    }
    if (collarOptions.some((o) => o.label === value)) {
      setCollarQuickAddError('هذا الخيار موجود بالفعل.');
      return;
    }
    const option = { id: `collar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label: value };
    setCollarOptions((prev) => [...prev, option]);
    setSelectedCollarOptions((prev) => [...prev, option.id]);
    openCollarQuickAdd(false);
  };

  // Chest style helpers
  const toggleChestStyleOption = (optionId: string) => {
    setSelectedChestStyleOptions((previous) =>
      previous.includes(optionId)
        ? previous.filter((item) => item !== optionId)
        : [...previous, optionId],
    );
  };
  const openChestStyleManager = (open: boolean) => {
    setIsChestStyleManagerOpen(open);
    if (open) {
      setChestStyleOptionsDraft(chestStyleOptions.map((o) => ({ ...o })));
      setChestStyleManagerError('');
    }
  };
  const submitChestStyleOptions: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const cleaned = chestStyleOptionsDraft.map((o) => ({ ...o, label: o.label.trim() })).filter((o) => o.label !== '');
    const labels = cleaned.map((o) => o.label);
    if (new Set(labels).size !== labels.length) {
      setChestStyleManagerError('الرجاء عدم تكرار أسماء الأنواع.');
      return;
    }
    setChestStyleOptions(cleaned);
    setSelectedChestStyleOptions((prev) => prev.filter((id) => cleaned.some((o) => o.id === id)));
    setIsChestStyleManagerOpen(false);
  };
  const chestStyleDraftLabelChange = (id: string, label: string) => {
    setChestStyleOptionsDraft((prev) => prev.map((o) => (o.id === id ? { ...o, label } : o)));
  };
  const chestStyleDraftDelete = (id: string) => {
    setChestStyleOptionsDraft((prev) => prev.filter((o) => o.id !== id));
  };
  const chestStyleDraftAdd = () => {
    const id = `chest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setChestStyleOptionsDraft((prev) => [...prev, { id, label: 'خيار جديد' }]);
  };
  const openChestStyleQuickAdd = (open: boolean) => {
    setIsChestStyleQuickAddOpen(open);
    if (!open) {
      setChestStyleQuickAddValue('');
      setChestStyleQuickAddError('');
    }
  };
  const submitChestStyleQuickAdd: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const value = chestStyleQuickAddValue.trim();
    if (!value) {
      setChestStyleQuickAddError('الرجاء إدخال اسم الخيار.');
      return;
    }
    if (chestStyleOptions.some((o) => o.label === value)) {
      setChestStyleQuickAddError('هذا الخيار موجود بالفعل.');
      return;
    }
    const option = { id: `chest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label: value };
    setChestStyleOptions((prev) => [...prev, option]);
    setSelectedChestStyleOptions((prev) => [...prev, option.id]);
    openChestStyleQuickAdd(false);
  };

  // Sleeve end helpers
  const toggleSleeveEndOption = (optionId: string) => {
    setSelectedSleeveEndOptions((previous) =>
      previous.includes(optionId)
        ? previous.filter((item) => item !== optionId)
        : [...previous, optionId],
    );
  };

  const toggleBunijaOption = (optionId: string) => {
    setSelectedBunijaOptions((previous) =>
      previous.includes(optionId)
        ? previous.filter((item) => item !== optionId)
        : [...previous, optionId],
    );
  };
  const openSleeveEndManager = (open: boolean) => {
    setIsSleeveEndManagerOpen(open);
    if (open) {
      setSleeveEndOptionsDraft(sleeveEndOptions.map((o) => ({ ...o })));
      setSleeveEndManagerError('');
    }
  };
  const submitSleeveEndOptions: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const cleaned = sleeveEndOptionsDraft.map((o) => ({ ...o, label: o.label.trim() })).filter((o) => o.label !== '');
    const labels = cleaned.map((o) => o.label);
    if (new Set(labels).size !== labels.length) {
      setSleeveEndManagerError('الرجاء عدم تكرار أسماء الأنواع.');
      return;
    }
    setSleeveEndOptions(cleaned);
    setSelectedSleeveEndOptions((prev) => prev.filter((id) => cleaned.some((o) => o.id === id)));
    setIsSleeveEndManagerOpen(false);
  };
  const sleeveEndDraftLabelChange = (id: string, label: string) => {
    setSleeveEndOptionsDraft((prev) => prev.map((o) => (o.id === id ? { ...o, label } : o)));
  };
  const sleeveEndDraftDelete = (id: string) => {
    setSleeveEndOptionsDraft((prev) => prev.filter((o) => o.id !== id));
  };
  const sleeveEndDraftAdd = () => {
    const id = `sleeve-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setSleeveEndOptionsDraft((prev) => [...prev, { id, label: 'خيار جديد' }]);
  };
  const openSleeveEndQuickAdd = (open: boolean) => {
    setIsSleeveEndQuickAddOpen(open);
    if (!open) {
      setSleeveEndQuickAddValue('');
      setSleeveEndQuickAddError('');
    }
  };
  const submitSleeveEndQuickAdd: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const value = sleeveEndQuickAddValue.trim();
    if (!value) {
      setSleeveEndQuickAddError('الرجاء إدخال اسم الخيار.');
      return;
    }
    if (sleeveEndOptions.some((o) => o.label === value)) {
      setSleeveEndQuickAddError('هذا الخيار موجود بالفعل.');
      return;
    }
    const option = { id: `sleeve-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label: value };
    setSleeveEndOptions((prev) => [...prev, option]);
    setSelectedSleeveEndOptions((prev) => [...prev, option.id]);
    openSleeveEndQuickAdd(false);
  };

  const handleFabricManagerOpenChange = (open: boolean) => {
    setIsFabricManagerOpen(open);
    if (open) {
      setFabricOptionsDraft(fabricOptions.map((option) => ({ ...option })));
      setFabricManagerError('');
    }
  };

  const handleFabricOptionsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanedOptions = fabricOptionsDraft
      .map((option) => ({ ...option, label: option.label.trim() }))
      .filter((option) => option.label !== '');

    const labels = cleanedOptions.map((option) => option.label);
    const hasDuplicateLabels = new Set(labels).size !== labels.length;

    if (hasDuplicateLabels) {
      setFabricManagerError('الرجاء عدم تكرار أسماء الأنواع.');
      return;
    }

    setFabricOptions(cleanedOptions);
    setSelectedFabricOptions((previous) =>
      previous.filter((optionId) => cleanedOptions.some((option) => option.id === optionId)),
    );
    setIsFabricManagerOpen(false);
  };

  const handleDraftLabelChange = (optionId: string, newLabel: string) => {
    setFabricOptionsDraft((previous) =>
      previous.map((option) => (option.id === optionId ? { ...option, label: newLabel } : option)),
    );
  };

  const handleDraftDelete = (optionId: string) => {
    setFabricOptionsDraft((previous) => previous.filter((option) => option.id !== optionId));
  };

  const handleDraftAdd = () => {
    const uniqueId = `fabric-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setFabricOptionsDraft((previous) => [...previous, { id: uniqueId, label: 'نوع جديد' }]);
  };

  const handleQuickAddDialogOpenChange = (open: boolean) => {
    setIsQuickAddDialogOpen(open);
    if (!open) {
      setQuickAddValue('');
      setQuickAddError('');
    }
  };

  const handleQuickAddSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedValue = quickAddValue.trim();

    if (!trimmedValue) {
      setQuickAddError('الرجاء إدخال اسم النوع.');
      return;
    }

    if (fabricOptions.some((option) => option.label === trimmedValue)) {
      setQuickAddError('هذا النوع موجود بالفعل.');
      return;
    }

    const newOption: FabricOption = {
      id: `fabric-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: trimmedValue,
    };

    setFabricOptions((previous) => [...previous, newOption]);
    setSelectedFabricOptions((previous) => [...previous, newOption.id]);
    handleQuickAddDialogOpenChange(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text">إنشاء فاتورة جديدة</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text">
              أدخل بيانات الزبون والطلب لإصدار الفاتورة
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-white border-[#C69A72]">
              <CardHeader>
                <CardTitle className="text-[#13312A] arabic-text text-lg">بيانات الزبون</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#13312A] arabic-text">اسم الزبون</Label>
                  <Input 
                    placeholder="أدخل اسم الزبون" 
                    className="bg-white border-[#C69A72] text-right"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">رقم الهاتف</Label>
                  <Input 
                    placeholder="077xxxxxxxx" 
                    className="bg-white border-[#C69A72] text-right"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#13312A] arabic-text">العنوان</Label>
                  <Input 
                    placeholder="أدخل العنوان" 
                    className="bg-white border-[#C69A72] text-right"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#C69A72]">
              <CardHeader>
                <CardTitle className="text-[#13312A] arabic-text text-lg">القياسات</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-[#13312A] arabic-text">الطول</Label>
                  <Input 
                    placeholder="سم" 
                    className="bg-white border-[#C69A72] text-right"
                    value={formData.measurements.height}
                    onChange={(e) => setFormData({...formData, measurements: {...formData.measurements, height: e.target.value}})}
                  />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">الكتف</Label>
                  <Input 
                    placeholder="سم" 
                    className="bg-white border-[#C69A72] text-right"
                    value={formData.measurements.shoulder}
                    onChange={(e) => setFormData({...formData, measurements: {...formData.measurements, shoulder: e.target.value}})}
                  />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">الخصر</Label>
                  <Input 
                    placeholder="سم" 
                    className="bg-white border-[#C69A72] text-right"
                    value={formData.measurements.waist}
                    onChange={(e) => setFormData({...formData, measurements: {...formData.measurements, waist: e.target.value}})}
                  />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">الصدر</Label>
                  <Input 
                    placeholder="سم" 
                    className="bg-white border-[#C69A72] text-right"
                    value={formData.measurements.chest}
                    onChange={(e) => setFormData({...formData, measurements: {...formData.measurements, chest: e.target.value}})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#C69A72]">
              <CardHeader>
                <CardTitle className="text-[#13312A] arabic-text text-lg">تفاصيل التصميم</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#13312A] arabic-text">نوع القماش</Label>
                  <Popover open={isFabricPopoverOpen} onOpenChange={setIsFabricPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-between bg-white border-[#C69A72] text-[#155446] arabic-text',
                          selectedFabricLabels.length === 0 && 'text-muted-foreground',
                        )}
                      >
                        <span className="flex-1 text-right truncate">
                          {selectedFabricLabels.length > 0
                            ? selectedFabricLabels.join('، ')
                            : 'اختر نوع القماش'}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0 bg-[#F6E9CA] border-[#C69A72]">
                      <Command className="arabic-text text-right">
                        <CommandInput placeholder="ابحث عن نوع القماش..." className="text-right" />
                        <CommandList className="text-right">
                          <CommandEmpty>لا توجد أنواع مطابقة</CommandEmpty>
                          <CommandItem
                            value="add-new"
                            onSelect={() => {
                              setIsFabricPopoverOpen(false);
                              handleQuickAddDialogOpenChange(true);
                            }}
                            className="flex flex-row-reverse items-center justify-end gap-2 text-[#155446]"
                          >
                            <Plus className="h-4 w-4" />
                            <span>إضافة نوع جديد</span>
                          </CommandItem>
                          <CommandSeparator className="bg-[#C69A72]/50" />
                          {fabricOptions.map((option) => {
                            const isSelected = selectedFabricOptions.includes(option.id);
                            return (
                              <CommandItem
                                key={option.id}
                                value={option.label}
                                onSelect={() => toggleFabricOption(option.id)}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="flex-1 text-right">{option.label}</span>
                                <Check
                                  className={cn(
                                    'h-4 w-4 text-[#155446] transition-opacity',
                                    isSelected ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                              </CommandItem>
                            );
                          })}
                        </CommandList>
                        <div className="border-t border-[#C69A72]/50 px-2 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setIsFabricPopoverOpen(false);
                              handleFabricManagerOpenChange(true);
                            }}
                            className="w-full flex-row-reverse justify-center text-[#155446]"
                          >
                            <Pencil className="h-4 w-4" />
                            تعديل الأنواع
                          </Button>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">مصدر القماش</Label>
                  <Popover open={isSourcePopoverOpen} onOpenChange={setIsSourcePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-between bg-white border-[#C69A72] text-[#155446] arabic-text',
                          selectedFabricSources.length === 0 && 'text-muted-foreground',
                        )}
                     >
                        <span className="flex-1 text-right truncate">
                          {selectedFabricSources.length > 0
                            ? fabricSourceOptions
                                .filter((o) => selectedFabricSources.includes(o.id))
                                .map((o) => o.label)
                                .join('، ')
                            : 'اختر مصدر القماش'}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0 bg-[#F6E9CA] border-[#C69A72]">
                      <Command className="arabic-text text-right">
                        <CommandList className="text-right">
                          {fabricSourceOptions.map((option) => {
                            const isSelected = selectedFabricSources.includes(option.id);
                            return (
                              <CommandItem
                                key={option.id}
                                value={option.label}
                                onSelect={() => toggleFabricSource(option.id)}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="flex-1 text-right">{option.label}</span>
                                <Check
                                  className={cn(
                                    'h-4 w-4 text-[#155446] transition-opacity',
                                    isSelected ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                              </CommandItem>
                            );
                          })}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">نوع الياقة</Label>
                  <Popover open={isCollarPopoverOpen} onOpenChange={setIsCollarPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-between bg-white border-[#C69A72] text-[#155446] arabic-text',
                          selectedCollarOptions.length === 0 && 'text-muted-foreground',
                        )}
                      >
                        <span className="flex-1 text-right truncate">
                          {selectedCollarOptions.length > 0
                            ? collarOptions
                                .filter((o) => selectedCollarOptions.includes(o.id))
                                .map((o) => o.label)
                                .join('، ')
                            : 'اختر نوع الياقة'}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0 bg-[#F6E9CA] border-[#C69A72]">
                      <Command className="arabic-text text-right">
                        <CommandList className="text-right">
                          <CommandItem
                            value="add-new"
                            onSelect={() => {
                              setIsCollarPopoverOpen(false);
                              openCollarQuickAdd(true);
                            }}
                            className="flex flex-row-reverse items-center justify-end gap-2 text-[#155446]"
                          >
                            <Plus className="h-4 w-4" />
                            <span>إضافة خيار جديد</span>
                          </CommandItem>
                          <CommandSeparator className="bg-[#C69A72]/50" />
                          {collarOptions.map((option) => {
                            const isSelected = selectedCollarOptions.includes(option.id);
                            return (
                              <CommandItem
                                key={option.id}
                                value={option.label}
                                onSelect={() => toggleCollarOption(option.id)}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="flex-1 text-right">{option.label}</span>
                                <Check className={cn('h-4 w-4 text-[#155446] transition-opacity', isSelected ? 'opacity-100' : 'opacity-0')} />
                              </CommandItem>
                            );
                          })}
                        </CommandList>
                        <div className="border-t border-[#C69A72]/50 px-2 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setIsCollarPopoverOpen(false);
                              openCollarManager(true);
                            }}
                            className="w-full flex-row-reverse justify-center text-[#155446]"
                          >
                            <Pencil className="h-4 w-4" />
                            تعديل الخيارات
                          </Button>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">أسلوب الصدر</Label>
                  <Popover open={isChestStylePopoverOpen} onOpenChange={setIsChestStylePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-between bg-white border-[#C69A72] text-[#155446] arabic-text',
                          selectedChestStyleOptions.length === 0 && 'text-muted-foreground',
                        )}
                      >
                        <span className="flex-1 text-right truncate">
                          {selectedChestStyleOptions.length > 0
                            ? chestStyleOptions
                                .filter((o) => selectedChestStyleOptions.includes(o.id))
                                .map((o) => o.label)
                                .join('، ')
                            : 'اختر أسلوب الصدر'}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0 bg-[#F6E9CA] border-[#C69A72]">
                      <Command className="arabic-text text-right">
                        <CommandList className="text-right">
                          <CommandItem
                            value="add-new"
                            onSelect={() => {
                              setIsChestStylePopoverOpen(false);
                              openChestStyleQuickAdd(true);
                            }}
                            className="flex flex-row-reverse items-center justify-end gap-2 text-[#155446]"
                          >
                            <Plus className="h-4 w-4" />
                            <span>إضافة خيار جديد</span>
                          </CommandItem>
                          <CommandSeparator className="bg-[#C69A72]/50" />
                          {chestStyleOptions.map((option) => {
                            const isSelected = selectedChestStyleOptions.includes(option.id);
                            return (
                              <CommandItem
                                key={option.id}
                                value={option.label}
                                onSelect={() => toggleChestStyleOption(option.id)}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="flex-1 text-right">{option.label}</span>
                                <Check className={cn('h-4 w-4 text-[#155446] transition-opacity', isSelected ? 'opacity-100' : 'opacity-0')} />
                              </CommandItem>
                            );
                          })}
                        </CommandList>
                        <div className="border-t border-[#C69A72]/50 px-2 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setIsChestStylePopoverOpen(false);
                              openChestStyleManager(true);
                            }}
                            className="w-full flex-row-reverse justify-center text-[#155446]"
                          >
                            <Pencil className="h-4 w-4" />
                            تعديل الخيارات
                          </Button>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">نهاية الكم</Label>
                  <Popover open={isSleeveEndPopoverOpen} onOpenChange={setIsSleeveEndPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-between bg-white border-[#C69A72] text-[#155446] arabic-text',
                          selectedSleeveEndOptions.length === 0 && 'text-muted-foreground',
                        )}
                      >
                        <span className="flex-1 text-right truncate">
                          {selectedSleeveEndOptions.length > 0
                            ? sleeveEndOptions
                                .filter((o) => selectedSleeveEndOptions.includes(o.id))
                                .map((o) => o.label)
                                .join('، ')
                            : 'اختر نهاية الكم'}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0 bg-[#F6E9CA] border-[#C69A72]">
                      <Command className="arabic-text text-right">
                        <CommandList className="text-right">
                          <CommandItem
                            value="add-new"
                            onSelect={() => {
                              setIsSleeveEndPopoverOpen(false);
                              openSleeveEndQuickAdd(true);
                            }}
                            className="flex flex-row-reverse items-center justify-end gap-2 text-[#155446]"
                          >
                            <Plus className="h-4 w-4" />
                            <span>إضافة خيار جديد</span>
                          </CommandItem>
                          <CommandSeparator className="bg-[#C69A72]/50" />
                          {sleeveEndOptions.map((option) => {
                            const isSelected = selectedSleeveEndOptions.includes(option.id);
                            return (
                              <CommandItem
                                key={option.id}
                                value={option.label}
                                onSelect={() => toggleSleeveEndOption(option.id)}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="flex-1 text-right">{option.label}</span>
                                <Check className={cn('h-4 w-4 text-[#155446] transition-opacity', isSelected ? 'opacity-100' : 'opacity-0')} />
                              </CommandItem>
                            );
                          })}
                        </CommandList>
                        <div className="border-t border-[#C69A72]/50 px-2 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setIsSleeveEndPopoverOpen(false);
                              openSleeveEndManager(true);
                            }}
                            className="w-full flex-row-reverse justify-center text-[#155446]"
                          >
                            <Pencil className="h-4 w-4" />
                            تعديل الخيارات
                          </Button>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">نوع البنيجة</Label>
                  <Popover open={isBunijaPopoverOpen} onOpenChange={setIsBunijaPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-between bg-white border-[#C69A72] text-[#155446] arabic-text',
                          selectedBunijaOptions.length === 0 && 'text-muted-foreground',
                        )}
                      >
                        <span className="flex-1 text-right truncate">
                          {selectedBunijaOptions.length > 0
                            ? bunijaOptions
                                .filter((o) => selectedBunijaOptions.includes(o.id))
                                .map((o) => o.label)
                                .join('، ')
                            : 'اختر نوع البنيجة'}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0 bg-[#F6E9CA] border-[#C69A72]">
                      <Command className="arabic-text text-right">
                        <CommandList className="text-right">
                          {bunijaOptions.map((option) => {
                            const isSelected = selectedBunijaOptions.includes(option.id);
                            return (
                              <CommandItem
                                key={option.id}
                                value={option.label}
                                onSelect={() => toggleBunijaOption(option.id)}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="flex-1 text-right">{option.label}</span>
                                <Check className={cn('h-4 w-4 text-[#155446] transition-opacity', isSelected ? 'opacity-100' : 'opacity-0')} />
                              </CommandItem>
                            );
                          })}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#C69A72]">
              <CardHeader>
                <CardTitle className="text-[#13312A] arabic-text text-lg">المبالغ والتواريخ</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-[#13312A] arabic-text">المبلغ الكلي</Label>
                  <Input 
                    placeholder="دينار عراقي" 
                    className="bg-white border-[#C69A72] text-right"
                    value={formData.total}
                    onChange={(e) => setFormData({...formData, total: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">المدفوع</Label>
                  <Input 
                    placeholder="دينار عراقي" 
                    className="bg-white border-[#C69A72] text-right"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({...formData, paidAmount: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">تاريخ التسليم</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-[#155446] w-4 h-4" />
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(event) => setDeliveryDate(event.target.value)}
                      className="pr-10 bg-white border-[#C69A72] text-right"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#C69A72]">
              <CardHeader>
                <CardTitle className="text-[#13312A] arabic-text text-lg">ملاحظات وصور</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-[#13312A] arabic-text">ملاحظات إضافية</Label>
                  <Textarea 
                    placeholder="أضف أي ملاحظات خاصة..." 
                    className="bg-white border-[#C69A72] text-right min-h-20"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text">صورة القماش</Label>
                  <ImageUploadWithCrop
                    onImageSelect={handleImageSelect}
                    onImageRemove={handleImageRemove}
                    selectedImage={selectedImage}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {submitError && (
              <div className="text-red-600 arabic-text text-center bg-red-50 border border-red-200 rounded-lg p-3">
                {submitError}
              </div>
            )}

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button 
                type="submit"
                className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]"
                disabled={isSubmitting || isUploadingImage}
              >
                {isUploadingImage ? 'جاري رفع الصورة...' : isSubmitting ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Collars manager */}
      <Dialog open={isCollarManagerOpen} onOpenChange={openCollarManager}>
        <DialogContent className="max-w-lg bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text text-lg">تعديل خيارات الياقة</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text">أضف أو عدل أو احذف الخيارات.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCollarOptions} className="space-y-4">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {collarOptionsDraft.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <Input value={o.label} onChange={(e) => collarDraftLabelChange(o.id, e.target.value)} className="flex-1 bg-white border-[#C69A72] text-right" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => collarDraftDelete(o.id)} className="text-red-600 hover:bg-red-100" aria-label="حذف الخيار">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {collarOptionsDraft.length === 0 && (
                <p className="text-sm text-[#155446] arabic-text text-center">لا توجد خيارات حالياً.</p>
              )}
            </div>
            {collarManagerError && <p className="text-sm text-red-600 arabic-text text-right">{collarManagerError}</p>}
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={collarDraftAdd} className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]">إضافة خيار</Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => openCollarManager(false)} className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]">إلغاء</Button>
                <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]">حفظ</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Collars quick add */}
      <Dialog open={isCollarQuickAddOpen} onOpenChange={openCollarQuickAdd}>
        <DialogContent className="max-w-md bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text text-lg">إضافة خيار للياقة</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCollarQuickAdd} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#13312A] arabic-text">اسم الخيار</Label>
              <Input value={collarQuickAddValue} onChange={(e) => { setCollarQuickAddValue(e.target.value); if (collarQuickAddError) setCollarQuickAddError(''); }} className="bg-white border-[#C69A72] text-right" placeholder="أدخل اسم الخيار" />
              {collarQuickAddError && <p className="text-sm text-red-600 arabic-text text-right">{collarQuickAddError}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => openCollarQuickAdd(false)} className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]">إلغاء</Button>
              <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]">حفظ</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Chest style manager */}
      <Dialog open={isChestStyleManagerOpen} onOpenChange={openChestStyleManager}>
        <DialogContent className="max-w-lg bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text text-lg">تعديل أسلوب الصدر</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitChestStyleOptions} className="space-y-4">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {chestStyleOptionsDraft.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <Input value={o.label} onChange={(e) => chestStyleDraftLabelChange(o.id, e.target.value)} className="flex-1 bg-white border-[#C69A72] text-right" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => chestStyleDraftDelete(o.id)} className="text-red-600 hover:bg-red-100" aria-label="حذف الخيار">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {chestStyleOptionsDraft.length === 0 && (
                <p className="text-sm text-[#155446] arabic-text text-center">لا توجد خيارات حالياً.</p>
              )}
            </div>
            {chestStyleManagerError && <p className="text-sm text-red-600 arabic-text text-right">{chestStyleManagerError}</p>}
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={chestStyleDraftAdd} className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]">إضافة خيار</Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => openChestStyleManager(false)} className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]">إلغاء</Button>
                <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]">حفظ</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Chest style quick add */}
      <Dialog open={isChestStyleQuickAddOpen} onOpenChange={openChestStyleQuickAdd}>
        <DialogContent className="max-w-md bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text text-lg">إضافة خيار لأسلوب الصدر</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitChestStyleQuickAdd} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#13312A] arabic-text">اسم الخيار</Label>
              <Input value={chestStyleQuickAddValue} onChange={(e) => { setChestStyleQuickAddValue(e.target.value); if (chestStyleQuickAddError) setChestStyleQuickAddError(''); }} className="bg-white border-[#C69A72] text-right" placeholder="أدخل اسم الخيار" />
              {chestStyleQuickAddError && <p className="text-sm text-red-600 arabic-text text-right">{chestStyleQuickAddError}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => openChestStyleQuickAdd(false)} className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]">إلغاء</Button>
              <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]">حفظ</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sleeve end manager */}
      <Dialog open={isSleeveEndManagerOpen} onOpenChange={openSleeveEndManager}>
        <DialogContent className="max-w-lg bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text text-lg">تعديل نهاية الكم</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitSleeveEndOptions} className="space-y-4">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {sleeveEndOptionsDraft.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <Input value={o.label} onChange={(e) => sleeveEndDraftLabelChange(o.id, e.target.value)} className="flex-1 bg-white border-[#C69A72] text-right" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => sleeveEndDraftDelete(o.id)} className="text-red-600 hover:bg-red-100" aria-label="حذف الخيار">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {sleeveEndOptionsDraft.length === 0 && (
                <p className="text-sm text-[#155446] arabic-text text-center">لا توجد خيارات حالياً.</p>
              )}
            </div>
            {sleeveEndManagerError && <p className="text-sm text-red-600 arabic-text text-right">{sleeveEndManagerError}</p>}
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={sleeveEndDraftAdd} className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]">إضافة خيار</Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => openSleeveEndManager(false)} className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]">إلغاء</Button>
                <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]">حفظ</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sleeve end quick add */}
      <Dialog open={isSleeveEndQuickAddOpen} onOpenChange={openSleeveEndQuickAdd}>
        <DialogContent className="max-w-md bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text text-lg">إضافة خيار لنهاية الكم</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitSleeveEndQuickAdd} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#13312A] arabic-text">اسم الخيار</Label>
              <Input value={sleeveEndQuickAddValue} onChange={(e) => { setSleeveEndQuickAddValue(e.target.value); if (sleeveEndQuickAddError) setSleeveEndQuickAddError(''); }} className="bg-white border-[#C69A72] text-right" placeholder="أدخل اسم الخيار" />
              {sleeveEndQuickAddError && <p className="text-sm text-red-600 arabic-text text-right">{sleeveEndQuickAddError}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => openSleeveEndQuickAdd(false)} className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]">إلغاء</Button>
              <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]">حفظ</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isFabricManagerOpen} onOpenChange={handleFabricManagerOpenChange}>
        <DialogContent className="max-w-lg bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text text-lg">تعديل أنواع القماش</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text">
              قم بإضافة أو تعديل أو حذف أنواع القماش المتاحة للاختيار.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFabricOptionsSubmit} className="space-y-4">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {fabricOptionsDraft.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(event) => handleDraftLabelChange(option.id, event.target.value)}
                    className="flex-1 bg-white border-[#C69A72] text-right"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDraftDelete(option.id)}
                    className="text-red-600 hover:bg-red-100"
                    aria-label="حذف النوع"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {fabricOptionsDraft.length === 0 && (
                <p className="text-sm text-[#155446] arabic-text text-center">
                  لا توجد أنواع حالياً، أضف نوعاً جديداً للبدء.
                </p>
              )}
            </div>
            {fabricManagerError && (
              <p className="text-sm text-red-600 arabic-text text-right">{fabricManagerError}</p>
            )}
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleDraftAdd}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
              >
                إضافة نوع
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFabricManagerOpen(false)}
                  className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]">
                  حفظ
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuickAddDialogOpen} onOpenChange={handleQuickAddDialogOpenChange}>
        <DialogContent className="max-w-md bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text text-lg">إضافة نوع قماش جديد</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text">
              أضف نوعاً جديداً ليكون متاحاً ضمن قائمة أنواع القماش.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#13312A] arabic-text" htmlFor="new-fabric-option">
                اسم النوع
              </Label>
              <Input
                id="new-fabric-option"
                value={quickAddValue}
                onChange={(event) => {
                  setQuickAddValue(event.target.value);
                  if (quickAddError) {
                    setQuickAddError('');
                  }
                }}
                className="bg-white border-[#C69A72] text-right"
                placeholder="أدخل اسم النوع الجديد"
              />
              {quickAddError && (
                <p className="text-sm text-red-600 arabic-text text-right">{quickAddError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickAddDialogOpenChange(false)}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
              >
                إلغاء
              </Button>
              <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]">
                حفظ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
