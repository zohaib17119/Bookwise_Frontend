/**
 * Mirrors BooksWise `fbr.sectorDefaults.ts` for Settings UI preview.
 * Defaults only — per-item saleType stays editable.
 */

export const FBR_SALE_TYPE_STANDARD = "Goods at standard rate (default)";
export const FBR_SALE_TYPE_PETROLEUM = "Petroleum Products";
export const FBR_SALE_TYPE_SERVICES = "Services";
export const FBR_SALE_TYPE_STEEL = "Steel Melting and re-rolling";
export const FBR_SALE_TYPE_TELECOM = "Telecommunication services";

const BASE_GOODS_SCENARIOS = [
  "SN001",
  "SN002",
  "SN005",
  "SN006",
  "SN007",
  "SN015",
  "SN016",
  "SN017",
  "SN021",
  "SN022",
  "SN024",
];

function uniqueScenarios(...groups: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const group of groups) {
    for (const id of group) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

export function resolveFbrSectorDefaults(input: {
  activity?: string | null;
  sector?: string | null;
}): {
  suggestedScenarioIds: string[];
  defaultScenarioId: string;
  defaultSaleType: string;
} {
  const activity = (input.activity ?? "OTHER").toUpperCase();
  const sector = (input.sector ?? "ALL_OTHER").toUpperCase();

  let extra: string[] = [];
  let defaultSaleType = FBR_SALE_TYPE_STANDARD;
  let defaultScenarioId = "SN001";

  if (sector === "STEEL") {
    extra = ["SN003", "SN004", "SN011"];
    defaultSaleType = FBR_SALE_TYPE_STEEL;
    defaultScenarioId = "SN003";
  } else if (sector === "FMCG" || sector === "WHOLESALE_RETAIL") {
    extra = ["SN008"];
    if (activity === "RETAILER") {
      extra = uniqueScenarios(extra, ["SN026", "SN027", "SN028", "SN008"]);
      defaultScenarioId = "SN026";
    }
  } else if (sector === "TEXTILE") {
    extra = ["SN009"];
  } else if (sector === "TELECOM") {
    extra = ["SN010"];
    defaultSaleType = FBR_SALE_TYPE_TELECOM;
    defaultScenarioId = "SN010";
  } else if (sector === "PETROLEUM") {
    extra = ["SN012"];
    defaultSaleType = FBR_SALE_TYPE_PETROLEUM;
    defaultScenarioId = "SN012";
  } else if (sector === "ELECTRICITY_DISTRIBUTION") {
    extra = ["SN013"];
    defaultScenarioId = "SN013";
  } else if (sector === "GAS_DISTRIBUTION") {
    extra = ["SN014"];
    defaultScenarioId = "SN014";
  } else if (sector === "SERVICES" || activity === "SERVICE_PROVIDER") {
    extra = ["SN018", "SN019"];
    defaultSaleType = FBR_SALE_TYPE_SERVICES;
    defaultScenarioId = "SN019";
  } else if (sector === "AUTOMOBILE") {
    extra = ["SN020"];
  } else if (sector === "CNG_STATIONS") {
    extra = ["SN023"];
    defaultScenarioId = "SN023";
  } else if (sector === "PHARMACEUTICALS") {
    if (activity === "DISTRIBUTOR" || activity === "WHOLESALER") {
      extra = ["SN025"];
    }
  }

  if (activity === "RETAILER" && sector === "ALL_OTHER") {
    extra = uniqueScenarios(extra, ["SN026", "SN027", "SN028", "SN008"]);
  }

  const suggestedScenarioIds = uniqueScenarios(BASE_GOODS_SCENARIOS, extra);
  if (!suggestedScenarioIds.includes(defaultScenarioId)) {
    defaultScenarioId = suggestedScenarioIds[0] ?? "SN001";
  }

  return {
    suggestedScenarioIds,
    defaultScenarioId,
    defaultSaleType,
  };
}
