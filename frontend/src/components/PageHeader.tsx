import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  gradient: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ icon: Icon, gradient, title, subtitle, actions }: Props) {
  return (
    <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon size={19} className="text-white" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
