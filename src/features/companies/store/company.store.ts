import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storageKeys } from "@/lib/utils/storage";

interface CompanyState {
  activeCompanyId: string | null;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  setActiveCompanyId: (companyId: string | null) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set, get) => ({
      activeCompanyId: null,
      sidebarOpen: false,
      sidebarCollapsed: false,
      setActiveCompanyId: (companyId) => set({ activeCompanyId: companyId }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebarCollapsed: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
    }),
    {
      name: storageKeys.activeCompanyId,
      partialize: (state) => ({
        activeCompanyId: state.activeCompanyId,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);
