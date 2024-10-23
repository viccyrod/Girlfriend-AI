import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div role="status" {...props}>
      <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
