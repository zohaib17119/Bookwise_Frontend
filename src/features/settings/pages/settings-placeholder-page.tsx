import { EmptyState } from "@/components/shared/empty-state";

interface SettingsPlaceholderPageProps {
  title: string;
  description: string;
}

export function SettingsPlaceholderPage({
  title,
  description,
}: SettingsPlaceholderPageProps) {
  return <EmptyState description={description} title={title} />;
}
