'use client';

import * as React from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import * as Icons from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

const iconNames = Object.keys(Icons).filter(
  (name) => /^[A-Z][a-zA-Z0-9]+$/.test(name) && !name.endsWith('Icon')
);

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const SelectedIcon = value ? (Icons as any)[value as keyof typeof Icons] : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          {SelectedIcon ? (
            <>
              <SelectedIcon className="mr-2 h-4 w-4" />
              {value}
            </>
          ) : (
            'Select icon'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Cari ikon..." />
          <CommandList>
            <CommandEmpty>Ikon tidak ditemukan.</CommandEmpty>
            {iconNames.map((name) => {
              const Icon = (Icons as any)[name as keyof typeof Icons];
              return (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {name}
                  <Check
                    className={cn('ml-auto h-4 w-4', value === name ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

