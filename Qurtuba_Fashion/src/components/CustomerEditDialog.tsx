import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Customer } from "../types/customer";
import { databaseService } from "../db/database.service";
import { sanitizeArabicText } from "../utils/encoding";

interface CustomerEditDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (customer: Customer) => void;
}

const ensureMeasurements = (customer: Customer | null) => ({
  height: customer?.measurements?.height ?? 0,
  shoulder: customer?.measurements?.shoulder ?? 0,
  waist: customer?.measurements?.waist ?? 0,
  chest: customer?.measurements?.chest ?? 0,
  collar: customer?.measurements?.collar ?? 0,
});

export const CustomerEditDialog: React.FC<CustomerEditDialogProps> = ({
  customer,
  open,
  onOpenChange,
  onUpdated,
}) => {
  const [draft, setDraft] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [labelAuto, setLabelAuto] = useState<boolean>(true);
  const [manualLabel, setManualLabel] = useState<string>('Oï¿½O_USO_');

  useEffect(() => {
    if (open && customer) {
      setDraft({
        ...customer,
        measurements: ensureMeasurements(customer),
      });
      setLabelAuto(((customer as any)?.label_auto) !== false);
      setManualLabel(sanitizeArabicText(customer.label) || 'جديد');
    } else if (!open) {
      setDraft(null);
      setIsSaving(false);
      setLabelAuto(true);
      setManualLabel('جديد');
    }
  }, [open, customer]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;

    setIsSaving(true);
    try {
      const allCustomers = await databaseService.getCustomers();
      const matched = allCustomers.find((c: any) => {
        const cid = String((c as any).id || '');
        const cidNum = Number((c as any).id);
        const draftIdStr = typeof draft.id === 'number' ? String(draft.id) : String(draft.id || '');
        const draftIdNum = typeof draft.id === 'number' ? draft.id : Number(draft.id);
        if (cid && cid === draftIdStr) return true;
        if (Number.isFinite(cidNum) && Number.isFinite(draftIdNum) && cidNum === draftIdNum) return true;
        return (c.name || '').trim() === (draft.name || '').trim() &&
               (c.phone || '').trim() === (draft.phone || '').trim();
      });
      const targetId = matched ? String((matched as any).id) : (typeof draft.id === 'number' ? String(draft.id) : String(draft.id || ''));
      if (!targetId) {
        throw new Error('Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªØ­Ø¯ÙŠØ¯ Ù…Ø¹Ø±Ù Ø§Ù„Ø²Ø¨ÙˆÙ† Ù„Ù„ØªØ­Ø¯ÙŠØ«.');
      }

      const payload: any = { name: draft.name, phone: draft.phone, address: draft.address };
      if (labelAuto) { payload.label_auto = true; }
      else { payload.label = sanitizeArabicText(manualLabel); payload.label_auto = false; }
      const updated = await databaseService.updateCustomer(targetId, payload);

      try {
        const { queryClient } = await import("@/app/queryClient");
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      } catch (cacheError) {
        console.warn("Failed to invalidate customer caches:", cacheError);
      }

      onUpdated?.(updated as unknown as Customer);
      onOpenChange(false);
    } catch (err) {
      console.error("Error updating customer:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const updateMeasurement = (field: keyof NonNullable<Customer["measurements"]>, value: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        measurements: {
          ...ensureMeasurements(prev),
          [field]: value,
        },
      };
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setDraft(null);
          setIsSaving(false);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[85vh] bg-[#F6E9CA] border-[#C69A72] p-0 flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-[#13312A] arabic-text text-lg">ØªØ¹Ø¯ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø²Ø¨ÙˆÙ†</DialogTitle>
          <DialogDescription className="text-[#155446] arabic-text text-sm">
            Ø¹Ø¯Ù„ Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© Ø«Ù… Ø§Ø­ÙØ¸ Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª
          </DialogDescription>
        </DialogHeader>

        {draft ? (
          <>
            <div className="flex-1 overflow-y-auto px-4 pb-3" dir="rtl">
              <form id="customer-edit-form" className="space-y-3" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                  {/* Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© */}
                  <Card className="bg-white border-[#E6D9C4] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-w-0 flex flex-col">
                    <CardHeader className="py-0.5 border-b border-[#EEE1CD] min-h-[24px]">
                      <CardTitle className="text-[#1F4529] arabic-text text-base font-bold">Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 py-2 flex-1 min-w-0">
                      <div>
                        <Label className="text-[#13312A] arabic-text text-xs">Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„</Label>
                        <Input
                          className="bg-white border-[#C69A72] text-right h-8 text-sm w-full min-w-0"
                          value={draft.name}
                          onChange={(e) => setDraft({ ...(draft as Customer), name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[#13312A] arabic-text text-xs">Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ</Label>
                          <Input
                            className="bg-white border-[#C69A72] text-right h-8 text-sm w-full min-w-0"
                            value={draft.phone}
                            onChange={(e) => setDraft({ ...(draft as Customer), phone: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-[#13312A] arabic-text text-xs">Ø§Ù„Ø¹Ù†ÙˆØ§Ù†</Label>
                          <Input
                            className="bg-white border-[#C69A72] text-right h-8 text-sm w-full min-w-0"
                            value={draft.address || ""}
                            onChange={(e) => setDraft({ ...(draft as Customer), address: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        <div>
                          <Label className="text-[#13312A] arabic-text text-xs">ÙˆØ¶Ø¹ Ø§Ù„ØªØµÙ†ÙŠÙ</Label>
                          <Select value={labelAuto ? 'auto' : 'manual'} onValueChange={(v) => setLabelAuto(v === 'auto')}>
                            <SelectTrigger className="bg-white border-[#C69A72] text-right h-8 text-sm w-full min-w-0">
                              <SelectValue placeholder="Ø§Ø®ØªØ± ÙˆØ¶Ø¹ Ø§Ù„ØªØµÙ†ÙŠÙ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">ØªÙ„Ù‚Ø§Ø¦ÙŠ</SelectItem>
                              <SelectItem value="manual">ÙŠØ¯ÙˆÙŠ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[#13312A] arabic-text text-xs">ØµÙ†Ù Ø§Ù„Ø²Ø¨ÙˆÙ† (ÙŠØ¯ÙˆÙŠ)</Label>
                          <Select value={manualLabel} onValueChange={setManualLabel} disabled={labelAuto}>
                            <SelectTrigger className="bg-white border-[#C69A72] text-right h-8 text-sm w-full min-w-0">
                              <SelectValue placeholder="Ø§Ø®ØªØ± Ø§Ù„ØµÙ†Ù" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Oï¿½O_USO_">Ø¬Ø¯ÙŠØ¯</SelectItem>
                              <SelectItem value="U.U+Oï¿½O,U.">Ø§Ø¹ØªÙŠØ§Ø¯ÙŠ</SelectItem>
                              <SelectItem value="U^U?US">ÙˆÙÙŠ</SelectItem>
                              <SelectItem value='Oï¿½Uï¿½O"US'>Ø°Ù‡Ø¨ÙŠ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ø§Ù„Ù‚ÙŠØ§Ø³Ø§Øª */}
                  <Card className="hidden bg-white border-[#E6D9C4] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-w-0 flex flex-col">
                    <CardHeader className="py-0.5 border-b border-[#EEE1CD] min-h-[24px]">
                      <CardTitle className="text-[#1F4529] arabic-text text-base font-bold">Ø§Ù„Ù‚ÙŠØ§Ø³Ø§Øª (Ø³Ù…)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 py-2 flex-1 min-w-0">
                      <div className="grid grid-cols-3 gap-2 min-w-0">
                        <div className="min-w-[120px]">
                          <Label className="text-[#13312A] arabic-text text-xs">Ø§Ù„Ø·ÙˆÙ„</Label>
                          <Input
                            type="number"
                            className="bg-white border-[#C69A72] text-right min-w-0 h-8 text-sm"
                            value={draft.measurements?.height ?? 0}
                            readOnly
                            disabled
                          />
                        </div>
                        <div className="min-w-[120px]">
                          <Label className="text-[#13312A] arabic-text text-xs">Ø§Ù„ÙƒØªÙ</Label>
                          <Input
                            type="number"
                            className="bg-white border-[#C69A72] text-right min-w-0 h-8 text-sm"
                            value={draft.measurements?.shoulder ?? 0}
                            readOnly
                            disabled
                          />
                        </div>
                        <div className="min-w-[120px]">
                          <Label className="text-[#13312A] arabic-text text-xs">Ø§Ù„Ø±Ø¯Ù†</Label>
                          <Input
                            type="number"
                            className="bg-white border-[#C69A72] text-right min-w-0 h-8 text-sm"
                            value={draft.measurements?.waist ?? 0}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 min-w-0">
                        <div className="min-w-[120px]">
                          <Label className="text-[#13312A] arabic-text text-xs">Ø§Ù„ØµØ¯Ø±</Label>
                          <Input
                            type="number"
                            className="bg-white border-[#C69A72] text-right min-w-0 h-8 text-sm"
                            value={draft.measurements?.chest ?? 0}
                            readOnly
                            disabled
                          />
                        </div>
                        <div className="min-w-[120px]">
                          <Label className="text-[#13312A] arabic-text text-xs">Ø§Ù„ÙŠØ§Ø®Ø©</Label>
                          <Input
                            type="number"
                            className="bg-white border-[#C69A72] text-right min-w-0 h-8 text-sm"
                            value={draft.measurements?.collar ?? 0}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </form>
            </div>

            <div className="flex-shrink-0 px-4 py-3 flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
                disabled={isSaving}
              >
                Ø¥Ù„ØºØ§Ø¡
              </Button>
              <Button
                type="submit"
                form="customer-edit-form"
                className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]"
                disabled={isSaving}
              >
                {isSaving ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸..." : "Ø­ÙØ¸ Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª"}
              </Button>
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-[#155446] arabic-text">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ù…ØªØ§Ø­Ø©.</div>
        )}
      </DialogContent>
    </Dialog>
  );
};






