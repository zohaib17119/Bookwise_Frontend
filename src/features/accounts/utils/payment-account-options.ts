import { isCashLikeAccount } from "@/features/accounts/utils/cash-like";
import type { Account } from "@/features/accounts/types/account.types";

export type PayFromOption = {
  id: string;
  label: string;
};

type BankLike = {
  isActive?: boolean;
  name: string;
  linkedAccountId?: string | null;
  accountId?: string | null;
  account?: { id?: string; code?: string | null; name?: string | null } | null;
  linkedAccountName?: string | null;
};

function ledgerIdOf(bank: BankLike) {
  return bank.linkedAccountId || bank.accountId || bank.account?.id || "";
}

function ledgerLabel(account: { code?: string | null; name: string }) {
  return (account.code ? `${account.code} ` : "") + account.name;
}

export function buildPayFromOptions(ledgers: Account[], banks: BankLike[]): PayFromOption[] {
  const cashLike = ledgers.filter((account) => account.isActive && isCashLikeAccount(account));
  const ledgerById = new Map(cashLike.map((account) => [account.id, account]));
  const bankByLedgerId = new Map<string, BankLike>();

  for (const bank of banks) {
    if (bank.isActive === false) continue;
    const ledgerId = ledgerIdOf(bank);
    const ledger = ledgerById.get(ledgerId);
    if (!ledgerId || !ledger) continue;
    if (!bankByLedgerId.has(ledgerId)) {
      bankByLedgerId.set(ledgerId, bank);
    }
  }

  return cashLike.map((account) => {
    const bank = bankByLedgerId.get(account.id);
    if (bank) {
      return {
        id: account.id,
        label: `${bank.name} — ${ledgerLabel(account)}`,
      };
    }
    return { id: account.id, label: ledgerLabel(account) };
  });
}

export function nextExpenseAccountCode(accounts: Account[]) {
  const used = new Set(
    accounts
      .filter((account) => account.type === "EXPENSE")
      .map((account) => (account.code ?? "").toUpperCase()),
  );

  for (let n = 6100; n < 6999; n += 1) {
    const code = String(n);
    if (!used.has(code)) return code;
  }

  return `EXP${Date.now().toString().slice(-6)}`;
}
