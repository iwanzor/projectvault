import { View, Text } from "@react-pdf/renderer";
import { styles } from "./quotation-styles";
import type { QuotationWithDetails } from "./types";
import { fmtDate } from "./types";

interface QuotationHeaderProps {
  quotation: QuotationWithDetails;
}

export function QuotationHeader({ quotation }: QuotationHeaderProps) {
  return (
    <View fixed>
      {/* Company Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.companyName}>BGERP</Text>
          <Text style={styles.companySubText}>
            Business Group Enterprise Resource Planning
          </Text>
        </View>
        <View>
          <Text style={styles.docTitle}>SALES QUOTATION</Text>
          <Text style={styles.docSubTitle}>
            {quotation.status === "SUBMITTED" ? "SUBMITTED" : "DRAFT"}
          </Text>
        </View>
      </View>

      {/* Quotation Info + Customer Info */}
      <View style={styles.infoRow}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Quotation No</Text>
          <Text style={styles.infoValueBold}>{quotation.quotationNo}</Text>

          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>
            {fmtDate(quotation.quotationDate)}
          </Text>

          <Text style={styles.infoLabel}>Revision</Text>
          <Text style={styles.infoValue}>{quotation.revisionNo}</Text>

          <Text style={styles.infoLabel}>Branch</Text>
          <Text style={styles.infoValue}>{quotation.branchCode}</Text>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Customer</Text>
          <Text style={styles.infoValueBold}>
            {quotation.customer.name}
          </Text>

          {quotation.customer.address && (
            <>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>
                {quotation.customer.address}
              </Text>
            </>
          )}

          {quotation.customer.phone && (
            <>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>
                {quotation.customer.phone}
              </Text>
            </>
          )}

          {quotation.customer.contactPerson1 && (
            <>
              <Text style={styles.infoLabel}>Contact Person</Text>
              <Text style={styles.infoValue}>
                {quotation.customer.contactPerson1}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Description */}
      {quotation.description && (
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionLabel}>Description</Text>
          <Text style={styles.descriptionText}>
            {quotation.description}
          </Text>
        </View>
      )}
    </View>
  );
}
