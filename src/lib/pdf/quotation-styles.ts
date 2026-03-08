import { StyleSheet } from "@react-pdf/renderer";

const colors = {
  primary: "#1a1a2e",
  primaryLight: "#16213e",
  accent: "#0f3460",
  headerBg: "#f8f9fa",
  altRow: "#f4f6f8",
  border: "#dee2e6",
  borderLight: "#e9ecef",
  text: "#212529",
  textMuted: "#6c757d",
  white: "#ffffff",
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    color: colors.text,
  },

  // Company header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  companyName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    letterSpacing: 2,
  },
  companySubText: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 2,
  },
  docTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textAlign: "right",
  },
  docSubTitle: {
    fontSize: 8,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: 2,
  },

  // Info section
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoBlock: {
    width: "48%",
  },
  infoLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 9,
    color: colors.text,
    marginBottom: 6,
  },
  infoValueBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
    marginBottom: 6,
  },

  // Description
  descriptionBox: {
    backgroundColor: colors.headerBg,
    padding: 8,
    borderRadius: 3,
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  descriptionText: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.4,
  },

  // Table
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    backgroundColor: colors.altRow,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  tableCell: {
    fontSize: 8,
    color: colors.text,
  },
  tableCellRight: {
    fontSize: 8,
    color: colors.text,
    textAlign: "right",
  },
  tableCellBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
  },

  // Column widths
  colSno: { width: "5%" },
  colDesc: { width: "35%" },
  colModel: { width: "15%" },
  colLocation: { width: "12%" },
  colQty: { width: "8%", textAlign: "right" },
  colRate: { width: "13%", textAlign: "right" },
  colAmount: { width: "14%", textAlign: "right" },

  // Quantity format columns
  colDescQty: { width: "28%" },
  colModelQty: { width: "13%" },
  colLocationQty: { width: "13%" },

  // Group header
  groupHeader: {
    flexDirection: "row",
    backgroundColor: colors.accent,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 4,
    borderRadius: 2,
  },
  groupHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  groupSubtotalRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    backgroundColor: colors.headerBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Combo indented row
  comboChildRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    paddingLeft: 20,
    backgroundColor: colors.headerBg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },

  // Summary section
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    marginBottom: 16,
  },
  summaryBox: {
    width: "45%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  summaryRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: colors.primary,
  },
  summaryLabel: {
    fontSize: 8,
    color: colors.text,
  },
  summaryValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
    textAlign: "right",
  },
  summaryLabelTotal: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  summaryValueTotal: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    textAlign: "right",
  },

  // Terms section
  termsContainer: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  termsTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  termsText: {
    fontSize: 7.5,
    color: colors.textMuted,
    lineHeight: 1.5,
  },

  // Footer / Page number
  pageNumber: {
    position: "absolute",
    bottom: 25,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 7,
    color: colors.textMuted,
  },
  footerLine: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});

export { colors };
