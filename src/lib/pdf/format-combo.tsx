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

interface ComboFormatProps {
  quotation: QuotationWithDetails;
}

interface ComboGroup {
  parent: QuotationDetail;
  children: QuotationDetail[];
}

function groupComboItems(details: QuotationDetail[]): ComboGroup[] {
  const sorted = [...details].sort((a, b) => a.serialNo - b.serialNo);
  const groups: ComboGroup[] = [];
  let currentGroup: ComboGroup | null = null;

  for (const item of sorted) {
    // Items with mainLocation matching a parent's location are children;
    // otherwise treat each item as its own parent group
    if (
      currentGroup &&
      item.mainLocation &&
      currentGroup.parent.location &&
      item.mainLocation === currentGroup.parent.location
    ) {
      currentGroup.children.push(item);
    } else {
      currentGroup = { parent: item, children: [] };
      groups.push(currentGroup);
    }
  }

  return groups;
}

export function ComboFormat({ quotation }: ComboFormatProps) {
  const groups = groupComboItems(quotation.details);
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

          {groups.map((group) => {
            const isAlt = rowIndex % 2 !== 0;
            rowIndex++;

            return (
              <View key={group.parent.id}>
                {/* Parent row */}
                <View
                  style={isAlt ? styles.tableRowAlt : styles.tableRow}
                  wrap={false}
                >
                  <Text style={[styles.tableCellBold, styles.colSno]}>
                    {group.parent.serialNo}
                  </Text>
                  <Text style={[styles.tableCellBold, styles.colDesc]}>
                    {group.parent.itemDescription}
                  </Text>
                  <Text style={[styles.tableCellBold, styles.colModel]}>
                    {group.parent.model}
                  </Text>
                  <Text
                    style={[
                      styles.tableCellRight,
                      styles.colQty,
                      { fontFamily: "Helvetica-Bold" },
                    ]}
                  >
                    {fmtQty(toNum(group.parent.quantity))}
                  </Text>
                  <Text
                    style={[
                      styles.tableCellRight,
                      styles.colRate,
                      { fontFamily: "Helvetica-Bold" },
                    ]}
                  >
                    {fmtCurrency(toNum(group.parent.rate))}
                  </Text>
                  <Text
                    style={[
                      styles.tableCellRight,
                      styles.colAmount,
                      { fontFamily: "Helvetica-Bold" },
                    ]}
                  >
                    {fmtCurrency(toNum(group.parent.amount))}
                  </Text>
                </View>

                {/* Child rows (indented) */}
                {group.children.map((child) => (
                  <View
                    key={child.id}
                    style={styles.comboChildRow}
                    wrap={false}
                  >
                    <Text
                      style={[
                        styles.tableCell,
                        styles.colSno,
                        { color: "#6c757d" },
                      ]}
                    >
                      {" "}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.colDesc,
                        { color: "#495057", fontSize: 7.5 },
                      ]}
                    >
                      {child.itemDescription}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.colModel,
                        { color: "#495057", fontSize: 7.5 },
                      ]}
                    >
                      {child.model}
                    </Text>
                    <Text
                      style={[
                        styles.tableCellRight,
                        styles.colQty,
                        { color: "#495057", fontSize: 7.5 },
                      ]}
                    >
                      {fmtQty(toNum(child.quantity))}
                    </Text>
                    <Text
                      style={[
                        styles.tableCellRight,
                        styles.colRate,
                        { color: "#495057", fontSize: 7.5 },
                      ]}
                    >
                      {fmtCurrency(toNum(child.rate))}
                    </Text>
                    <Text
                      style={[
                        styles.tableCellRight,
                        styles.colAmount,
                        { color: "#495057", fontSize: 7.5 },
                      ]}
                    >
                      {fmtCurrency(toNum(child.amount))}
                    </Text>
                  </View>
                ))}
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
