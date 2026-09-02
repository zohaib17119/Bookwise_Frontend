export function isCashLikeAccount(account: { type: string; subtype?: string | null }) {
  return account.type === "BANK" || (account.type === "ASSET" && account.subtype === "cash");
}
