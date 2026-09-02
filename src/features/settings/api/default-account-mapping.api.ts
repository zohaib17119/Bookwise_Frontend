import { apiClient } from "@/lib/api/client";

export type MappingSlot = {
  accountId: string | null;
  account: { id: string; code: string; name: string; type: string } | null;
};

export type DefaultAccountMapping = {
  companyId: string;
  cashBank: MappingSlot;
  defaultExpensePayment: MappingSlot;
  defaultCustomerReceive: MappingSlot;
  defaultVendorPay: MappingSlot;
};

export type DefaultAccountMappingPayload = {
  defaultExpensePaymentAccountId?: string | null;
  defaultCustomerReceiveAccountId?: string | null;
  defaultVendorPayAccountId?: string | null;
  cashBankAccountId?: string | null;
};

export async function getDefaultAccountMapping(companyId: string) {
  const { data } = await apiClient.get<DefaultAccountMapping>(
    `/companies/${companyId}/default-account-mapping`,
  );
  return data;
}

export async function upsertDefaultAccountMapping(
  companyId: string,
  payload: DefaultAccountMappingPayload,
) {
  const { data } = await apiClient.put<DefaultAccountMapping>(
    `/companies/${companyId}/default-account-mapping`,
    payload,
  );
  return data;
}
