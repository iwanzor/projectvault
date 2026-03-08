import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles } from "./quotation-styles";
import { QuotationHeader } from "./quotation-header";
import {
  QuotationSummary,
  QuotationTerms,
  PageFooter,
} from "./quotation-footer";
import type { QuotationWithDetails, QuotationDetail } from "./types";
import { toNum, fmtCurrency } from "./types";

interface GrandTotalFormatProps {
  quotation: QuotationWithDetails;
}

interface CategorySummary {
  brand: string;
  itemCount: number;
  totalQty: number;
  totalAmount: number;
}

function buildSummary(details: QuotationDetail[]): CategorySummary[] {
  const map = new Map<
    string,
    { itemCount: number; totalQty: number; totalAmount: number }
  >();

  for (const item of details) {
    const brand = item.brandDesc || "General";
    const existing = map.get(brand) || {
      itemCount: 0,
      totalQty: 0,
      totalAmount: 0,
    };
    existing.itemCount += 1;
    existing.totalQty += toNum(item.quantity);
    existing.totalAmount += toNum(item.amount);
    map.set(brand, existing);
  }

  return Array.from(map.entries()).map(([brand, data]) => ({
    brand,
    ...data,
  }));
}

export function GrandTotalFormat({ quotation }: GrandTotalFormatProps) {
  const summaries = buildSummary(quotation.details);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <QuotationHeader quotation={quotation} />

        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: "5%" }]}>
              S/No
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "40%" }]}>
              Category / Brand
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
              Items
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: "15%", textAlign: "right" },
              ]}
            >
              Total Qty
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: "25%", textAlign: "right" },
              ]}
            >
              Amount
            </Text>
          </View>

          {/* Summary Rows */}
          {summaries.map((summary, index) => (
            <View
              key={summary.brand}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              wrap={false}
            >
              <Text style={[styles.tableCell, { width: "5%" }]}>
                {index + 1}
              </Text>
              <Text style={[styles.tableCellBold, { width: "40%" }]}>
                {summary.brand}
              </Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>
                {summary.itemCount} item{summary.itemCount !== 1 ? "s" : ""}
              </Text>
              <Text
                style={[
                  styles.tableCellRight,
                  { width: "15%", textAlign: "right" },
                ]}
              >
                {fmtCurrency(summary.totalQty)}
              </Text>
              <Text
                style={[
                  styles.tableCellRight,
                  { width: "25%", textAlign: "right" },
                ]}
              >
                {fmtCurrency(summary.totalAmount)}
              </Text>
            </View>
          ))}

          {/* Grand total row */}
          <View style={styles.groupSubtotalRow} wrap={false}>
            <Text
              style={[
                styles.tableCellBold,
                { width: "75%", textAlign: "right", paddingRight: 8 },
              ]}
            >
              Total
            </Text>
            <Text
              style={[
                styles.tableCellBold,
                { width: "25%", textAlign: "right" },
              ]}
            >
              {fmtCurrency(toNum(quotation.totalAmount))}
            </Text>
          </View>
        </View>

        <QuotationSummary quotation={quotation} />
        <QuotationTerms quotation={quotation} />
        <PageFooter />
      </Page>
    </Document>
  );
}
