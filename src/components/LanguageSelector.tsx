import { Globe } from "lucide-react";
import { useLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={language} onValueChange={(v) => setLanguage(v as SupportedLanguage)}>
        <SelectTrigger className="h-8 w-[140px] text-xs bg-background/60 border-border/60">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang} value={lang} className="text-xs">
              {lang}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
