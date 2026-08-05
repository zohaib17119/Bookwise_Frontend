export interface HsCodeCategory {
  id: string;
  companyId: string;
  code: string;
  categoryName: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HsCodeCategoryPayload {
  code: string;
  categoryName: string;
}
