import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Check, ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../ui/utils';

interface FabricOption {
  id: string;
  label: string;
}

interface FabricSelectionProps {
  fabricOptions: FabricOption[];
  selectedFabricOptions: string[];
  onFabricOptionsChange: (options: FabricOption[]) => void;
  onSelectedFabricOptionsChange: (selected: string[]) => void;
  fabricSourceOptions: { id: string; label: string }[];
  selectedFabricSources: string[];
  onSelectedFabricSourcesChange: (selected: string[]) => void;
  isFabricPopoverOpen: boolean;
  onFabricPopoverOpenChange: (open: boolean) => void;
  isSourcePopoverOpen: boolean;
  onSourcePopoverOpenChange: (open: boolean) => void;
  isFabricManagerOpen: boolean;
  onFabricManagerOpenChange: (open: boolean) => void;
  fabricOptionsDraft: FabricOption[];
  onFabricOptionsDraftChange: (draft: FabricOption[]) => void;
  fabricManagerError: string;
  onFabricManagerErrorChange: (error: string) => void;
  isQuickAddDialogOpen: boolean;
  onQuickAddDialogOpenChange: (open: boolean) => void;
  quickAddValue: string;
  onQuickAddValueChange: (value: string) => void;
  quickAddError: string;
  onQuickAddErrorChange: (error: string) => void;
}

export function FabricSelection({
  fabricOptions,
  selectedFabricOptions,
  onFabricOptionsChange,
  onSelectedFabricOptionsChange,
  fabricSourceOptions,
  selectedFabricSources,
  onSelectedFabricSourcesChange,
  isFabricPopoverOpen,
  onFabricPopoverOpenChange,
  isSourcePopoverOpen,
  onSourcePopoverOpenChange,
  isFabricManagerOpen,
  onFabricManagerOpenChange,
  fabricOptionsDraft,
  onFabricOptionsDraftChange,
  fabricManagerError,
  onFabricManagerErrorChange,
  isQuickAddDialogOpen,
  onQuickAddDialogOpenChange,
  quickAddValue,
  onQuickAddValueChange,
  quickAddError,
  onQuickAddErrorChange,
}: FabricSelectionProps) {
  const handleFabricSelect = (fabricId: string) => {
    const newSelected = selectedFabricOptions.includes(fabricId)
      ? selectedFabricOptions.filter(id => id !== fabricId)
      : [...selectedFabricOptions, fabricId];
    onSelectedFabricOptionsChange(newSelected);
  };

  const handleSourceSelect = (sourceId: string) => {
    const newSelected = selectedFabricSources.includes(sourceId)
      ? selectedFabricSources.filter(id => id !== sourceId)
      : [...selectedFabricSources, sourceId];
    onSelectedFabricSourcesChange(newSelected);
  };

  const handleFabricManagerSave = () => {
    if (fabricOptionsDraft.length === 0) {
      onFabricManagerErrorChange('يجب إضافة خيار واحد على الأقل');
      return;
    }
    onFabricOptionsChange(fabricOptionsDraft);
    onFabricManagerOpenChange(false);
    onFabricManagerErrorChange('');
  };

  const handleQuickAdd = () => {
    if (!quickAddValue.trim()) {
      onQuickAddErrorChange('يجب إدخال اسم الخيار');
      return;
    }
    if (fabricOptionsDraft.some(option => option.label === quickAddValue.trim())) {
      onQuickAddErrorChange('هذا الخيار موجود بالفعل');
      return;
    }
    const newOption = { id: Date.now().toString(), label: quickAddValue.trim() };
    onFabricOptionsDraftChange([...fabricOptionsDraft, newOption]);
    onQuickAddValueChange('');
    onQuickAddErrorChange('');
    onQuickAddDialogOpenChange(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">نوع القماش</Label>
        <Popover open={isFabricPopoverOpen} onOpenChange={onFabricPopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isFabricPopoverOpen}
              className="w-full justify-between"
            >
              {selectedFabricOptions.length > 0
                ? `${selectedFabricOptions.length} خيار محدد`
                : 'اختر نوع القماش'}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="ابحث عن نوع القماش..." />
              <CommandList>
                <CommandEmpty>لا توجد خيارات.</CommandEmpty>
                {fabricOptions.map((fabric) => (
                  <CommandItem
                    key={fabric.id}
                    value={fabric.label}
                    onSelect={() => handleFabricSelect(fabric.id)}
                  >
                    <Check
                      className={cn(
                        'ml-2 h-4 w-4',
                        selectedFabricOptions.includes(fabric.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {fabric.label}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label className="text-sm font-medium">مصدر القماش</Label>
        <Popover open={isSourcePopoverOpen} onOpenChange={onSourcePopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isSourcePopoverOpen}
              className="w-full justify-between"
            >
              {selectedFabricSources.length > 0
                ? `${selectedFabricSources.length} مصدر محدد`
                : 'اختر مصدر القماش'}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="ابحث عن مصدر القماش..." />
              <CommandList>
                <CommandEmpty>لا توجد خيارات.</CommandEmpty>
                {fabricSourceOptions.map((source) => (
                  <CommandItem
                    key={source.id}
                    value={source.label}
                    onSelect={() => handleSourceSelect(source.id)}
                  >
                    <Check
                      className={cn(
                        'ml-2 h-4 w-4',
                        selectedFabricSources.includes(source.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {source.label}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            onFabricOptionsDraftChange([...fabricOptions]);
            onFabricManagerOpenChange(true);
          }}
        >
          <Pencil className="h-4 w-4 mr-2" />
          إدارة الخيارات
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onQuickAddDialogOpenChange(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          إضافة سريعة
        </Button>
      </div>
    </div>
  );
}





