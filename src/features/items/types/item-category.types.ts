export interface ItemCategory {
  id: string;
  companyId: string;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItemCategoryPayload {
  name: string;
}
