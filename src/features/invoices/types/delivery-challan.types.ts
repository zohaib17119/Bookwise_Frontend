export interface DeliveryChallanLine {
  id?: string;
  invoiceLineId: string;
  itemName?: string | null;
  description?: string | null;
  lineNumber?: number | null;
  quantity: string;
  invoiceLineQuantity?: string | null;
}

export interface DeliveryChallan {
  id: string;
  companyId: string;
  invoiceId: string;
  challanNumber: string;
  challanDate: string;
  notes?: string | null;
  invoiceNumber?: string | null;
  deliveryChallanNumber?: string | null;
  createdAt: string;
  updatedAt?: string;
  lines: DeliveryChallanLine[];
}

export interface DeliveryChallanRemainingLine {
  invoiceLineId: string;
  lineNumber: number;
  itemName: string | null;
  description: string | null;
  orderedQty: string;
  deliveredQty: string;
  remainingQty: string;
}

export interface DeliveryChallanRemaining {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  canCreate: boolean;
  deliveryChallanNumber?: string | null;
  lines: DeliveryChallanRemainingLine[];
}

export interface CreateDeliveryChallanPayload {
  challanDate?: string;
  notes?: string | null;
  lines: Array<{ invoiceLineId: string; quantity: string }>;
}

/** Summary shape returned on invoice detail. */
export interface InvoiceDeliveryChallanSummary {
  id: string;
  challanNumber: string;
  challanDate: string;
  notes?: string | null;
  createdAt: string;
  lines?: Array<{
    id: string;
    invoiceLineId: string;
    itemName?: string | null;
    quantity: string | null;
  }>;
}
