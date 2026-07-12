import type { ChangeEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchGuideProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchGuide({
  value,
  onChange,
  placeholder = "Search guide sections and FAQs",
}: SearchGuideProps) {
  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
