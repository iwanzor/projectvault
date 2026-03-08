import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles } from "./quotation-styles";
import { QuotationHeader } from "./quotation-header";
import {
  QuotationSummary,
  QuotationTerms,
  PageFooter,
} from "./quotation-footer";
import type { QuotationWithDetails, QuotationDetail } from "./types";
import { toNum, fmtCurrency, fmtQty } from "./types";

interface SubcategoryFormatProps {
  quotation: QuotationWithDetails;
}

function groupByBrand(
  details: QuotationDetail[]
): Map<string, QuotationDetail[]> {
  const groups = new Map<string, QuotationDetail[]>();
  for (const item of details) {
    const brand = item.brandDesc || "General";
    const group = groups.get(brand) || [];
    group.push(item);
    groups.set(brand, group);
  }
  return groups;
}

export function SubcategoryFormat({ quotation }: SubcategoryFormatProps) {
  const sortedDetails = quotation.details.sort(
    (a, b) => a.serialNo - b.serialNo
  );
  const groups = groupByBrand(sortedDetails);
  let rowIndex = 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <QuotationHeader quotation={quotation} />

        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colSno]}>S/No</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colModel]}>
              Model
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>
              Unit Rate
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>
              Amount
            </Text>
          </View>

          {Array.from(groups.entries()).map(([brand, items]) => {
            const groupTotal = items.reduce(
              (sum, i) => sum + toNum(i.amount),
              0
            );

            return (
              <View key={brand}>
                {/* Group Header */}
                <View style={styles.groupHeader} wrap={false}>
                  <Text style={styles.groupHeaderText}>{brand}</Text>
                </View>

                {/* Items in group */}
                {items.map((item) => {
                  const isAlt = rowIndex % 2 !== 0;
                  rowIndex++;
                  return (
                    <View
                      key={item.id}
                      style={isAlt ? styles.tableRowAlt : styles.tableRow}
                      wrap={false}
                    >
                      <Text style={[styles.tableCell, styles.colSno]}>
                        {item.serialNo}
                      </Text>
                      <Text style={[styles.tableCell, styles.colDesc]}>
                        {item.itemDescription}
                      </Text>
                      <Text style={[styles.tableCell, styles.colModel]}>
                        {item.model}
                      </Text>
                      <Text style={[styles.tableCellRight, styles.colQty]}>
                        {fmtQty(toNum(item.quantity))}
                      </Text>
                      <Text style={[styles.tableCellRight, styles.colRate]}>
                        {fmtCurrency(toNum(item.rate))}
                      </Text>
                      <Text style={[styles.tableCellRight, styles.colAmount]}>
                        {fmtCurrency(toNum(item.amount))}
                      </Text>
                    </View>
                  );
                })}

                {/* Group Subtotal */}
                <View style={styles.groupSubtotalRow} wrap={false}>
                  <Text
                    style={[
                      styles.tableCellBold,
                      { width: "86%", textAlign: "right", paddingRight: 8 },
                    ]}
                  >
                    {brand} Subtotal
                  </Text>
                  <Text
                    style={[
                      styles.tableCellBold,
                      styles.colAmount,
                      { textAlign: "right" },
                    ]}
                  >
                    {fmtCurrency(groupTotal)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <QuotationSummary quotation={quotation} />
        <QuotationTerms quotation={quotation} />
        <PageFooter />
      </Page>
    </Document>
  );
}
