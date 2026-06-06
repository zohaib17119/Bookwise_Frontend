import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-hero-grid px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.15),transparent_28%)]" />
      <div className="relative w-full">
        <Outlet />
      </div>
    </main>
  );
}
