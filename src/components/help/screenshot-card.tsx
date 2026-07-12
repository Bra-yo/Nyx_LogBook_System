import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface ScreenshotCardProps {
  title: string;
  description: string;
  imagePath: string;
}

export function ScreenshotCard({
  title,
  description,
  imagePath,
}: ScreenshotCardProps) {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardContent className="p-0">
        <div className="border-b p-4">
          <h4 className="font-semibold">{title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="relative aspect-[4/3] bg-muted/40">
          <Image src={imagePath} alt={title} fill className="object-cover" />
        </div>
      </CardContent>
    </Card>
  );
}
