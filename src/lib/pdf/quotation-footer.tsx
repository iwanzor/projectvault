import { View, Text } from "@react-pdf/renderer";
import { styles } from "./quotation-styles";
import type { QuotationWithDetails } from "./types";
import { toNum, fmtCurrency } from "./types";

interface QuotationFooterProps {
  quotation: QuotationWithDetails;
}

export function QuotationSummary({ quotation }: QuotationFooterProps) {
  const totalAmount = toNum(quotation.totalAmount);
  const discountPercentage = toNum(quotation.discountPercentage);
  const discountAmount = toNum(quotation.discountAmount);
  const netAmount = toNum(quotation.netAmount);
  const vatPerc = toNum(quotation.vatPerc);
  const vatAmount = toNum(quotation.vatAmount);
  const grossTotal = toNum(quotation.grossTotal);

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryBox}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sub Total</Text>
          <Text style={styles.summaryValue}>{fmtCurrency(totalAmount)}</Text>
        </View>

        {discountAmount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Discount ({fmtCurrency(discountPercentage)}%)
            </Text>
            <Text style={styles.summaryValue}>
              ({fmtCurrency(discountAmount)})
            </Text>
          </View>
        )}

        {discountAmount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net Amount</Text>
            <Text style={styles.summaryValue}>{fmtCurrency(netAmount)}</Text>
          </View>
        )}

        {vatAmount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              VAT ({fmtCurrency(vatPerc)}%)
            </Text>
            <Text style={styles.summaryValue}>{fmtCurrency(vatAmount)}</Text>
          </View>
        )}

        <View style={styles.summaryRowTotal}>
          <Text style={styles.summaryLabelTotal}>Grand Total</Text>
          <Text style={styles.summaryValueTotal}>
            {fmtCurrency(grossTotal)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function QuotationTerms({ quotation }: QuotationFooterProps) {
  if (!quotation.quotationTerms) return null;

  return (
    <View style={styles.termsContainer} wrap={false}>
      <Text style={styles.termsTitle}>Terms &amp; Conditions</Text>
      <Text style={styles.termsText}>
        {quotation.quotationTerms.terms}
      </Text>
    </View>
  );
}

export function PageFooter() {
  return (
    <>
      <View style={styles.footerLine} fixed />
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
        fixed
      />
    </>
  );
}
