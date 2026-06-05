import { Punto } from "@/components/ui/punto";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8 pb-5 border-b border-border">
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-2xs font-semibold text-formatto-bark uppercase tracking-widest">
            — {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-light text-formatto-grafito leading-tight">
          {title}
          <Punto className="ml-1" />
        </h1>
        {subtitle && <p className="text-md font-light text-formatto-umber">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
