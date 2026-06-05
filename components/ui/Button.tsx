"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-semibold uppercase tracking-widest transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // shadcn
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline normal-case tracking-normal",
        // marca / legacy
        primary: "bg-formatto-grafito text-white border border-formatto-grafito hover:bg-[#1a1a1a]",
        dark: "bg-formatto-grafito text-white hover:bg-[#1a1a1a]",
        secondary: "bg-white text-formatto-grafito border border-formatto-sand hover:bg-formatto-cream",
        destructive: "bg-white text-formatto-rojo border border-formatto-rojo hover:bg-formatto-rojo/5",
        ghost: "bg-transparent text-formatto-bark border border-transparent hover:bg-formatto-cream",
      },
      size: {
        default: "h-9 px-4 py-2 text-2xs",
        sm: "h-8 px-3 py-1.5 text-2xs",
        md: "h-9 px-4 py-2 text-2xs",
        lg: "h-11 px-6 py-2.5 text-xs",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && (
              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            )}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
