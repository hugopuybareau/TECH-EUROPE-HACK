import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const progressValue = value ?? 0;
  // Map 0-100% to a hue from red (0) to green (120). ~50% is yellow/orange.
  const hue = Math.round((progressValue / 100) * 120);
  const indicatorStyle: React.CSSProperties = {
    transform: `translateX(-${100 - progressValue}%)`,
    backgroundColor: `hsl(${hue}, 80%, 45%)`,
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 transition-all"
        style={indicatorStyle}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
