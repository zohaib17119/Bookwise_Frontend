import { Outlet } from "react-router-dom";
import { AuthMarketingPanel } from "@/features/auth/components/auth-marketing-panel";

export function AuthLayout() {
  return (
    <main className="min-h-screen lg:grid lg:h-screen lg:max-h-screen lg:grid-cols-5 lg:overflow-hidden">
      <div className="hidden lg:flex lg:col-span-2 lg:flex-col lg:overflow-hidden">
      <AuthMarketingPanel />

      </div>
      <div className="min-h-screen lg:h-full lg:overflow-y-auto lg:col-span-3 lg:border-l lg:border-white/10 lg:bg-[#0a192f]">
        <Outlet />
      </div>
    </main>
  );
}
