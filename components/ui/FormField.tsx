"use client";

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

const INPUT_BASE = "w-full bg-background border border-input text-foreground text-md placeholder:text-muted-foreground px-3 py-2 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

interface FieldWrapProps {
  label?: string;
  eyebrow?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FieldWrap({ label, eyebrow, error, children, className = "" }: FieldWrapProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {eyebrow && (
        <span className="text-2xs font-semibold text-formatto-bark uppercase tracking-widest">
          — {eyebrow}
        </span>
      )}
      {label && <label className="text-sm font-semibold text-formatto-grafito">{label}</label>}
      {children}
      {error && <span className="text-xs text-formatto-rojo">{error}</span>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} className={`${INPUT_BASE} ${className}`} {...props} />
  )
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", children, ...props }, ref) => (
    <select ref={ref} className={`${INPUT_BASE} ${className}`} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", ...props }, ref) => (
    <textarea ref={ref} className={`${INPUT_BASE} min-h-[80px] resize-none ${className}`} {...props} />
  )
);
Textarea.displayName = "Textarea";
