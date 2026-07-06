import type { PropsWithChildren, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import appLogo from "@/assets/app-logo.png";
import { cn } from "@/lib/utils/cn";

interface AuthFormPanelProps extends PropsWithChildren {
  title: string;
  description: string;
  footer?: ReactNode;
}

const tabs = [
  { label: "Sign In", to: "/login" },
  { label: "Sign Up", to: "/register" },
] as const;

export function AuthFormPanel({ title, description, footer, children }: AuthFormPanelProps) {
  const { pathname } = useLocation();

  return (
    <section className="flex min-h-screen flex-col bg-[#0a192f] px-6 py-10 sm:px-10 lg:min-h-full lg:px-14 xl:px-20">
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <img alt="BooksWise" className="h-10 w-10 rounded-xl object-cover" src={appLogo} />
        <div>
          <p className="text-lg font-bold text-white">
            books<span className="text-[#2dd4bf]">wise</span>
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">
            Accounting OS
          </p>
        </div>
      </div>

      <nav className="mb-10 flex gap-8 border-b border-white/10">
        {tabs.map((tab) => {
          const isActive = pathname === tab.to;

          return (
            <Link
              key={tab.to}
              className={cn(
                "relative pb-3 text-sm font-medium transition-colors",
                isActive ? "text-white" : "text-slate-400 hover:text-slate-200",
              )}
              to={tab.to}
            >
              {tab.label}
              {isActive ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#2dd4bf]" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-sm text-slate-400">{description}</p>
        </div>

        {children}

        {footer ? <div className="mt-8 text-center text-sm text-slate-400">{footer}</div> : null}
      </div>
    </section>
  );
}
