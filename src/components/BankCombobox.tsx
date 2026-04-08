import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface BankComboboxProps {
  banks: string[];
  value: string;
  onChange: (value: string) => void;
}

export function BankCombobox({ banks, value, onChange }: BankComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = banks.filter((b) =>
    b.toLowerCase().includes(search.toLowerCase())
  );
  const showCreate = search.trim() && !banks.some((b) => b.toLowerCase() === search.trim().toLowerCase());

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">
        Select or Create Knowledge Bank
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal border-border/50 bg-secondary"
          >
            {value || "Choose a knowledge bank…"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              ref={inputRef}
              placeholder="Search or type a new name…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty className="py-2 px-3 text-sm text-muted-foreground">
                No existing banks found.
              </CommandEmpty>
              {filtered.length > 0 && (
                <CommandGroup heading="Existing Banks">
                  {filtered.map((bank) => (
                    <CommandItem
                      key={bank}
                      value={bank}
                      onSelect={() => {
                        onChange(bank);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === bank ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {bank}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {showCreate && (
                <CommandGroup heading="Create New">
                  <CommandItem
                    value={`__create__${search.trim()}`}
                    onSelect={() => {
                      onChange(search.trim());
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4 text-primary" />
                    <span>
                      Create "<span className="font-medium text-primary">{search.trim()}</span>"
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
