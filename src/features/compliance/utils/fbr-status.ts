/**
 * Phase 10 — human-readable FBR Digital Invoicing status labels for invoice UX.
 * Maps stored `fbrSubmissionStatus` values; does not invent tax or submission state.
 */

export function formatFbrDiStatusLabel(
  status: string | null | undefined,
  options?: { digitalInvoicingEnabled?: boolean }
): string {
  const raw = (status ?? "NOT_APPLICABLE").toUpperCase();
  const enabled = options?.digitalInvoicingEnabled;

  if (enabled === false) {
    return "FBR Not Enabled";
  }

  switch (raw) {
    case "PENDING":
    case "PROCESSING":
      return "FBR In Progress";
    case "RETRYING":
      return "FBR Needs Retry";
    case "SUBMITTED":
      return "FBR Submitted";
    case "REJECTED":
      return "FBR Rejected";
    case "FAILED":
      return "FBR Failed";
    case "NOT_APPLICABLE":
    default:
      return enabled === true ? "Ready to send to FBR" : "FBR Not Enabled";
  }
}

/** Short operator guidance for invoice detail (pairs with stored fbrLastError). */
export function describeFbrDiStatusForUi(input: {
  fbrSubmissionStatus?: string | null;
  fbrLastError?: string | null;
  fbrLastResponseCode?: string | null;
  digitalInvoicingEnabled?: boolean;
}): { summary: string; action: string | null } {
  const status = (input.fbrSubmissionStatus ?? "NOT_APPLICABLE").toUpperCase();
  const error = (input.fbrLastError ?? "").trim();
  const code = (input.fbrLastResponseCode ?? "").toUpperCase();

  if (input.digitalInvoicingEnabled === false) {
    return {
      summary: "Digital Invoicing is off for this company.",
      action: "Enable it under Settings → FBR when you are ready to submit to PRAL."
    };
  }

  if (status === "SUBMITTED") {
    return { summary: "FBR accepted this document.", action: null };
  }
  if (status === "PENDING" || status === "PROCESSING") {
    return {
      summary: error || "Last attempt was interrupted or still marked in progress.",
      action: "Use Send to FBR to run a live sync submit now."
    };
  }
  if (status === "RETRYING") {
    return {
      summary: error || "Temporary FBR/network issue.",
      action: "Use Retry FBR submit for a live sync attempt."
    };
  }
  if (status === "FAILED") {
    return {
      summary: error || "FBR submit failed.",
      action: "Fix connectivity or token if needed, then use Retry FBR submit."
    };
  }
  if (status === "REJECTED") {
    const lower = error.toLowerCase();
    let action = "Fix the highlighted data, then use Retry FBR submit.";
    if (code === "MAP") {
      return {
        summary: error || "BooksWise local validation rejected this (not sent to FBR).",
        action:
          "BooksWise local validation stopped this before FBR. Fix the fields below, then retry. This is not an FBR gateway response.",
      };
    }
    if (
      code === "0204" ||
      /\b0204\b/.test(error) ||
      lower.includes("sale type not match") ||
      (lower.includes("sale type") && lower.includes("scenario"))
    ) {
      action =
        "Item sale type must match Settings → FBR scenario (SN001 → Goods at standard rate (default); not Goods (FED in ST Mode)). Fix the item, then Retry.";
    } else if (
      code === "PARSE" ||
      lower.includes("not json") ||
      lower.includes("parseerror") ||
      lower.includes("empty fbr response")
    ) {
      action =
        "FBR gateway returned a non-JSON body. Check IRIS token, server IP whitelist, Sandbox vs Production, and post URL; then retry.";
    } else if (lower.includes("hs") || lower.includes("hscode")) {
      action = "Set a valid HS code on the item/line, then retry.";
    } else if (lower.includes("uom") || lower.includes("unit")) {
      action = "Set FBR UoM on the item, then retry.";
    } else if (lower.includes("scenario")) {
      action =
        "Set default scenario ID in Settings → FBR so it matches item sale types (e.g. SN001 with Goods at standard rate (default)), then retry.";
    } else if (lower.includes("registration") || lower.includes("buyer")) {
      action = "Set buyer FBR registration type / NTN / province on the customer, then retry.";
    } else if (code === "401" || code === "403" || lower.includes("token")) {
      action = "Update the IRIS/PRAL security token and IP whitelist in Settings → FBR, then retry.";
    } else if (lower.includes("invoice ref") || lower.includes("invoiceref")) {
      action = "Ensure the original sale invoice was submitted to FBR first, then retry.";
    }
    return {
      summary: error || "FBR rejected this document (validation/business error).",
      action
    };
  }

  return {
    summary: "Not sent to FBR yet.",
    action:
      status === "NOT_APPLICABLE"
        ? "After you issue the invoice, click Send to FBR for a live submission."
        : null
  };
}
