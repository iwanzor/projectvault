import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon = Construction,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">
        {description || "This module is coming soon. Check back later."}
      </p>
      <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
        Coming Soon
      </div>
    </div>
  );
}
