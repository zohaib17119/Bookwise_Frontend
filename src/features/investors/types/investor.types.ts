export type Investor = {
  id: string;
  companyId: string;
  code: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  isDeleted: boolean;
  totalInvested: string;
  totalWithdrawn: string;
  netInvested: string;
  investmentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type InvestorListParams = {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
};

export type InvestorPayload = {
  code?: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  isActive?: boolean;
};

export type InvestorInvestmentMovementType = "CONTRIBUTION" | "WITHDRAWAL";

export type InvestorInvestment = {
  id: string;
  companyId: string;
  investorId: string;
  investmentDate: string;
  amount: string;
  movementType: InvestorInvestmentMovementType;
  currencyCode: string;
  paymentAccountId: string;
  paymentAccount: { id: string; code: string; name: string } | null;
  equityAccountId: string;
  equityAccount: { id: string; code: string; name: string } | null;
  notes: string | null;
  lastUpdateReason: string | null;
  journalEntryId: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateInvestmentPayload = {
  investmentDate: string;
  amount: string;
  currencyCode?: string;
  paymentAccountId?: string;
  notes?: string;
  movementType?: InvestorInvestmentMovementType;
};

export type UpdateInvestmentPayload = {
  updateReason: string;
  investmentDate?: string;
  amount?: string;
  paymentAccountId?: string;
  notes?: string | null;
  movementType?: InvestorInvestmentMovementType;
};
