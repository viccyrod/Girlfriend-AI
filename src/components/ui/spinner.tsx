import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "sm" | "lg" | "xl";
}

const sizeClasses = {
  default: "h-4 w-4",
  sm: "h-3 w-3",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

export function Spinner({ className, size = "default", ...props }: SpinnerProps) {
  return (
    <div role="status" {...props}>
      <Loader2
        className={cn(
          "animate-spin text-muted-foreground",
          sizeClasses[size],
          className
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
