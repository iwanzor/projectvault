import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles } from "./quotation-styles";
import { QuotationHeader } from "./quotation-header";
import {
  QuotationSummary,
  QuotationTerms,
  PageFooter,
} from "./quotation-footer";
import type { QuotationWithDetails } from "./types";
import { toNum, fmtCurrency, fmtQty } from "./types";

interface StandardFormatProps {
  quotation: QuotationWithDetails;
}

export function StandardFormat({ quotation }: StandardFormatProps) {
  const details = quotation.details.sort((a, b) => a.serialNo - b.serialNo);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <QuotationHeader quotation={quotation} />

        {/* Table */}
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

          {/* Table Rows */}
          {details.map((item, index) => (
            <View
              key={item.id}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
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
          ))}
        </View>

        <QuotationSummary quotation={quotation} />
        <QuotationTerms quotation={quotation} />
        <PageFooter />
      </Page>
    </Document>
  );
}
