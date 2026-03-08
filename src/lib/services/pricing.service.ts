interface LineItem {
  quantity: number;
  rate: number;
}

interface PricingInput {
  items: LineItem[];
  discountPercentage: number;
  discountAmount: number;
  vatPerc: number;
}

interface PricingResult {
  totalAmount: number;
  netAmount: number;
  vatAmount: number;
  grossTotal: number;
}

export function calculateLineTotals<T extends LineItem>(items: T[]): (T & { amount: number })[] {
  return items.map((item) => ({
    ...item,
    amount: Number((item.quantity * item.rate).toFixed(2)),
  }));
}

export function calculateQuotationTotals(input: PricingInput): PricingResult {
  const totalAmount = input.items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );

  let netAmount: number;
  if (input.discountAmount > 0) {
    netAmount = totalAmount - input.discountAmount;
  } else if (input.discountPercentage > 0) {
    netAmount = totalAmount * (1 - input.discountPercentage / 100);
  } else {
    netAmount = totalAmount;
  }

  const vatAmount = netAmount * input.vatPerc / 100;
  const grossTotal = netAmount + vatAmount;

  return {
    totalAmount: Number(totalAmount.toFixed(2)),
    netAmount: Number(netAmount.toFixed(2)),
    vatAmount: Number(vatAmount.toFixed(2)),
    grossTotal: Number(grossTotal.toFixed(2)),
  };
}
