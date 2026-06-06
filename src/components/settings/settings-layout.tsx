import { Outlet } from "react-router-dom";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";

export function SettingsLayout() {
  return (
    <PageContainer
      header={
        <PageHeader
          description="Manage company profile, accounting defaults, tax mapping, and operational preferences."
          eyebrow="Administration"
          title="Settings"
        />
      }
    >
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <SettingsNav />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </PageContainer>
  );
}
