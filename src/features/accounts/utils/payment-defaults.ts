import type {
  DefaultAccountMapping,
  DefaultAccountMappingPayload,
} from "@/features/settings/api/default-account-mapping.api";
import type { PaymentDefaultFlags } from "@/features/accounts/components/payment-default-checkboxes";

export function paymentDefaultFlagsForAccount(
  mapping: DefaultAccountMapping | undefined,
  accountId: string | undefined,
): PaymentDefaultFlags {
  if (!accountId) {
    return { defaultForExpense: false, defaultForReceive: false, defaultForVendorPay: false };
  }
  return {
    defaultForExpense: mapping?.defaultExpensePayment?.accountId === accountId,
    defaultForReceive: mapping?.defaultCustomerReceive?.accountId === accountId,
    defaultForVendorPay: mapping?.defaultVendorPay?.accountId === accountId,
  };
}

export function mappingPayloadFromPaymentFlags(
  mapping: DefaultAccountMapping | undefined,
  accountId: string,
  flags: PaymentDefaultFlags,
): DefaultAccountMappingPayload {
  const fallback = mapping?.cashBank?.accountId ?? accountId;

  const resolveSlot = (currentId: string | null | undefined, checked: boolean) => {
    if (checked) return accountId;
    if (currentId === accountId) return fallback;
    return undefined;
  };

  const payload: DefaultAccountMappingPayload = {};
  const expense = resolveSlot(mapping?.defaultExpensePayment?.accountId, flags.defaultForExpense);
  const receive = resolveSlot(mapping?.defaultCustomerReceive?.accountId, flags.defaultForReceive);
  const vendorPay = resolveSlot(mapping?.defaultVendorPay?.accountId, flags.defaultForVendorPay);

  if (expense !== undefined) payload.defaultExpensePaymentAccountId = expense;
  if (receive !== undefined) payload.defaultCustomerReceiveAccountId = receive;
  if (vendorPay !== undefined) payload.defaultVendorPayAccountId = vendorPay;

  return payload;
}
