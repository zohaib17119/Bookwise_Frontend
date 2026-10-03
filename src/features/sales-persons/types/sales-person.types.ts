export interface SalesPerson {
  id: string;
  companyId: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalesPersonPayload {
  name: string;
  isActive?: boolean;
}
