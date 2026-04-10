import { useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TopicComboboxProps {
  topics: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function TopicCombobox({ topics, selected, onChange, placeholder = "Select topics…" }: TopicComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const toggle = (topic: string) => {
    onChange(selected.includes(topic) ? selected.filter((t) => t !== topic) : [...selected, topic]);
  };

  const createNew = () => {
    const trimmed = search.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setSearch("");
  };

  const noMatch = search.trim() && !topics.some((t) => t.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between border-border text-foreground">
            {selected.length > 0 ? `${selected.length} topic${selected.length > 1 ? "s" : ""} selected` : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover border-border" align="start">
          <Command>
            <CommandInput placeholder="Search or create topic…" value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>
                {noMatch && (
                  <button onClick={createNew} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary hover:bg-accent rounded">
                    <Plus className="h-3.5 w-3.5" />Create "{search.trim()}"
                  </button>
                )}
              </CommandEmpty>
              <CommandGroup>
                {topics.map((topic) => (
                  <CommandItem key={topic} value={topic} onSelect={() => toggle(topic)}>
                    <Check className={cn("mr-2 h-4 w-4", selected.includes(topic) ? "opacity-100" : "opacity-0")} />
                    {topic}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 text-xs">
              {t}
              <button onClick={() => toggle(t)}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
