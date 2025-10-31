import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogOverlay } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { X, Plus, Pencil, Trash2, Check, ChevronDown, Camera, AlertCircle } from 'lucide-react';
import { InvoiceService, InvoiceFormData } from '@/services/invoice.service';
import { useInvoices } from '@/hooks/useInvoices';
import { ImageUpload } from './ui/ImageUpload';
import { ImageService } from '@/services/image.service';
import { DesignSettingsService } from '@/services/design-settings.service';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList, CommandSeparator } from './ui/command';
import { cn } from './ui/utils';

interface NewInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated?: () => void;
  lockCustomerFields?: boolean;
  prefillCustomer?: { 
    id?: string; // Invoice ID for editing existing invoices
    name?: string; 
    phone?: string; 
    address?: string;
    total?: number;
    paidAmount?: number;
    status?: string;
    deliveryDate?: string;
    notes?: string;
    fabricImageUrl?: string;
    paymentDate?: string;
    items?: any[];
    measurements?: {
      length?: string | number;
      shoulder?: string | number;
      waist?: string | number;
      chest?: string | number;
      collar?: string | number;
    };
    designDetails?: {
      fabricType?: string[];
      fabricSource?: string[];
      collarType?: string[];
      chestStyle?: string[];
      sleeveEnd?: string[];
      bunijaType?: string;
    };
  };
}

interface FabricOption {
  id: string;
  label: string;
}


export function NewInvoiceDialogWithDB({ isOpen, onOpenChange, onInvoiceCreated, prefillCustomer, lockCustomerFields }: NewInvoiceDialogProps) {
  const { createInvoice } = useInvoices();
  const designSettings = DesignSettingsService.getInstance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerName: prefillCustomer?.name || '',
    customerPhone: prefillCustomer?.phone || '',
    customerAddress: prefillCustomer?.address || '',
    total: prefillCustomer?.total || 0,
    paidAmount: prefillCustomer?.paidAmount || 0,
    status: prefillCustomer?.status || 'معلق',
    deliveryDate: prefillCustomer?.deliveryDate || '',
    notes: prefillCustomer?.notes || '',
    items: prefillCustomer?.items || [],
    measurements: prefillCustomer?.measurements ? {
      length: String(prefillCustomer.measurements.length || ''),
      shoulder: String(prefillCustomer.measurements.shoulder || ''),
      waist: String(prefillCustomer.measurements.waist || ''),
      chest: String(prefillCustomer.measurements.chest || ''),
      collar: String((prefillCustomer.measurements as any)?.collar || '')
    } : {
      length: '',
      shoulder: '',
      waist: '',
      chest: '',
      collar: ''
    },
    designDetails: prefillCustomer?.designDetails ? {
      fabricType: prefillCustomer.designDetails.fabricType || [],
      fabricSource: prefillCustomer.designDetails.fabricSource || [],
      collarType: prefillCustomer.designDetails.collarType || [],
      chestStyle: prefillCustomer.designDetails.chestStyle || [],
      sleeveEnd: prefillCustomer.designDetails.sleeveEnd || [],
      bunijaType: prefillCustomer.designDetails.bunijaType || ''
    } : {
      fabricType: [],
      fabricSource: [],
      collarType: [],
      chestStyle: [],
      sleeveEnd: [],
      bunijaType: ''
    }
  });

  // Update form data when prefill changes and dialog opens
  useEffect(() => {
    if (isOpen && prefillCustomer) {
      setFormData(prev => ({
        ...prev,
        customerName: prefillCustomer.name || prev.customerName,
        customerPhone: prefillCustomer.phone || prev.customerPhone,
        customerAddress: prefillCustomer.address || prev.customerAddress,
        total: prefillCustomer.total || prev.total,
        paidAmount: prefillCustomer.paidAmount || prev.paidAmount,
        status: prefillCustomer.status || prev.status,
        deliveryDate: prefillCustomer.deliveryDate || prev.deliveryDate,
        notes: prefillCustomer.notes || prev.notes,
        items: prefillCustomer.items || prev.items,
                measurements: prefillCustomer.measurements ? {
                  length: String(prefillCustomer.measurements.length || ''),
                  shoulder: String(prefillCustomer.measurements.shoulder || ''),
                  waist: String(prefillCustomer.measurements.waist || ''),
                  chest: String(prefillCustomer.measurements.chest || ''),
                  collar: String(prefillCustomer.measurements.collar || '')
                } : (prev.measurements || {
                  length: '',
                  shoulder: '',
                  waist: '',
                  chest: '',
                  collar: ''
                }),
        designDetails: prefillCustomer.designDetails ? {
          fabricType: prefillCustomer.designDetails.fabricType || (prev.designDetails?.fabricType || []),
          fabricSource: prefillCustomer.designDetails.fabricSource || (prev.designDetails?.fabricSource || []),
          collarType: prefillCustomer.designDetails.collarType || (prev.designDetails?.collarType || []),
          chestStyle: prefillCustomer.designDetails.chestStyle || (prev.designDetails?.chestStyle || []),
          sleeveEnd: prefillCustomer.designDetails.sleeveEnd || (prev.designDetails?.sleeveEnd || []),
          bunijaType: prefillCustomer.designDetails.bunijaType || (prev.designDetails?.bunijaType || '')
        } : (prev.designDetails || {
          fabricType: [],
          fabricSource: [],
          collarType: [],
          chestStyle: [],
          sleeveEnd: [],
          bunijaType: ''
        }),
      }));
      // Prefill fabric image preview (show existing image without forcing re-upload)
      if (prefillCustomer.fabricImageUrl) {
        setFabricImage(prefillCustomer.fabricImageUrl);
        setFabricImageFile(null);
      }
      // Prefill payment date if provided
      if (prefillCustomer.paymentDate) {
        setPaymentDate(prefillCustomer.paymentDate);
      }
      // Prefill design selections by matching labels to available options
      // If an old invoice contains legacy options not present in current lists,
      // temporarily inject them into local state (DO NOT persist) and select them
      try {
        const dd = prefillCustomer.designDetails || {};
        if (Array.isArray(dd.fabricType) && dd.fabricType[0]) {
          const label = dd.fabricType![0];
          let match = fabricOptions.find(o => o.label === label);
          if (!match) {
            match = { id: `legacy-fabric-${Date.now()}`, label } as any;
            setFabricOptions(prev => [...prev, match!]);
          }
          if (match) setSelectedFabricOption(match.id);
        }
        if (Array.isArray(dd.fabricSource) && dd.fabricSource[0]) {
          const label = dd.fabricSource![0];
          let match = fabricSourceOptions.find(o => o.label === label);
          if (!match) {
            match = { id: `legacy-source-${Date.now()}`, label } as any;
            setFabricSourceOptions(prev => [...prev, match!]);
          }
          if (match) setSelectedFabricSource(match.id);
        }
        if (Array.isArray(dd.collarType) && dd.collarType[0]) {
          const label = dd.collarType![0];
          let match = collarOptions.find(o => o.label === label);
          if (!match) {
            match = { id: `legacy-collar-${Date.now()}`, label } as any;
            setCollarOptions(prev => [...prev, match!]);
          }
          if (match) setSelectedCollarOption(match.id);
        }
        if (Array.isArray(dd.chestStyle) && dd.chestStyle[0]) {
          const label = dd.chestStyle![0];
          let match = chestStyleOptions.find(o => o.label === label);
          if (!match) {
            match = { id: `legacy-chest-${Date.now()}`, label } as any;
            setChestStyleOptions(prev => [...prev, match!]);
          }
          if (match) setSelectedChestStyleOption(match.id);
        }
        if (Array.isArray(dd.sleeveEnd) && dd.sleeveEnd[0]) {
          const label = dd.sleeveEnd![0];
          let match = sleeveEndOptions.find(o => o.label === label);
          if (!match) {
            match = { id: `legacy-sleeve-${Date.now()}`, label } as any;
            setSleeveEndOptions(prev => [...prev, match!]);
          }
          if (match) setSelectedSleeveEndOption(match.id);
        }
        if (dd.bunijaType) {
          const label = dd.bunijaType;
          let match = bunijaOptions.find(o => o.label === label);
          if (!match) {
            match = { id: `legacy-bunija-${Date.now()}`, label } as any;
            setBunijaOptions(prev => [...prev, match!]);
          }
          if (match) setSelectedBunijaOption(match.id);
        }
      } catch {}
    }
  }, [isOpen, prefillCustomer]);

  // When editing an existing invoice, fetch missing measurements/design details from DB
  useEffect(() => {
    const loadEditExtras = async () => {
      if (!isOpen || !prefillCustomer?.id) return;

      // Determine if measurements are missing or all zeros
      const m = formData.measurements || { length: 0, shoulder: 0, waist: 0, chest: 0, collar: 0 } as any;
      const hasAnyMeasurement = Boolean((m.length || m.shoulder || m.waist || m.chest || (m as any).collar));
      const needMeasurements = !hasAnyMeasurement;

      // Determine if design details are missing
      const dd = formData.designDetails || { fabricType: [], fabricSource: [], collarType: [], chestStyle: [], sleeveEnd: [], bunijaType: '' } as any;
      const hasAnyDesign = Boolean(
        (dd.fabricType && dd.fabricType.length) ||
        (dd.fabricSource && dd.fabricSource.length) ||
        (dd.collarType && dd.collarType.length) ||
        (dd.chestStyle && dd.chestStyle.length) ||
        (dd.sleeveEnd && dd.sleeveEnd.length) ||
        dd.bunijaType
      );

      if (!needMeasurements && hasAnyDesign) return;

      try {
        const { databaseService } = await import('@/db/database.service');
        const inv = await databaseService.getInvoiceById(String(prefillCustomer.id));
        if (!inv) return;

        // Resolve measurements from invoice or related customer
        if (needMeasurements) {
          try {
            let cm: any = (inv as any).measurements || (inv as any).customer_measurements;
            if (!cm) {
              const customers = await databaseService.getCustomers();
              const cid: any = (inv as any).customer_id;
              const byId = customers.find((c: any) => String(c.id) === String(cid));
              const byAlias = customers.find((c: any) => (c.name || '').trim() === (inv as any).customer_name?.trim() && (c.phone || '').trim() === ((inv as any).customer_phone || '').trim());
              const customer: any = byId || byAlias;
              cm = customer?.measurements;
            }
            if (typeof cm === 'string') { try { cm = JSON.parse(cm); } catch { cm = null; } }
            if (cm && typeof cm === 'object') {
              setFormData(prev => ({
                ...prev,
                measurements: {
                  length: String(cm.height ?? cm.length ?? ''),
                  shoulder: String(cm.shoulder ?? ''),
                  waist: String(cm.waist ?? ''),
                  chest: String(cm.chest ?? ''),
                  collar: String((cm as any).collar ?? ''),
                }
              }));
            }
          } catch {}
        }

        // Resolve design details from invoice fields if missing
        if (!hasAnyDesign) {
          try {
            const nextDD = {
              fabricType: typeof (inv as any).fabric_type === 'string' && (inv as any).fabric_type
                ? String((inv as any).fabric_type).split(',').filter(Boolean)
                : [],
              fabricSource: typeof (inv as any).fabric_source === 'string' && (inv as any).fabric_source
                ? String((inv as any).fabric_source).split(',').filter(Boolean)
                : [],
              collarType: typeof (inv as any).collar_type === 'string' && (inv as any).collar_type
                ? String((inv as any).collar_type).split(',').filter(Boolean)
                : [],
              chestStyle: typeof (inv as any).chest_style === 'string' && (inv as any).chest_style
                ? String((inv as any).chest_style).split(',').filter(Boolean)
                : [],
              sleeveEnd: typeof (inv as any).sleeve_end === 'string' && (inv as any).sleeve_end
                ? String((inv as any).sleeve_end).split(',').filter(Boolean)
                : [],
              bunijaType: (inv as any).bunija_type || ''
            } as any;
            setFormData(prev => ({ ...prev, designDetails: nextDD }));

            // Also reflect into selection states so UI shows selected tags
            try {
              if (Array.isArray(nextDD.fabricType) && nextDD.fabricType[0]) {
                const label = nextDD.fabricType[0];
                let match = fabricOptions.find(o => o.label === label);
                if (!match) {
                  match = { id: `legacy-fabric-${Date.now()}`, label } as any;
                  setFabricOptions(prev => [...prev, match!]);
                }
                if (match) setSelectedFabricOption(match.id);
              }
              if (Array.isArray(nextDD.fabricSource) && nextDD.fabricSource[0]) {
                const label = nextDD.fabricSource[0];
                let match = fabricSourceOptions.find(o => o.label === label);
                if (!match) {
                  match = { id: `legacy-source-${Date.now()}`, label } as any;
                  setFabricSourceOptions(prev => [...prev, match!]);
                }
                if (match) setSelectedFabricSource(match.id);
              }
              if (Array.isArray(nextDD.collarType) && nextDD.collarType[0]) {
                const label = nextDD.collarType[0];
                let match = collarOptions.find(o => o.label === label);
                if (!match) {
                  match = { id: `legacy-collar-${Date.now()}`, label } as any;
                  setCollarOptions(prev => [...prev, match!]);
                }
                if (match) setSelectedCollarOption(match.id);
              }
              if (Array.isArray(nextDD.chestStyle) && nextDD.chestStyle[0]) {
                const label = nextDD.chestStyle[0];
                let match = chestStyleOptions.find(o => o.label === label);
                if (!match) {
                  match = { id: `legacy-chest-${Date.now()}`, label } as any;
                  setChestStyleOptions(prev => [...prev, match!]);
                }
                if (match) setSelectedChestStyleOption(match.id);
              }
              if (Array.isArray(nextDD.sleeveEnd) && nextDD.sleeveEnd[0]) {
                const label = nextDD.sleeveEnd[0];
                let match = sleeveEndOptions.find(o => o.label === label);
                if (!match) {
                  match = { id: `legacy-sleeve-${Date.now()}`, label } as any;
                  setSleeveEndOptions(prev => [...prev, match!]);
                }
                if (match) setSelectedSleeveEndOption(match.id);
              }
              if (nextDD.bunijaType) {
                const label = nextDD.bunijaType;
                let match = bunijaOptions.find(o => o.label === label);
                if (!match) {
                  match = { id: `legacy-bunija-${Date.now()}`, label } as any;
                  setBunijaOptions(prev => [...prev, match!]);
                }
                if (match) setSelectedBunijaOption(match.id);
              }
            } catch {}
          } catch {}
        }
      } catch {}
    };

    loadEditExtras();
  }, [isOpen, prefillCustomer?.id]);

  // Payment calculation states
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState('');


  // Calculate remaining amount and update payment status
  useEffect(() => {
    const remaining = formData.total - formData.paidAmount;
    setRemainingAmount(remaining);
    
    // Auto-update payment status
    let newStatus = 'معلق';
    if (formData.paidAmount === 0) {
      newStatus = 'معلق';
    } else if (formData.paidAmount >= formData.total) {
      newStatus = 'مدفوع';
    } else if (formData.paidAmount > 0) {
      newStatus = 'جزئي';
    }
    
    setFormData(prev => ({ ...prev, status: newStatus }));
    
    // Set payment date when payment is made
    if (formData.paidAmount > 0 && !paymentDate) {
      const today = new Date().toISOString().split('T')[0];
      setPaymentDate(today);
    }
  }, [formData.total, formData.paidAmount, paymentDate]);


  // Handle focus to clear zero values
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') {
      e.target.select();
    }
  };

  // Prevent wheel event on number inputs to avoid accidental changes
  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  // Image state
  const [fabricImage, setFabricImage] = useState<string | null>(null);
  const [fabricImageFile, setFabricImageFile] = useState<File | null>(null);

  // Camera capture state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop camera helper
  const stopCameraStream = () => {
    const stream = videoRef.current?.srcObject as MediaStream | undefined;
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Check if camera is available on the device
  const checkCameraAvailability = async (): Promise<{ available: boolean; message?: string }> => {
    try {
      if (!('mediaDevices' in navigator) || !navigator.mediaDevices?.getUserMedia) {
        return { available: false, message: 'المتصفح لا يدعم الوصول للكاميرا.' };
      }

      // Check if we're in a secure context (required for camera access)
      if (!window.isSecureContext && location.protocol !== 'https:' && location.hostname !== 'localhost') {
        return { available: false, message: 'يتطلب HTTPS للوصول للكاميرا.' };
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        return { available: false, message: 'لا توجد كاميرا متاحة على هذا الجهاز.' };
      }

      return { available: true };
    } catch (err) {
      console.error('Error checking camera availability:', err);
      return { available: false, message: 'تعذر التحقق من توفر الكاميرا.' };
    }
  };

  // Map getUserMedia error to friendly message
  const getCameraErrorMessage = (err: any): string => {
    const name = err?.name || '';
    const message = err?.message || '';
    
    if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
      return 'تم رفض إذن الوصول للكاميرا. امنح الإذن من المتصفح وإعدادات Windows > الخصوصية والأمان > الكاميرا.';
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      return 'لا توجد كاميرا متاحة أو لا يمكن العثور عليها. تأكد من توصيل الكاميرا أو كاميرا الويب.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'الكاميرا قيد الاستخدام من تطبيق آخر. أغلقه وحاول مجدداً.';
    }
    if (name === 'AbortError') {
      return 'تم إلغاء الوصول للكاميرا بشكل غير متوقع. حاول مرة أخرى.';
    }
    if (name === 'TypeError') {
      return 'لا يمكن فتح الكاميرا على هذه الصفحة. تأكد من استخدام Localhost أو HTTPS.';
    }
    if (name === 'NotSupportedError') {
      return 'المتصفح لا يدعم الوصول للكاميرا. جرب متصفح آخر.';
    }
    if (message.includes('device not found') || message.includes('NotFoundError')) {
      return 'لا توجد كاميرا متصلة بالجهاز. تأكد من توصيل كاميرا الويب أو الكاميرا الخارجية.';
    }
    return 'تعذر فتح الكاميرا. تحقق من الأذونات ثم حاول مجدداً.';
  };

  // Check camera availability on mount
  useEffect(() => {
    const checkCamera = async () => {
      const availability = await checkCameraAvailability();
      setCameraAvailable(availability.available);
    };
    checkCamera();
  }, []);

  // Cleanup when dialog closes or component unmounts
  useEffect(() => {
    if (!isCameraOpen) return;
    return () => {
      stopCameraStream();
    };
  }, [isCameraOpen]);

  // Design options state - single selection
  const [fabricOptions, setFabricOptions] = useState<FabricOption[]>([
    { id: 'cotton', label: 'قطن' },
    { id: 'silk', label: 'حرير' },
    { id: 'wool', label: 'صوف' },
    { id: 'linen', label: 'كتان' },
    { id: 'denim', label: 'دنة' },
    { id: 'chiffon', label: 'شيفون' },
  ]);
  const [selectedFabricOption, setSelectedFabricOption] = useState<string>('');
  const [isFabricPopoverOpen, setIsFabricPopoverOpen] = useState(false);
  const [isFabricManagerOpen, setIsFabricManagerOpen] = useState(false);
  const [fabricOptionsDraft, setFabricOptionsDraft] = useState<FabricOption[]>([]);
  const [fabricManagerError, setFabricManagerError] = useState('');
  const [isQuickAddDialogOpen, setIsQuickAddDialogOpen] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState('');
  const [quickAddError, setQuickAddError] = useState('');

  // Fabric source options - single selection
  const [fabricSourceOptions, setFabricSourceOptions] = useState<FabricOption[]>([
    { id: 'outside', label: 'خارج المحل' },
    { id: 'inside', label: 'داخل المحل' },
  ]);
  const [selectedFabricSource, setSelectedFabricSource] = useState<string>('');
  const [isSourcePopoverOpen, setIsSourcePopoverOpen] = useState(false);
  const [isSourceManagerOpen, setIsSourceManagerOpen] = useState(false);
  const [sourceOptionsDraft, setSourceOptionsDraft] = useState<FabricOption[]>([]);
  const [sourceManagerError, setSourceManagerError] = useState('');
  const [isSourceQuickAddOpen, setIsSourceQuickAddOpen] = useState(false);
  const [sourceQuickAddValue, setSourceQuickAddValue] = useState('');
  const [sourceQuickAddError, setSourceQuickAddError] = useState('');

  // Collar options - single selection
  const [collarOptions, setCollarOptions] = useState<FabricOption[]>([
    { id: 'regular', label: 'عادية' },
    { id: 'mandarin', label: 'صينية' },
    { id: 'formal', label: 'رسمية' },
    { id: 'open', label: 'مفتوحة' },
  ]);
  const [selectedCollarOption, setSelectedCollarOption] = useState<string>('');
  const [isCollarPopoverOpen, setIsCollarPopoverOpen] = useState(false);
  const [isCollarManagerOpen, setIsCollarManagerOpen] = useState(false);
  const [collarOptionsDraft, setCollarOptionsDraft] = useState<FabricOption[]>([]);
  const [collarManagerError, setCollarManagerError] = useState('');
  const [isCollarQuickAddOpen, setIsCollarQuickAddOpen] = useState(false);
  const [collarQuickAddValue, setCollarQuickAddValue] = useState('');
  const [collarQuickAddError, setCollarQuickAddError] = useState('');

  // Chest style options - single selection
  const [chestStyleOptions, setChestStyleOptions] = useState<FabricOption[]>([
    { id: 'single', label: 'صدر واحد' },
    { id: 'double', label: 'صدر مزدوج' },
    { id: 'open', label: 'صدر مفتوح' },
  ]);
  const [selectedChestStyleOption, setSelectedChestStyleOption] = useState<string>('');
  const [isChestStylePopoverOpen, setIsChestStylePopoverOpen] = useState(false);
  const [isChestStyleManagerOpen, setIsChestStyleManagerOpen] = useState(false);
  const [chestStyleOptionsDraft, setChestStyleOptionsDraft] = useState<FabricOption[]>([]);
  const [chestStyleManagerError, setChestStyleManagerError] = useState('');
  const [isChestStyleQuickAddOpen, setIsChestStyleQuickAddOpen] = useState(false);
  const [chestStyleQuickAddValue, setChestStyleQuickAddValue] = useState('');
  const [chestStyleQuickAddError, setChestStyleQuickAddError] = useState('');

  // Sleeve end options - single selection
  const [sleeveEndOptions, setSleeveEndOptions] = useState<FabricOption[]>([
    { id: 'cuff', label: 'ردن بحاشية' },
    { id: 'plain', label: 'ردن عادي' },
    { id: 'short', label: 'ردن قصير' },
    { id: 'long', label: 'ردن طويل' },
  ]);
  const [selectedSleeveEndOption, setSelectedSleeveEndOption] = useState<string>('');
  const [isSleeveEndPopoverOpen, setIsSleeveEndPopoverOpen] = useState(false);
  const [isSleeveEndManagerOpen, setIsSleeveEndManagerOpen] = useState(false);
  const [sleeveEndOptionsDraft, setSleeveEndOptionsDraft] = useState<FabricOption[]>([]);
  const [sleeveEndManagerError, setSleeveEndManagerError] = useState('');
  const [isSleeveEndQuickAddOpen, setIsSleeveEndQuickAddOpen] = useState(false);
  const [sleeveEndQuickAddValue, setSleeveEndQuickAddValue] = useState('');
  const [sleeveEndQuickAddError, setSleeveEndQuickAddError] = useState('');

  // Bunija options - single selection
  const [bunijaOptions, setBunijaOptions] = useState<FabricOption[]>([
    { id: 'single', label: 'بنايج' },
    { id: 'half', label: 'نصف بنيجة' },
    { id: 'double', label: 'بنيجتين' },
  ]);
  const [selectedBunijaOption, setSelectedBunijaOption] = useState<string>('');
  const [isBunijaPopoverOpen, setIsBunijaPopoverOpen] = useState(false);
  const [isBunijaManagerOpen, setIsBunijaManagerOpen] = useState(false);
  const [bunijaOptionsDraft, setBunijaOptionsDraft] = useState<FabricOption[]>([]);
  const [bunijaManagerError, setBunijaManagerError] = useState('');
  const [isBunijaQuickAddOpen, setIsBunijaQuickAddOpen] = useState(false);
  const [bunijaQuickAddValue, setBunijaQuickAddValue] = useState('');
  const [bunijaQuickAddError, setBunijaQuickAddError] = useState('');

  // Load persisted design option lists and last selections when opening a new dialog
  useEffect(() => {
    if (!isOpen || prefillCustomer) return;
    try {
      const savedFabricOptions = designSettings.getOptions('fabricType');
      if (savedFabricOptions?.length) setFabricOptions(savedFabricOptions);
      const savedSourceOptions = designSettings.getOptions('fabricSource');
      if (savedSourceOptions?.length) setFabricSourceOptions(savedSourceOptions);
      const savedCollarOptions = designSettings.getOptions('collarType');
      if (savedCollarOptions?.length) setCollarOptions(savedCollarOptions);
      const savedChestStyleOptions = designSettings.getOptions('chestStyle');
      if (savedChestStyleOptions?.length) setChestStyleOptions(savedChestStyleOptions);
      const savedSleeveEndOptions = designSettings.getOptions('sleeveEnd');
      if (savedSleeveEndOptions?.length) setSleeveEndOptions(savedSleeveEndOptions);
      const savedBunijaOptions = designSettings.getOptions('bunijaType');
      if (savedBunijaOptions?.length) setBunijaOptions(savedBunijaOptions);

      const selFabricId = designSettings.getSelectedId('fabricType');
      if (selFabricId) setSelectedFabricOption(selFabricId);
      const selSourceId = designSettings.getSelectedId('fabricSource');
      if (selSourceId) setSelectedFabricSource(selSourceId);
      const selCollarId = designSettings.getSelectedId('collarType');
      if (selCollarId) setSelectedCollarOption(selCollarId);
      const selChestId = designSettings.getSelectedId('chestStyle');
      if (selChestId) setSelectedChestStyleOption(selChestId);
      const selSleeveId = designSettings.getSelectedId('sleeveEnd');
      if (selSleeveId) setSelectedSleeveEndOption(selSleeveId);
      const selBunijaId = designSettings.getSelectedId('bunijaType');
      if (selBunijaId) setSelectedBunijaOption(selBunijaId);

      // Reflect selections into formData.designDetails for a fresh form
      setFormData(prev => ({
        ...prev,
        designDetails: {
          fabricType: selFabricId ? [ (savedFabricOptions || []).find(o => o.id === selFabricId)?.label || '' ] : [],
          fabricSource: selSourceId ? [ (savedSourceOptions || []).find(o => o.id === selSourceId)?.label || '' ] : [],
          collarType: selCollarId ? [ (savedCollarOptions || []).find(o => o.id === selCollarId)?.label || '' ] : [],
          chestStyle: selChestId ? [ (savedChestStyleOptions || []).find(o => o.id === selChestId)?.label || '' ] : [],
          sleeveEnd: selSleeveId ? [ (savedSleeveEndOptions || []).find(o => o.id === selSleeveId)?.label || '' ] : [],
          bunijaType: selBunijaId ? (savedBunijaOptions || []).find(o => o.id === selBunijaId)?.label || '' : ''
        }
      }));
    } catch {}
  }, [isOpen, prefillCustomer]);

  // Live-sync design option changes across all open dialogs/windows
  useEffect(() => {
    const unsubscribe = designSettings.onChange((_evt) => {
      try {
        const savedFabricOptions = designSettings.getOptions('fabricType');
        setFabricOptions(savedFabricOptions?.length ? savedFabricOptions : []);
        const savedSourceOptions = designSettings.getOptions('fabricSource');
        setFabricSourceOptions(savedSourceOptions?.length ? savedSourceOptions : []);
        const savedCollarOptions = designSettings.getOptions('collarType');
        setCollarOptions(savedCollarOptions?.length ? savedCollarOptions : []);
        const savedChestStyleOptions = designSettings.getOptions('chestStyle');
        setChestStyleOptions(savedChestStyleOptions?.length ? savedChestStyleOptions : []);
        const savedSleeveEndOptions = designSettings.getOptions('sleeveEnd');
        setSleeveEndOptions(savedSleeveEndOptions?.length ? savedSleeveEndOptions : []);
        const savedBunijaOptions = designSettings.getOptions('bunijaType');
        setBunijaOptions(savedBunijaOptions?.length ? savedBunijaOptions : []);

        // Ensure current selections remain valid; clear if removed
        const ensureValid = (selId: string, opts: { id: string }[]) => (selId && opts.some(o => o.id === selId)) ? selId : '';
        const nextSelFabric = ensureValid(selectedFabricOption, savedFabricOptions || []);
        if (nextSelFabric !== selectedFabricOption) setSelectedFabricOption(nextSelFabric);
        const nextSelSource = ensureValid(selectedFabricSource, savedSourceOptions || []);
        if (nextSelSource !== selectedFabricSource) setSelectedFabricSource(nextSelSource);
        const nextSelCollar = ensureValid(selectedCollarOption, savedCollarOptions || []);
        if (nextSelCollar !== selectedCollarOption) setSelectedCollarOption(nextSelCollar);
        const nextSelChest = ensureValid(selectedChestStyleOption, savedChestStyleOptions || []);
        if (nextSelChest !== selectedChestStyleOption) setSelectedChestStyleOption(nextSelChest);
        const nextSelSleeve = ensureValid(selectedSleeveEndOption, savedSleeveEndOptions || []);
        if (nextSelSleeve !== selectedSleeveEndOption) setSelectedSleeveEndOption(nextSelSleeve);
        const nextSelBunija = ensureValid(selectedBunijaOption, savedBunijaOptions || []);
        if (nextSelBunija !== selectedBunijaOption) setSelectedBunijaOption(nextSelBunija);
      } catch {}
    });
    return () => { try { unsubscribe(); } catch {} };
  }, [selectedFabricOption, selectedFabricSource, selectedCollarOption, selectedChestStyleOption, selectedSleeveEndOption, selectedBunijaOption]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        total: 0,
        paidAmount: 0,
        status: 'معلق',
        deliveryDate: '',
        notes: '',
        items: [],
        measurements: {
          length: 0,
          shoulder: 0,
          waist: 0,
          chest: 0,
          collar: 0
        },
        designDetails: {
          fabricType: selectedFabricOption ? [fabricOptions.find(opt => opt.id === selectedFabricOption)?.label || ''] : [],
          fabricSource: selectedFabricSource ? [fabricSourceOptions.find(opt => opt.id === selectedFabricSource)?.label || ''] : [],
          collarType: selectedCollarOption ? [collarOptions.find(opt => opt.id === selectedCollarOption)?.label || ''] : [],
          chestStyle: selectedChestStyleOption ? [chestStyleOptions.find(opt => opt.id === selectedChestStyleOption)?.label || ''] : [],
          sleeveEnd: selectedSleeveEndOption ? [sleeveEndOptions.find(opt => opt.id === selectedSleeveEndOption)?.label || ''] : [],
          bunijaType: selectedBunijaOption ? bunijaOptions.find(opt => opt.id === selectedBunijaOption)?.label || '' : ''
        }
      });
      setFabricImage(null);
      setFabricImageFile(null);
      setSubmitError(null);
      
      // Reset payment states
      setRemainingAmount(0);
      setPaymentDate('');
      
      // Reset design options
      setSelectedFabricOption('');
      setSelectedFabricSource('');
      setSelectedCollarOption('');
      setSelectedChestStyleOption('');
      setSelectedSleeveEndOption('');
      setSelectedBunijaOption('');
      setIsFabricPopoverOpen(false);
      setIsSourcePopoverOpen(false);
      setIsCollarPopoverOpen(false);
      setIsChestStylePopoverOpen(false);
      setIsSleeveEndPopoverOpen(false);
      setIsBunijaPopoverOpen(false);
      setIsSourceManagerOpen(false);
      setIsBunijaManagerOpen(false);
      setIsSourceQuickAddOpen(false);
      setIsBunijaQuickAddOpen(false);
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Validate form data
      // Prepare a consistent payload snapshot (avoid racing with setState)
      let payload = { ...formData } as typeof formData;
      try {
        if (Array.isArray(formData.items) && formData.items.length > 0) {
          const computed = InvoiceService.calculateTotal(formData.items);
          if (computed !== formData.total) {
            payload = { ...payload, total: computed };
            setFormData(prev => ({ ...prev, total: computed }));
          }
        }
      } catch {}

      const validationErrors = InvoiceService.validateInvoiceData(payload);
      if (validationErrors.length > 0) {
        setSubmitError(validationErrors.join('\n'));
        setIsSubmitting(false);
        return;
      }

      // Upload fabric image first if any
      // نبدأ بحفظ الفاتورة محلياً أولاً ثم نرفع الصورة بالخلفية إن وُجدت
      // Check if this is an edit operation (has invoice ID) or create operation
      const isEdit = prefillCustomer?.id;
      let result: any;

      if (isEdit && prefillCustomer?.id) {
        // Update existing invoice
        const updates: Partial<any> = {
          customer_name: payload.customerName,
          customer_phone: payload.customerPhone,
          customer_address: payload.customerAddress,
          total: payload.total,
          paid_amount: payload.paidAmount,
          status: payload.status,
          due_date: payload.deliveryDate,
          notes: payload.notes,
          // Persist payment date
          ...(paymentDate ? { paid_at: paymentDate } : {}),
          // Persist design selections as comma-separated strings on invoice
          fabric_type: Array.isArray(payload.designDetails?.fabricType) && payload.designDetails!.fabricType.length
            ? payload.designDetails!.fabricType.join(',')
            : undefined,
          fabric_source: Array.isArray(payload.designDetails?.fabricSource) && payload.designDetails!.fabricSource.length
            ? payload.designDetails!.fabricSource.join(',')
            : undefined,
          collar_type: Array.isArray(payload.designDetails?.collarType) && payload.designDetails!.collarType.length
            ? payload.designDetails!.collarType.join(',')
            : undefined,
          chest_style: Array.isArray(payload.designDetails?.chestStyle) && payload.designDetails!.chestStyle.length
            ? payload.designDetails!.chestStyle.join(',')
            : undefined,
          sleeve_end: Array.isArray(payload.designDetails?.sleeveEnd) && payload.designDetails!.sleeveEnd.length
            ? payload.designDetails!.sleeveEnd.join(',')
            : undefined,
          bunija_type: payload.designDetails?.bunijaType || undefined,
          // Save customer measurements snapshot to invoice to preserve them even if customer profile changes
          ...(payload.measurements ? { customer_measurements: payload.measurements } as any : {}),
        };

        result = await InvoiceService.updateInvoice(prefillCustomer.id, updates);
        // Ensure invoice details re-fetches so updated design fields and measurements appear
        try {
          const { queryClient } = await import('@/app/queryClient');
          // Invalidate using both possible ID formats to ensure cache is cleared
          queryClient.invalidateQueries({ queryKey: ['invoice-details', String(prefillCustomer.id)] });
          queryClient.invalidateQueries({ queryKey: ['invoice-details', prefillCustomer.id] });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['customers'] });
        } catch {}
        // Also update customer's saved measurements if provided (preserve as strings to support text like "1 ونصف")
        try {
          const m: any = payload.measurements || {};
          const hasMeasurements = typeof m === 'object' && (m.length || m.shoulder || m.waist || m.chest);
          if (hasMeasurements) {
            const { databaseService } = await import('@/db/database.service');
            const customers = await databaseService.getCustomers();
            const target = customers.find(c => String((c as any).id) === String((result as any).customer_id))
              || customers.find(c => (c.name || '').trim() === (payload.customerName || '').trim() && (c.phone || '').trim() === (payload.customerPhone || '').trim());
            if (target) {
              await databaseService.updateCustomer(String((target as any).id), {
                measurements: {
                  height: String(m.length || ''),
                  shoulder: String(m.shoulder || ''),
                  waist: String(m.waist || ''),
                  chest: String(m.chest || ''),
                  collar: String(m.collar || '')
                }
              } as any, { silent: true } as any);
            }
          }
        } catch {}
      } else {
        // Create new invoice
        result = await createInvoice({ ...payload, paymentDate });
      }

      // 2) Upload image and persist URL to invoice so it appears in details page
      console.log('NewInvoiceDialog - Invoice creation result:', result);
      console.log('NewInvoiceDialog - Image upload debug:', {
        hasFabricImage: !!fabricImage,
        hasFabricImageFile: !!fabricImageFile,
        invoiceId: result?.id,
        fabricImageType: typeof fabricImage,
        fabricImageFileType: fabricImageFile?.type
      });
      
      if (fabricImage && fabricImageFile && result?.id) {
        try {
          console.log('Uploading image for invoice:', result.id);
          const uploaded = await ImageService.uploadImage(
            fabricImageFile,
            'invoice',
            result.id
          );
          console.log('Image upload result:', uploaded);
          
          // The image is now saved in the images table via the uploadImage function
          // We also save the URL to fabric_image_url for backward compatibility
          const newUrl = (uploaded as any).publicUrl || (uploaded as any).data_url || (uploaded as any).url || '';
          if (newUrl) {
            console.log('Updating invoice with image URL:', newUrl);
            try { await InvoiceService.updateInvoice(result.id, { fabric_image_url: newUrl } as any); } catch (updateError) {
              console.error('Failed to update invoice with image URL:', updateError);
            }
          } else {
            console.warn('No URL returned from image upload');
          }
        } catch (imageError) {
          console.error('Fabric image upload failed:', imageError);
        }
      } else {
        console.log('Skipping image upload - missing data:', {
          fabricImage: !!fabricImage,
          fabricImageFile: !!fabricImageFile,
          resultId: !!result?.id
        });
      }
      
      // Close dialog
      onOpenChange(false);
      
      // Notify parent component that invoice was created
      if (onInvoiceCreated) {
        onInvoiceCreated();
      }
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      setSubmitError(error instanceof Error ? error.message : 'حدث خطأ في إنشاء الفاتورة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keep designDetails in formData synced with current selections
  useEffect(() => {
    try {
      const fabricLabel = selectedFabricOption ? (fabricOptions.find(o => o.id === selectedFabricOption)?.label || '') : '';
      const sourceLabel = selectedFabricSource ? (fabricSourceOptions.find(o => o.id === selectedFabricSource)?.label || '') : '';
      const collarLabel = selectedCollarOption ? (collarOptions.find(o => o.id === selectedCollarOption)?.label || '') : '';
      const chestLabel = selectedChestStyleOption ? (chestStyleOptions.find(o => o.id === selectedChestStyleOption)?.label || '') : '';
      const sleeveLabel = selectedSleeveEndOption ? (sleeveEndOptions.find(o => o.id === selectedSleeveEndOption)?.label || '') : '';
      const bunijaLabel = selectedBunijaOption ? (bunijaOptions.find(o => o.id === selectedBunijaOption)?.label || '') : '';

      setFormData(prev => ({
        ...prev,
        designDetails: {
          fabricType: fabricLabel ? [fabricLabel] : [],
          fabricSource: sourceLabel ? [sourceLabel] : [],
          collarType: collarLabel ? [collarLabel] : [],
          chestStyle: chestLabel ? [chestLabel] : [],
          sleeveEnd: sleeveLabel ? [sleeveLabel] : [],
          bunijaType: bunijaLabel || ''
        }
      }));
    } catch {}
  }, [selectedFabricOption, selectedFabricSource, selectedCollarOption, selectedChestStyleOption, selectedSleeveEndOption, selectedBunijaOption, fabricOptions, fabricSourceOptions, collarOptions, chestStyleOptions, sleeveEndOptions, bunijaOptions]);

  // Helper functions for fabric options
  const selectedFabricLabel = selectedFabricOption 
    ? fabricOptions.find(option => option.id === selectedFabricOption)?.label || ''
    : '';

  const selectFabricOption = (optionId: string) => {
    setSelectedFabricOption(optionId);
    try { designSettings.setSelectedId('fabricType', optionId); } catch {}
  };

  const selectFabricSource = (sourceId: string) => {
    setSelectedFabricSource(sourceId);
    try { designSettings.setSelectedId('fabricSource', sourceId); } catch {}
  };

  const selectCollarOption = (optionId: string) => {
    setSelectedCollarOption(optionId);
    try { designSettings.setSelectedId('collarType', optionId); } catch {}
  };

  const selectChestStyleOption = (optionId: string) => {
    setSelectedChestStyleOption(optionId);
    try { designSettings.setSelectedId('chestStyle', optionId); } catch {}
  };

  const selectSleeveEndOption = (optionId: string) => {
    setSelectedSleeveEndOption(optionId);
    try { designSettings.setSelectedId('sleeveEnd', optionId); } catch {}
  };

  const selectBunijaOption = (optionId: string) => {
    setSelectedBunijaOption(optionId);
    try { designSettings.setSelectedId('bunijaType', optionId); } catch {}
  };

  // Manager functions for fabric options
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
    try { designSettings.setOptions('fabricType', cleanedOptions as any); } catch {}
    // Clear selection if the selected option was removed
    if (selectedFabricOption && !cleanedOptions.some(option => option.id === selectedFabricOption)) {
      setSelectedFabricOption('');
    }
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
    setFabricOptions((previous) => {
      const next = [...previous, newOption];
      try { designSettings.setOptions('fabricType', next as any); } catch {}
      return next;
    });
    setSelectedFabricOption(newOption.id);
    try { designSettings.setSelectedId('fabricType', newOption.id); } catch {}
    handleQuickAddDialogOpenChange(false);
  };

  // Helper functions for collar options
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
    try { designSettings.setOptions('collarType', cleaned as any); } catch {}
    // Clear selection if the selected option was removed
    if (selectedCollarOption && !cleaned.some(o => o.id === selectedCollarOption)) {
      setSelectedCollarOption('');
    }
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
    setCollarOptions((prev) => {
      const next = [...prev, option];
      try { designSettings.setOptions('collarType', next as any); } catch {}
      return next;
    });
    setSelectedCollarOption(option.id);
    try { designSettings.setSelectedId('collarType', option.id); } catch {}
    openCollarQuickAdd(false);
  };

  // Helper functions for chest style options
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
    // Clear selection if the selected option was removed
    if (selectedChestStyleOption && !cleaned.some(o => o.id === selectedChestStyleOption)) {
      setSelectedChestStyleOption('');
    }
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
    setChestStyleOptions((prev) => {
      const next = [...prev, option];
      try { designSettings.setOptions('chestStyle', next as any); } catch {}
      return next;
    });
    setSelectedChestStyleOption(option.id);
    openChestStyleQuickAdd(false);
  };

  // Helper functions for sleeve end options
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
    try { designSettings.setOptions('sleeveEnd', cleaned as any); } catch {}
    // Clear selection if the selected option was removed
    if (selectedSleeveEndOption && !cleaned.some(o => o.id === selectedSleeveEndOption)) {
      setSelectedSleeveEndOption('');
    }
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
    setSleeveEndOptions((prev) => {
      const next = [...prev, option];
      try { designSettings.setOptions('sleeveEnd', next as any); } catch {}
      return next;
    });
    setSelectedSleeveEndOption(option.id);
    openSleeveEndQuickAdd(false);
  };

  // Helper functions for fabric source options
  const openSourceManager = (open: boolean) => {
    setIsSourceManagerOpen(open);
    if (open) {
      setSourceOptionsDraft(fabricSourceOptions.map((o) => ({ ...o })));
      setSourceManagerError('');
    }
  };

  const submitSourceOptions: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const cleaned = sourceOptionsDraft.map((o) => ({ ...o, label: o.label.trim() })).filter((o) => o.label !== '');
    const labels = cleaned.map((o) => o.label);
    if (new Set(labels).size !== labels.length) {
      setSourceManagerError('الرجاء عدم تكرار أسماء المصادر.');
      return;
    }
    setFabricSourceOptions(cleaned);
    try { designSettings.setOptions('fabricSource', cleaned as any); } catch {}
    // Clear selection if the selected option was removed
    if (selectedFabricSource && !cleaned.some(o => o.id === selectedFabricSource)) {
      setSelectedFabricSource('');
    }
    setIsSourceManagerOpen(false);
  };

  const sourceDraftLabelChange = (id: string, label: string) => {
    setSourceOptionsDraft((prev) => prev.map((o) => (o.id === id ? { ...o, label } : o)));
  };

  const sourceDraftDelete = (id: string) => {
    setSourceOptionsDraft((prev) => prev.filter((o) => o.id !== id));
  };

  const sourceDraftAdd = () => {
    const id = `source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setSourceOptionsDraft((prev) => [...prev, { id, label: 'مصدر جديد' }]);
  };

  const openSourceQuickAdd = (open: boolean) => {
    setIsSourceQuickAddOpen(open);
    if (!open) {
      setSourceQuickAddValue('');
      setSourceQuickAddError('');
    }
  };

  const submitSourceQuickAdd: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const value = sourceQuickAddValue.trim();
    if (!value) {
      setSourceQuickAddError('الرجاء إدخال اسم المصدر.');
      return;
    }
    if (fabricSourceOptions.some((o) => o.label === value)) {
      setSourceQuickAddError('هذا المصدر موجود بالفعل.');
      return;
    }
    const option = { id: `source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label: value };
    setFabricSourceOptions((prev) => {
      const next = [...prev, option];
      try { designSettings.setOptions('fabricSource', next as any); } catch {}
      return next;
    });
    setSelectedFabricSource(option.id);
    try { designSettings.setSelectedId('fabricSource', option.id); } catch {}
    openSourceQuickAdd(false);
  };

  // Helper functions for bunija options
  const openBunijaManager = (open: boolean) => {
    setIsBunijaManagerOpen(open);
    if (open) {
      setBunijaOptionsDraft(bunijaOptions.map((o) => ({ ...o })));
      setBunijaManagerError('');
    }
  };

  const submitBunijaOptions: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const cleaned = bunijaOptionsDraft.map((o) => ({ ...o, label: o.label.trim() })).filter((o) => o.label !== '');
    const labels = cleaned.map((o) => o.label);
    if (new Set(labels).size !== labels.length) {
      setBunijaManagerError('الرجاء عدم تكرار أسماء الأنواع.');
      return;
    }
    setBunijaOptions(cleaned);
    try { designSettings.setOptions('bunijaType', cleaned as any); } catch {}
    // Clear selection if the selected option was removed
    if (selectedBunijaOption && !cleaned.some(o => o.id === selectedBunijaOption)) {
      setSelectedBunijaOption('');
    }
    setIsBunijaManagerOpen(false);
  };

  const bunijaDraftLabelChange = (id: string, label: string) => {
    setBunijaOptionsDraft((prev) => prev.map((o) => (o.id === id ? { ...o, label } : o)));
  };

  const bunijaDraftDelete = (id: string) => {
    setBunijaOptionsDraft((prev) => prev.filter((o) => o.id !== id));
  };

  const bunijaDraftAdd = () => {
    const id = `bunija-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setBunijaOptionsDraft((prev) => [...prev, { id, label: 'نوع جديد' }]);
  };

  const openBunijaQuickAdd = (open: boolean) => {
    setIsBunijaQuickAddOpen(open);
    if (!open) {
      setBunijaQuickAddValue('');
      setBunijaQuickAddError('');
    }
  };

  const submitBunijaQuickAdd: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const value = bunijaQuickAddValue.trim();
    if (!value) {
      setBunijaQuickAddError('الرجاء إدخال اسم النوع.');
      return;
    }
    if (bunijaOptions.some((o) => o.label === value)) {
      setBunijaQuickAddError('هذا النوع موجود بالفعل.');
      return;
    }
    const option = { id: `bunija-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label: value };
    setBunijaOptions((prev) => {
      const next = [...prev, option];
      try { designSettings.setOptions('bunijaType', next as any); } catch {}
      return next;
    });
    setSelectedBunijaOption(option.id);
    try { designSettings.setSelectedId('bunijaType', option.id); } catch {}
    openBunijaQuickAdd(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 z-[999] bg-[#000000]" />
      <DialogContent fullScreen className="bg-[#F6E9CA] flex flex-col">
        <DialogHeader className="flex-shrink-0 relative pr-24 pt-4 pb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 h-8 w-8 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-100 text-gray-600 hover:text-gray-800 z-10"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="pr-10">
            <DialogTitle className="text-[#13312A] arabic-text text-lg font-bold">إنشاء فاتورة جديدة</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text text-sm mt-1">
              أدخل بيانات الزبون والطلب لإصدار الفاتورة
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#4A5568] scrollbar-track-[#2D3748] hover:scrollbar-thumb-[#718096]" dir="rtl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* الصف الأول: بيانات الزبون، القياسات، ملاحظات */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 min-w-0">
            {/* Customer Information */}
            <Card className="bg-white border-[#E6D9C4] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-w-0 flex flex-col">
              <CardHeader className="py-0.5 border-b border-[#EEE1CD] min-h-[24px]">
                <CardTitle className="text-[#1F4529] arabic-text text-base font-bold">بيانات الزبون</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 py-1 flex-1 min-w-0">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[#13312A] arabic-text text-xs">اسم الزبون *</Label>
                    <Input 
                      placeholder="أدخل اسم الزبون" 
                      className="bg-white border-[#C69A72] text-right h-7 text-xs w-full min-w-0"
                      value={formData.customerName}
                      readOnly={!!lockCustomerFields}
                      disabled={!!lockCustomerFields}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-[#13312A] arabic-text text-xs">رقم الهاتف *</Label>
                    <Input 
                      placeholder="077xxxxxxxx" 
                      className="bg-white border-[#C69A72] text-right h-7 text-xs w-full min-w-0"
                      value={formData.customerPhone}
                      readOnly={!!lockCustomerFields}
                      disabled={!!lockCustomerFields}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text text-xs">العنوان</Label>
                  <Input 
                    placeholder="أدخل العنوان" 
                    className="bg-white border-[#C69A72] text-right h-7 text-xs w-full min-w-0"
                    value={formData.customerAddress}
                    readOnly={!!lockCustomerFields}
                    disabled={!!lockCustomerFields}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Measurements */}
            <Card className="bg-white border-[#E6D9C4] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-w-0 flex flex-col">
              <CardHeader className="py-0.5 border-b border-[#EEE1CD] min-h-[24px]">
                <CardTitle className="text-[#1F4529] arabic-text text-base font-bold">القياسات</CardTitle>
              </CardHeader>
              <CardContent className="py-1 flex-1 min-w-0">
                {/* الصف الأول: الطول، الكتف، الردن - 3 أعمدة */}
                <div className="measurements-grid-3 gap-1 mb-2 min-w-0">
                  <div className="space-y-1 min-w-0 flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">الطول (سم)</Label>
                    <Input 
                      type="text"
                      placeholder="0"
                      className="bg-white border-[#C69A72] text-right h-7 text-xs w-full min-w-0"
                      value={formData.measurements?.length || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        measurements: { ...prev.measurements!, length: e.target.value }
                      }))}
                      onFocus={handleFocus}
                    />
                  </div>
                  <div className="space-y-1 min-w-0 flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">الكتف (سم)</Label>
                    <Input 
                      type="text"
                      placeholder="0"
                      className="bg-white border-[#C69A72] text-right h-7 text-xs w-full min-w-0"
                      value={formData.measurements?.shoulder || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        measurements: { ...prev.measurements!, shoulder: e.target.value }
                      }))}
                      onFocus={handleFocus}
                    />
                  </div>
                  <div className="space-y-1 min-w-0 flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">الردن (سم)</Label>
                    <Input 
                      type="text"
                      placeholder="0"
                      className="bg-white border-[#C69A72] text-right h-7 text-xs w-full min-w-0"
                      value={formData.measurements?.waist || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        measurements: { ...prev.measurements!, waist: e.target.value }
                      }))}
                      onFocus={handleFocus}
                    />
                  </div>
                </div>
                {/* الصف الثاني: الصدر، الياخة - 2 أعمدة */}
                <div className="measurements-grid-2 gap-1 min-w-0">
                  <div className="space-y-1 min-w-0 flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">الصدر (سم)</Label>
                    <Input 
                      type="text"
                      placeholder="0"
                      className="bg-white border-[#C69A72] text-right h-7 text-xs w-full min-w-0"
                      value={formData.measurements?.chest || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        measurements: { ...prev.measurements!, chest: e.target.value }
                      }))}
                      onFocus={handleFocus}
                    />
                  </div>
                  <div className="space-y-1 min-w-0 flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">الياخة (سم)</Label>
                    <Input 
                      type="text"
                      placeholder="0"
                      className="bg-white border-[#C69A72] text-right h-7 text-xs w-full min-w-0"
                      value={formData.measurements?.collar || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        measurements: { ...prev.measurements!, collar: e.target.value }
                      }))}
                      onFocus={handleFocus}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card className="bg-white border-[#E6D9C4] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-w-0 flex flex-col">
              <CardHeader className="py-0.5 border-b border-[#EEE1CD] min-h-[24px]">
                <CardTitle className="text-[#1F4529] arabic-text text-base font-bold">ملاحظات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 py-1 flex-1 min-w-0">
                <div>
                  <Label className="text-[#13312A] arabic-text text-xs">ملاحظات إضافية</Label>
                  <Textarea 
                    placeholder="أي ملاحظات إضافية..."
                    className="bg-white border-[#C69A72] text-right text-xs h-16 w-full min-w-0 resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-[#13312A] arabic-text text-xs">تاريخ التسليم</Label>
                  <Input 
                    type="date"
                    className="bg-white border-[#C69A72] text-right h-7 text-xs w-full min-w-0"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* الصف الثاني: تفاصيل التصميم، معلومات الدفع، صورة القماش */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 min-w-0">
            {/* Design Details Section */}
            <Card className="bg-white border-[#E6D9C4] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-w-0 flex flex-col">
              <CardHeader className="py-0.5 border-b border-[#EEE1CD] min-h-[24px]">
                <CardTitle className="text-[#1F4529] arabic-text text-base font-bold">تفاصيل التصميم</CardTitle>
              </CardHeader>
              <CardContent className="py-1 flex-1 min-w-0">
                {/* الصف الأول: نوع القماش، مصدر القماش، نوع الياخة - 3 أعمدة */}
                <div className="measurements-grid-3 gap-1 mb-2 min-w-0">
                  <div className="min-w-[120px] flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">نوع القماش</Label>
                    <Popover open={isFabricPopoverOpen} onOpenChange={setIsFabricPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full justify-between bg-white border-[#C69A72] text-[#155446] arabic-text h-7 text-xs',
                            !selectedFabricLabel && 'text-muted-foreground',
                          )}
                        >
                          <span className="flex-1 text-right truncate">
                            {selectedFabricLabel || 'اختر نوع القماش'}
                          </span>
                          <ChevronDown className="ml-2 h-3 w-3 shrink-0" />
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
                              const isSelected = selectedFabricOption === option.id;
                              return (
                                <CommandItem
                                  key={option.id}
                                  value={option.label}
                                  onSelect={() => {
                                    selectFabricOption(option.id);
                                    setIsFabricPopoverOpen(false);
                                  }}
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
                  <div className="min-w-[120px] flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">مصدر القماش</Label>
                    <Popover open={isSourcePopoverOpen} onOpenChange={setIsSourcePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full justify-between bg-white border-[#C69A72] text-[#155446] arabic-text h-7 text-xs',
                            !selectedFabricSource && 'text-muted-foreground',
                          )}
                        >
                          <span className="flex-1 text-right truncate">
                            {selectedFabricSource 
                              ? fabricSourceOptions.find(o => o.id === selectedFabricSource)?.label || ''
                              : 'اختر مصدر القماش'}
                          </span>
                          <ChevronDown className="ml-2 h-3 w-3 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0 bg-[#F6E9CA] border-[#C69A72]">
                        <Command className="arabic-text text-right">
                          <CommandInput placeholder="ابحث عن مصدر القماش..." className="text-right" />
                          <CommandList className="text-right">
                            <CommandEmpty>لا توجد مصادر مطابقة</CommandEmpty>
                            <CommandItem
                              value="add-new"
                              onSelect={() => {
                                setIsSourcePopoverOpen(false);
                                openSourceQuickAdd(true);
                              }}
                              className="flex flex-row-reverse items-center justify-end gap-2 text-[#155446]"
                            >
                              <Plus className="h-4 w-4" />
                              <span>إضافة مصدر جديد</span>
                            </CommandItem>
                            <CommandSeparator className="bg-[#C69A72]/50" />
                            {fabricSourceOptions.map((option) => {
                              const isSelected = selectedFabricSource === option.id;
                              return (
                                <CommandItem
                                  key={option.id}
                                  value={option.label}
                                  onSelect={() => {
                                    selectFabricSource(option.id);
                                    setIsSourcePopoverOpen(false);
                                  }}
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
                                setIsSourcePopoverOpen(false);
                                openSourceManager(true);
                              }}
                              className="w-full flex-row-reverse justify-center text-[#155446]"
                            >
                              <Pencil className="h-4 w-4" />
                              تعديل المصادر
                            </Button>
                          </div>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="min-w-[120px] flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">نوع الياخة</Label>
                    <Popover open={isCollarPopoverOpen} onOpenChange={setIsCollarPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full justify-between bg-white border-[#C69A72] text-[#155446] arabic-text h-7 text-xs',
                            !selectedCollarOption && 'text-muted-foreground',
                          )}
                        >
                          <span className="flex-1 text-right truncate">
                            {selectedCollarOption 
                              ? collarOptions.find(o => o.id === selectedCollarOption)?.label || ''
                              : 'اختر نوع الياخة'}
                          </span>
                          <ChevronDown className="ml-2 h-3 w-3 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0 bg-[#F6E9CA] border-[#C69A72]">
                        <Command className="arabic-text text-right">
                          <CommandInput placeholder="ابحث عن نوع الياخة..." className="text-right" />
                          <CommandList className="text-right">
                            <CommandEmpty>لا توجد أنواع مطابقة</CommandEmpty>
                            <CommandItem
                              value="add-new"
                              onSelect={() => {
                                setIsCollarPopoverOpen(false);
                                openCollarQuickAdd(true);
                              }}
                              className="flex flex-row-reverse items-center justify-end gap-2 text-[#155446]"
                            >
                              <Plus className="h-4 w-4" />
                              <span>إضافة نوع جديد</span>
                            </CommandItem>
                            <CommandSeparator className="bg-[#C69A72]/50" />
                            {collarOptions.map((option) => {
                              const isSelected = selectedCollarOption === option.id;
                              return (
                                <CommandItem
                                  key={option.id}
                                  value={option.label}
                                  onSelect={() => {
                                    selectCollarOption(option.id);
                                    setIsCollarPopoverOpen(false);
                                  }}
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
                                setIsCollarPopoverOpen(false);
                                openCollarManager(true);
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
                </div>
                {/* الصف الثاني: أسلوب الصدر، نهاية الردن، نوع البنيجة - 3 أعمدة */}
                <div className="measurements-grid-3 gap-2 min-w-0">
                  <div className="min-w-[120px] flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">أسلوب الصدر</Label>
                    <Popover open={isChestStylePopoverOpen} onOpenChange={setIsChestStylePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full justify-between bg-white border-[#C69A72] text-[#155446] arabic-text h-7 text-xs',
                            !selectedChestStyleOption && 'text-muted-foreground',
                          )}
                        >
                          <span className="flex-1 text-right truncate">
                            {selectedChestStyleOption 
                              ? chestStyleOptions.find(o => o.id === selectedChestStyleOption)?.label || ''
                              : 'اختر أسلوب الصدر'}
                          </span>
                          <ChevronDown className="ml-2 h-3 w-3 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0 bg-[#F6E9CA] border-[#C69A72]">
                        <Command className="arabic-text text-right">
                          <CommandInput placeholder="ابحث عن أسلوب الصدر..." className="text-right" />
                          <CommandList className="text-right">
                            <CommandEmpty>لا توجد أنماط مطابقة</CommandEmpty>
                            <CommandItem
                              value="add-new"
                              onSelect={() => {
                                setIsChestStylePopoverOpen(false);
                                openChestStyleQuickAdd(true);
                              }}
                              className="flex flex-row-reverse items-center justify-end gap-2 text-[#155446]"
                            >
                              <Plus className="h-4 w-4" />
                              <span>إضافة نمط جديد</span>
                            </CommandItem>
                            <CommandSeparator className="bg-[#C69A72]/50" />
                            {chestStyleOptions.map((option) => {
                              const isSelected = selectedChestStyleOption === option.id;
                              return (
                                <CommandItem
                                  key={option.id}
                                  value={option.label}
                                  onSelect={() => {
                                    selectChestStyleOption(option.id);
                                    setIsChestStylePopoverOpen(false);
                                  }}
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
                                setIsChestStylePopoverOpen(false);
                                openChestStyleManager(true);
                              }}
                              className="w-full flex-row-reverse justify-center text-[#155446]"
                            >
                              <Pencil className="h-4 w-4" />
                              تعديل الأنماط
                            </Button>
                          </div>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="min-w-[120px] flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">نهاية الردن</Label>
                    <Popover open={isSleeveEndPopoverOpen} onOpenChange={setIsSleeveEndPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full justify-between bg-white border-[#C69A72] text-[#155446] arabic-text h-7 text-xs',
                            !selectedSleeveEndOption && 'text-muted-foreground',
                          )}
                        >
                          <span className="flex-1 text-right truncate">
                            {selectedSleeveEndOption 
                              ? sleeveEndOptions.find(o => o.id === selectedSleeveEndOption)?.label || ''
                              : 'اختر نهاية الردن'}
                          </span>
                          <ChevronDown className="ml-2 h-3 w-3 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0 bg-[#F6E9CA] border-[#C69A72]">
                        <Command className="arabic-text text-right">
                          <CommandInput placeholder="ابحث عن نهاية الردن..." className="text-right" />
                          <CommandList className="text-right">
                            <CommandEmpty>لا توجد أنماط مطابقة</CommandEmpty>
                            <CommandItem
                              value="add-new"
                              onSelect={() => {
                                setIsSleeveEndPopoverOpen(false);
                                openSleeveEndQuickAdd(true);
                              }}
                              className="flex flex-row-reverse items-center justify-end gap-2 text-[#155446]"
                            >
                              <Plus className="h-4 w-4" />
                              <span>إضافة نمط جديد</span>
                            </CommandItem>
                            <CommandSeparator className="bg-[#C69A72]/50" />
                            {sleeveEndOptions.map((option) => {
                              const isSelected = selectedSleeveEndOption === option.id;
                              return (
                                <CommandItem
                                  key={option.id}
                                  value={option.label}
                                  onSelect={() => {
                                    selectSleeveEndOption(option.id);
                                    setIsSleeveEndPopoverOpen(false);
                                  }}
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
                                setIsSleeveEndPopoverOpen(false);
                                openSleeveEndManager(true);
                              }}
                              className="w-full flex-row-reverse justify-center text-[#155446]"
                            >
                              <Pencil className="h-4 w-4" />
                              تعديل الأنماط
                            </Button>
                          </div>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="min-w-[120px] flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">نوع البنيجة</Label>
                    <Popover open={isBunijaPopoverOpen} onOpenChange={setIsBunijaPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full justify-between bg-white border-[#C69A72] text-[#155446] arabic-text h-7 text-xs',
                            !selectedBunijaOption && 'text-muted-foreground',
                          )}
                        >
                          <span className="flex-1 text-right truncate">
                            {selectedBunijaOption 
                              ? bunijaOptions.find(o => o.id === selectedBunijaOption)?.label || ''
                              : 'اختر نوع البنيجة'}
                          </span>
                          <ChevronDown className="ml-2 h-3 w-3 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0 bg-[#F6E9CA] border-[#C69A72]">
                        <Command className="arabic-text text-right">
                          <CommandInput placeholder="ابحث عن نوع البنيجة..." className="text-right" />
                          <CommandList className="text-right">
                            <CommandEmpty>لا توجد أنواع مطابقة</CommandEmpty>
                            <CommandItem
                              value="add-new"
                              onSelect={() => {
                                setIsBunijaPopoverOpen(false);
                                openBunijaQuickAdd(true);
                              }}
                              className="flex flex-row-reverse items-center justify-end gap-2 text-[#155446]"
                            >
                              <Plus className="h-4 w-4" />
                              <span>إضافة نوع جديد</span>
                            </CommandItem>
                            <CommandSeparator className="bg-[#C69A72]/50" />
                            {bunijaOptions.map((option) => {
                              const isSelected = selectedBunijaOption === option.id;
                              return (
                                <CommandItem
                                  key={option.id}
                                  value={option.label}
                                  onSelect={() => {
                                    selectBunijaOption(option.id);
                                    setIsBunijaPopoverOpen(false);
                                  }}
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
                                setIsBunijaPopoverOpen(false);
                                openBunijaManager(true);
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
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card className="bg-white border-[#E6D9C4] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-w-0 flex flex-col">
              <CardHeader className="py-0.5 border-b border-[#EEE1CD] min-h-[24px]">
                <CardTitle className="text-[#1F4529] arabic-text text-base font-bold">معلومات الدفع</CardTitle>
              </CardHeader>
              <CardContent className="py-1 flex-1 min-w-0">
                {/* الصف الأول: المجموع، المدفوع، المتبقي - 3 أعمدة */}
                <div className="measurements-grid-3 gap-2 mb-2 min-w-0">
                  <div className="space-y-1 min-w-[120px] flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">المجموع</Label>
                    <Input 
                      type="number"
                      placeholder="0"
                      className="bg-white border-[#C69A72] text-right h-7 text-xs w-full"
                      value={formData.total}
                      onChange={(e) => setFormData(prev => ({ ...prev, total: Number(e.target.value) }))}
                      onFocus={handleFocus}
                      onWheel={handleWheel}
                    />
                  </div>
                  <div className="space-y-1 min-w-[120px] flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">المدفوع</Label>
                    <Input 
                      type="number"
                      placeholder="0"
                      className="bg-white border-[#C69A72] text-right h-7 text-xs w-full"
                      value={formData.paidAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: Number(e.target.value) }))}
                      onFocus={handleFocus}
                      onWheel={handleWheel}
                    />
                  </div>
                  <div className="space-y-1 min-w-[120px] flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">المتبقي</Label>
                    <Input 
                      type="number"
                      placeholder="0"
                      className="bg-gray-50 border-[#C69A72] text-right h-7 text-xs w-full"
                      value={remainingAmount}
                      readOnly
                    />
                  </div>
                </div>
                {/* الصف الثاني: تاريخ الدفع، الحالة - 2 أعمدة */}
                <div className="measurements-grid-2 gap-2 min-w-0">
                  <div className="space-y-1 min-w-[120px] flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">تاريخ الدفع</Label>
                    <Input 
                      type="date"
                      className="bg-white border-[#C69A72] text-right h-7 text-xs w-full"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 min-w-[120px] flex-shrink-0">
                    <Label className="text-[#13312A] arabic-text text-xs">الحالة</Label>
                    <Input 
                      type="text"
                      className="bg-gray-50 border-[#C69A72] text-right h-7 text-xs w-full"
                      value={formData.status}
                      readOnly
                    />
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium text-center ${
                  formData.status === 'مدفوع' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : formData.status === 'جزئي'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {formData.status === 'مدفوع' && '✓ مدفوع بالكامل'}
                  {formData.status === 'جزئي' && '⚠ مدفوع جزئياً'}
                  {formData.status === 'معلق' && '✗ غير مدفوع'}
                </div>
              </CardContent>
            </Card>

            {/* Fabric Image Upload Section - Compact */}
            <Card className="bg-white border-[#E6D9C4] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-w-0 flex flex-col">
              <CardHeader className="py-0.5 border-b border-[#EEE1CD] min-h-[24px] flex justify-between items-center">
                <CardTitle className="text-[#1F4529] arabic-text text-base font-bold">صورة القماش</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
                  disabled={cameraAvailable === false}
                  onClick={async () => {
                    setCameraError(null);
                    setIsCameraOpen(true);
                    
                    // First check if camera is available
                    const availability = await checkCameraAvailability();
                    if (!availability.available) {
                      setCameraError(availability.message || 'لا يمكن الوصول للكاميرا.');
                      return;
                    }
                    
                    try {
                      // Try to get camera stream with optimal constraints
                      const constraints: MediaStreamConstraints = {
                        video: { 
                          facingMode: { ideal: 'environment' },
                          width: { ideal: 1280, min: 640 },
                          height: { ideal: 720, min: 480 },
                          frameRate: { ideal: 30, min: 15 }
                        },
                        audio: false,
                      };
                      
                      const stream = await navigator.mediaDevices.getUserMedia(constraints);
                      if (videoRef.current) {
                        videoRef.current.srcObject = stream as any;
                        await videoRef.current.play();
                      }
                    } catch (err) {
                      console.error('Camera access error:', err);
                      setCameraError(getCameraErrorMessage(err));
                    }
                  }}
                >
                  <Camera className="h-3 w-3" />
                  <span className="arabic-text text-xs">
                    {cameraAvailable === false ? 'الكاميرا غير متاحة' : 'فتح الكاميرا'}
                  </span>
                </Button>
              </CardHeader>
              <CardContent className="py-2 flex-1 min-w-0">
                <div>
                  <Label className="text-[#13312A] arabic-text text-xs">صورة القماش</Label>
                  <p className="text-xs text-gray-500 mb-2">اختر صورة القماش</p>
                  <div className="max-h-[80px] overflow-hidden rounded-md border border-[#C69A72]/40">
                    <ImageUpload
                      onImageChange={(imageData, file) => {
                        console.log('NewInvoiceDialog - onImageChange called with:', {
                          imageData: imageData ? 'data available' : 'null',
                          file: file ? { name: file.name, size: file.size, type: file.type } : 'null'
                        });
                        setFabricImage(imageData);
                        if (file) {
                          const renamed = new File([file], 'fabric.jpg', { type: file.type || 'image/jpeg' });
                          console.log('NewInvoiceDialog - Setting fabricImageFile:', { name: renamed.name, size: renamed.size, type: renamed.type });
                          setFabricImageFile(renamed);
                        } else {
                          console.log('NewInvoiceDialog - Clearing fabricImageFile');
                          setFabricImageFile(null);
                        }
                      }}
                      currentImage={fabricImage}
                      maxSize={2}
                      maxWidth={300}
                      maxHeight={200}
                      quality={0.8}
                    />
                  </div>
              </div>
            </CardContent>
            </Card>
          </div>

          {/* Error Display */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{submitError}</p>
            </div>
          )}
        </form>
        </div>

        {/* Dialog Footer - Fixed at bottom */}
        <DialogFooter className="flex-shrink-0 sticky bottom-0 left-0 right-0 flex gap-2 pt-3 pb-3 px-4 border-t border-[#4A5568] bg-[#2D3748]">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
            >
              إلغاء
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            onClick={handleSubmit}
              className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
            </Button>
          </DialogFooter>
      </DialogContent>

      {/* Camera Capture Dialog */}
      <Dialog open={isCameraOpen} onOpenChange={(open: boolean) => {
        setIsCameraOpen(open);
        if (!open) {
          // Stop camera tracks when closing
          stopCameraStream();
        }
      }}>
        <DialogOverlay className="fixed inset-0 z-[1100] bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-md bg-[#F6E9CA] border-[#C69A72] rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text">التقاط صورة القماش</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text">اسمح للكاميرا ثم التقط الصورة</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {cameraError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-red-600 text-sm arabic-text">{cameraError}</div>
                </div>
                <div className="mt-2 text-xs text-red-500 arabic-text">
                  يمكنك استخدام زر "رفع صورة" كبديل لالتقاط الصور من الكاميرا.
                </div>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setCameraError(null);
                      const availability = await checkCameraAvailability();
                      setCameraAvailable(availability.available);
                      if (!availability.available) {
                        setCameraError(availability.message || 'لا يمكن الوصول للكاميرا.');
                      }
                    }}
                    className="text-xs border-red-300 text-red-600 hover:bg-red-100"
                  >
                    إعادة المحاولة
                  </Button>
                </div>
              </div>
            )}
            <div className="w-full aspect-video bg-black/30 rounded-lg overflow-hidden flex items-center justify-center">
              <video ref={videoRef} playsInline className="w-full h-full object-contain" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCameraOpen(false)}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
              >
                إلغاء
              </Button>
              <Button
                type="button"
                disabled={isCapturing}
                onClick={async () => {
                  if (!videoRef.current) return;
                  try {
                    setIsCapturing(true);
                    const video = videoRef.current;
                    const width = video.videoWidth || 800;
                    const height = video.videoHeight || 600;
                    if (canvasRef.current) {
                      const canvas = canvasRef.current;
                      canvas.width = width;
                      canvas.height = height;
                      const ctx = canvas.getContext('2d');
                      ctx?.drawImage(video, 0, 0, width, height);
                      canvas.toBlob(async (blob) => {
                        if (!blob) {
                          setCameraError('فشل التقاط الصورة.');
                          setIsCapturing(false);
                          return;
                        }
                        const file = new File([blob], 'fabric-camera.jpg', { type: 'image/jpeg' });
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                        setFabricImage(dataUrl);
                        setFabricImageFile(file);
                        setIsCameraOpen(false);
                        // Stop tracks
                        const stream = videoRef.current?.srcObject as MediaStream | undefined;
                        stream?.getTracks().forEach(t => t.stop());
                        if (videoRef.current) {
                          videoRef.current.srcObject = null;
                        }
                        setIsCapturing(false);
                      }, 'image/jpeg', 0.9);
                    }
                  } catch (err) {
                    setCameraError('حدث خطأ أثناء الالتقاط.');
                    setIsCapturing(false);
                  }
                }}
                className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]"
              >
                {isCapturing ? 'جاري الالتقاط...' : 'التقاط الصورة'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fabric Manager Dialog - Compact */}
      <Dialog open={isFabricManagerOpen} onOpenChange={handleFabricManagerOpenChange}>
        <DialogOverlay className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-md bg-[#F6E9CA] border-[#C69A72] rounded-xl shadow-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-[#13312A] arabic-text text-lg">تعديل أنواع القماش</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text text-sm">
              قم بإضافة أو تعديل أو حذف أنواع القماش
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFabricOptionsSubmit} className="space-y-3">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#C69A72] scrollbar-track-[#F6E9CA]">
              {fabricOptionsDraft.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(event) => handleDraftLabelChange(option.id, event.target.value)}
                    className="flex-1 bg-white border-[#C69A72] text-right text-sm h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDraftDelete(option.id)}
                    className="text-red-600 hover:bg-red-100 h-8 w-8"
                    aria-label="حذف النوع"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {fabricOptionsDraft.length === 0 && (
                <p className="text-xs text-[#155446] arabic-text text-center py-4">
                  لا توجد أنواع حالياً، أضف نوعاً جديداً للبدء.
                </p>
              )}
            </div>
            {fabricManagerError && (
              <p className="text-xs text-red-600 arabic-text text-right">{fabricManagerError}</p>
            )}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#C69A72]/30">
              <Button
                type="button"
                variant="outline"
                onClick={handleDraftAdd}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
              >
                إضافة نوع
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFabricManagerOpen(false)}
                  className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] text-sm h-8">
                  حفظ
                </Button>
              </div>
            </div>
        </form>
      </DialogContent>
      </Dialog>

      {/* Quick Add Dialog - Compact */}
      <Dialog open={isQuickAddDialogOpen} onOpenChange={handleQuickAddDialogOpenChange}>
        <DialogOverlay className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-sm bg-[#F6E9CA] border-[#C69A72] rounded-xl shadow-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-[#13312A] arabic-text text-lg">إضافة نوع قماش جديد</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text text-sm">
              أضف نوعاً جديداً للقائمة
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickAddSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label className="text-[#13312A] arabic-text text-sm" htmlFor="new-fabric-option">
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
                className="bg-white border-[#C69A72] text-right text-sm h-8"
                placeholder="أدخل اسم النوع الجديد"
              />
              {quickAddError && (
                <p className="text-xs text-red-600 arabic-text text-right">{quickAddError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#C69A72]/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickAddDialogOpenChange(false)}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
              >
                إلغاء
              </Button>
              <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] text-sm h-8">
                حفظ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Collar Manager Dialog - Compact */}
      <Dialog open={isCollarManagerOpen} onOpenChange={openCollarManager}>
        <DialogOverlay className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-md bg-[#F6E9CA] border-[#C69A72] rounded-xl shadow-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-[#13312A] arabic-text text-lg">تعديل أنواع الياخة</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text text-sm">
              قم بإضافة أو تعديل أو حذف أنواع الياخة
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCollarOptions} className="space-y-3">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#C69A72] scrollbar-track-[#F6E9CA]">
              {collarOptionsDraft.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(event) => collarDraftLabelChange(option.id, event.target.value)}
                    className="flex-1 bg-white border-[#C69A72] text-right text-sm h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => collarDraftDelete(option.id)}
                    className="text-red-600 hover:bg-red-100 h-8 w-8"
                    aria-label="حذف النوع"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {collarOptionsDraft.length === 0 && (
                <p className="text-xs text-[#155446] arabic-text text-center py-4">
                  لا توجد أنواع حالياً، أضف نوعاً جديداً للبدء.
                </p>
              )}
            </div>
            {collarManagerError && (
              <p className="text-xs text-red-600 arabic-text text-right">{collarManagerError}</p>
            )}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#C69A72]/30">
              <Button
                type="button"
                variant="outline"
                onClick={collarDraftAdd}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
              >
                إضافة نوع
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openCollarManager(false)}
                  className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] text-sm h-8">
                  حفظ
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Collar Quick Add Dialog - Compact */}
      <Dialog open={isCollarQuickAddOpen} onOpenChange={openCollarQuickAdd}>
        <DialogOverlay className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-sm bg-[#F6E9CA] border-[#C69A72] rounded-xl shadow-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-[#13312A] arabic-text text-lg">إضافة نوع ياخة جديد</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text text-sm">
              أضف نوعاً جديداً للقائمة
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCollarQuickAdd} className="space-y-3">
            <div className="space-y-2">
              <Label className="text-[#13312A] arabic-text text-sm" htmlFor="new-collar-option">
                اسم النوع
              </Label>
              <Input
                id="new-collar-option"
                value={collarQuickAddValue}
                onChange={(event) => {
                  setCollarQuickAddValue(event.target.value);
                  if (collarQuickAddError) {
                    setCollarQuickAddError('');
                  }
                }}
                className="bg-white border-[#C69A72] text-right text-sm h-8"
                placeholder="أدخل اسم النوع الجديد"
              />
              {collarQuickAddError && (
                <p className="text-xs text-red-600 arabic-text text-right">{collarQuickAddError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#C69A72]/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => openCollarQuickAdd(false)}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
              >
                إلغاء
              </Button>
              <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] text-sm h-8">
                حفظ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Chest Style Manager Dialog - Compact */}
      <Dialog open={isChestStyleManagerOpen} onOpenChange={openChestStyleManager}>
        <DialogOverlay className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-md bg-[#F6E9CA] border-[#C69A72] rounded-xl shadow-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-[#13312A] arabic-text text-lg">تعديل أنماط الصدر</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text text-sm">
              قم بإضافة أو تعديل أو حذف أنماط الصدر
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitChestStyleOptions} className="space-y-3">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#C69A72] scrollbar-track-[#F6E9CA]">
              {chestStyleOptionsDraft.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(event) => chestStyleDraftLabelChange(option.id, event.target.value)}
                    className="flex-1 bg-white border-[#C69A72] text-right text-sm h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => chestStyleDraftDelete(option.id)}
                    className="text-red-600 hover:bg-red-100 h-8 w-8"
                    aria-label="حذف النوع"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {chestStyleOptionsDraft.length === 0 && (
                <p className="text-xs text-[#155446] arabic-text text-center py-4">
                  لا توجد أنماط حالياً، أضف نمطاً جديداً للبدء.
                </p>
              )}
            </div>
            {chestStyleManagerError && (
              <p className="text-xs text-red-600 arabic-text text-right">{chestStyleManagerError}</p>
            )}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#C69A72]/30">
              <Button
                type="button"
                variant="outline"
                onClick={chestStyleDraftAdd}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
              >
                إضافة نمط
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openChestStyleManager(false)}
                  className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] text-sm h-8">
                  حفظ
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Chest Style Quick Add Dialog - Compact */}
      <Dialog open={isChestStyleQuickAddOpen} onOpenChange={openChestStyleQuickAdd}>
        <DialogOverlay className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-sm bg-[#F6E9CA] border-[#C69A72] rounded-xl shadow-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-[#13312A] arabic-text text-lg">إضافة نمط صدر جديد</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text text-sm">
              أضف نمطاً جديداً للقائمة
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitChestStyleQuickAdd} className="space-y-3">
            <div className="space-y-2">
              <Label className="text-[#13312A] arabic-text text-sm" htmlFor="new-chest-option">
                اسم النمط
              </Label>
              <Input
                id="new-chest-option"
                value={chestStyleQuickAddValue}
                onChange={(event) => {
                  setChestStyleQuickAddValue(event.target.value);
                  if (chestStyleQuickAddError) {
                    setChestStyleQuickAddError('');
                  }
                }}
                className="bg-white border-[#C69A72] text-right text-sm h-8"
                placeholder="أدخل اسم النمط الجديد"
              />
              {chestStyleQuickAddError && (
                <p className="text-xs text-red-600 arabic-text text-right">{chestStyleQuickAddError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#C69A72]/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => openChestStyleQuickAdd(false)}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
              >
                إلغاء
              </Button>
              <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] text-sm h-8">
                حفظ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sleeve End Manager Dialog - Compact */}
      <Dialog open={isSleeveEndManagerOpen} onOpenChange={openSleeveEndManager}>
        <DialogOverlay className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-md bg-[#F6E9CA] border-[#C69A72] rounded-xl shadow-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-[#13312A] arabic-text text-lg">تعديل أنماط نهاية الردن</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text text-sm">
              قم بإضافة أو تعديل أو حذف أنماط نهاية الردن
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitSleeveEndOptions} className="space-y-3">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#C69A72] scrollbar-track-[#F6E9CA]">
              {sleeveEndOptionsDraft.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(event) => sleeveEndDraftLabelChange(option.id, event.target.value)}
                    className="flex-1 bg-white border-[#C69A72] text-right text-sm h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => sleeveEndDraftDelete(option.id)}
                    className="text-red-600 hover:bg-red-100 h-8 w-8"
                    aria-label="حذف النوع"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {sleeveEndOptionsDraft.length === 0 && (
                <p className="text-xs text-[#155446] arabic-text text-center py-4">
                  لا توجد أنماط حالياً، أضف نمطاً جديداً للبدء.
                </p>
              )}
            </div>
            {sleeveEndManagerError && (
              <p className="text-xs text-red-600 arabic-text text-right">{sleeveEndManagerError}</p>
            )}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#C69A72]/30">
              <Button
                type="button"
                variant="outline"
                onClick={sleeveEndDraftAdd}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
              >
                إضافة نمط
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openSleeveEndManager(false)}
                  className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] text-sm h-8">
                  حفظ
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sleeve End Quick Add Dialog - Compact */}
      <Dialog open={isSleeveEndQuickAddOpen} onOpenChange={openSleeveEndQuickAdd}>
        <DialogOverlay className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-sm bg-[#F6E9CA] border-[#C69A72] rounded-xl shadow-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-[#13312A] arabic-text text-lg">إضافة نمط نهاية ردن جديد</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text text-sm">
              أضف نمطاً جديداً للقائمة
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitSleeveEndQuickAdd} className="space-y-3">
            <div className="space-y-2">
              <Label className="text-[#13312A] arabic-text text-sm" htmlFor="new-sleeve-option">
                اسم النمط
              </Label>
              <Input
                id="new-sleeve-option"
                value={sleeveEndQuickAddValue}
                onChange={(event) => {
                  setSleeveEndQuickAddValue(event.target.value);
                  if (sleeveEndQuickAddError) {
                    setSleeveEndQuickAddError('');
                  }
                }}
                className="bg-white border-[#C69A72] text-right text-sm h-8"
                placeholder="أدخل اسم النمط الجديد"
              />
              {sleeveEndQuickAddError && (
                <p className="text-xs text-red-600 arabic-text text-right">{sleeveEndQuickAddError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#C69A72]/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => openSleeveEndQuickAdd(false)}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
              >
                إلغاء
              </Button>
              <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] text-sm h-8">
                حفظ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Source Manager Dialog - Compact */}
      <Dialog open={isSourceManagerOpen} onOpenChange={openSourceManager}>
        <DialogOverlay className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-md bg-[#F6E9CA] border-[#C69A72] rounded-xl shadow-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-[#13312A] arabic-text text-lg">تعديل مصادر القماش</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text text-sm">
              قم بإضافة أو تعديل أو حذف مصادر القماش
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitSourceOptions} className="space-y-3">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#C69A72] scrollbar-track-[#F6E9CA]">
              {sourceOptionsDraft.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(event) => sourceDraftLabelChange(option.id, event.target.value)}
                    className="flex-1 bg-white border-[#C69A72] text-right text-sm h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => sourceDraftDelete(option.id)}
                    className="text-red-600 hover:bg-red-100 h-8 w-8"
                    aria-label="حذف المصدر"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {sourceOptionsDraft.length === 0 && (
                <p className="text-xs text-[#155446] arabic-text text-center py-4">
                  لا توجد مصادر حالياً، أضف مصدراً جديداً للبدء.
                </p>
              )}
            </div>
            {sourceManagerError && (
              <p className="text-xs text-red-600 arabic-text text-right">{sourceManagerError}</p>
            )}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#C69A72]/30">
              <Button
                type="button"
                variant="outline"
                onClick={sourceDraftAdd}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
              >
                إضافة مصدر
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openSourceManager(false)}
                  className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] text-sm h-8">
                  حفظ
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Source Quick Add Dialog - Compact */}
      <Dialog open={isSourceQuickAddOpen} onOpenChange={openSourceQuickAdd}>
        <DialogOverlay className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-sm bg-[#F6E9CA] border-[#C69A72] rounded-xl shadow-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-[#13312A] arabic-text text-lg">إضافة مصدر قماش جديد</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text text-sm">
              أضف مصدراً جديداً للقائمة
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitSourceQuickAdd} className="space-y-3">
            <div className="space-y-2">
              <Label className="text-[#13312A] arabic-text text-sm" htmlFor="new-source-option">
                اسم المصدر
              </Label>
              <Input
                id="new-source-option"
                value={sourceQuickAddValue}
                onChange={(event) => {
                  setSourceQuickAddValue(event.target.value);
                  if (sourceQuickAddError) {
                    setSourceQuickAddError('');
                  }
                }}
                className="bg-white border-[#C69A72] text-right text-sm h-8"
                placeholder="أدخل اسم المصدر الجديد"
              />
              {sourceQuickAddError && (
                <p className="text-xs text-red-600 arabic-text text-right">{sourceQuickAddError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#C69A72]/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => openSourceQuickAdd(false)}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
              >
                إلغاء
              </Button>
              <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] text-sm h-8">
                حفظ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bunija Manager Dialog - Compact */}
      <Dialog open={isBunijaManagerOpen} onOpenChange={openBunijaManager}>
        <DialogOverlay className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-md bg-[#F6E9CA] border-[#C69A72] rounded-xl shadow-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-[#13312A] arabic-text text-lg">تعديل أنواع البنيجة</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text text-sm">
              قم بإضافة أو تعديل أو حذف أنواع البنيجة
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitBunijaOptions} className="space-y-3">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#C69A72] scrollbar-track-[#F6E9CA]">
              {bunijaOptionsDraft.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(event) => bunijaDraftLabelChange(option.id, event.target.value)}
                    className="flex-1 bg-white border-[#C69A72] text-right text-sm h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => bunijaDraftDelete(option.id)}
                    className="text-red-600 hover:bg-red-100 h-8 w-8"
                    aria-label="حذف النوع"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {bunijaOptionsDraft.length === 0 && (
                <p className="text-xs text-[#155446] arabic-text text-center py-4">
                  لا توجد أنواع حالياً، أضف نوعاً جديداً للبدء.
                </p>
              )}
            </div>
            {bunijaManagerError && (
              <p className="text-xs text-red-600 arabic-text text-right">{bunijaManagerError}</p>
            )}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#C69A72]/30">
              <Button
                type="button"
                variant="outline"
                onClick={bunijaDraftAdd}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
              >
                إضافة نوع
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openBunijaManager(false)}
                  className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] text-sm h-8">
                  حفظ
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bunija Quick Add Dialog - Compact */}
      <Dialog open={isBunijaQuickAddOpen} onOpenChange={openBunijaQuickAdd}>
        <DialogOverlay className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm" />
        <DialogContent className="max-w-sm bg-[#F6E9CA] border-[#C69A72] rounded-xl shadow-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-[#13312A] arabic-text text-lg">إضافة نوع بنيجة جديد</DialogTitle>
            <DialogDescription className="text-[#155446] arabic-text text-sm">
              أضف نوعاً جديداً للقائمة
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitBunijaQuickAdd} className="space-y-3">
            <div className="space-y-2">
              <Label className="text-[#13312A] arabic-text text-sm" htmlFor="new-bunija-option">
                اسم النوع
              </Label>
              <Input
                id="new-bunija-option"
                value={bunijaQuickAddValue}
                onChange={(event) => {
                  setBunijaQuickAddValue(event.target.value);
                  if (bunijaQuickAddError) {
                    setBunijaQuickAddError('');
                  }
                }}
                className="bg-white border-[#C69A72] text-right text-sm h-8"
                placeholder="أدخل اسم النوع الجديد"
              />
              {bunijaQuickAddError && (
                <p className="text-xs text-red-600 arabic-text text-right">{bunijaQuickAddError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#C69A72]/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => openBunijaQuickAdd(false)}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] text-sm h-8"
              >
                إلغاء
              </Button>
              <Button type="submit" className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] text-sm h-8">
                حفظ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
