import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[1.35rem] w-9 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=unchecked]:bg-slate-300 data-[state=checked]:bg-primary",
        "dark:data-[state=unchecked]:bg-slate-700 dark:data-[state=checked]:bg-cyan-500",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
          "dark:bg-slate-950"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
