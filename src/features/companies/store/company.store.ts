import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storageKeys } from "@/lib/utils/storage";

interface CompanyState {
  activeCompanyId: string | null;
  sidebarOpen: boolean;
  setActiveCompanyId: (companyId: string | null) => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      activeCompanyId: null,
      sidebarOpen: false,
      setActiveCompanyId: (companyId) => set({ activeCompanyId: companyId }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: storageKeys.activeCompanyId,
    },
  ),
);
