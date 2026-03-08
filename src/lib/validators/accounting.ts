import { z } from "zod/v4";

// ═══════════════════════════════════════════════════
// Banks
// ═══════════════════════════════════════════════════

export const listBanksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  sortBy: z.string().default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createBankSchema = z.object({
  bankCode: z.string().min(1).max(50),
  branchCode: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  address: z.string().max(250).optional(),
  cityId: z.number().int().positive().optional(),
  phone: z.string().max(50).optional(),
  fax: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  contactPerson1: z.string().max(50).optional(),
  contactPerson2: z.string().max(50).optional(),
  contactPerson3: z.string().max(50).optional(),
  isGst: z.boolean().default(false),
  isCreditCard: z.boolean().default(false),
});

export const updateBankSchema = z.object({
  bankCode: z.string().min(1).max(50).optional(),
  branchCode: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  address: z.string().max(250).optional(),
  cityId: z.number().int().positive().nullable().optional(),
  phone: z.string().max(50).optional(),
  fax: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  contactPerson1: z.string().max(50).optional(),
  contactPerson2: z.string().max(50).optional(),
  contactPerson3: z.string().max(50).optional(),
  isGst: z.boolean().optional(),
  isCreditCard: z.boolean().optional(),
});

// ═══════════════════════════════════════════════════
// Bank Accounts
// ═══════════════════════════════════════════════════

export const listBankAccountsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  bankId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().default("accountNo"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createBankAccountSchema = z.object({
  bankId: z.number().int().positive(),
  accountNo: z.string().min(1).max(50),
  accountType: z.string().max(50).optional(),
  currencyCode: z.string().max(50).optional(),
  amount: z.coerce.number().optional(),
});

export const updateBankAccountSchema = z.object({
  bankId: z.number().int().positive().optional(),
  accountNo: z.string().min(1).max(50).optional(),
  accountType: z.string().max(50).optional(),
  currencyCode: z.string().max(50).optional(),
  amount: z.coerce.number().optional(),
});

// ═══════════════════════════════════════════════════
// Payment Types
// ═══════════════════════════════════════════════════

export const listPaymentTypesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  sortBy: z.string().default("paymentTypeCode"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createPaymentTypeSchema = z.object({
  paymentTypeCode: z.string().min(1).max(50),
  name: z.string().max(50).optional(),
});

export const updatePaymentTypeSchema = z.object({
  paymentTypeCode: z.string().min(1).max(50).optional(),
  name: z.string().max(50).optional(),
});

// ═══════════════════════════════════════════════════
// Payment Channels
// ═══════════════════════════════════════════════════

export const listPaymentChannelsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  sortBy: z.string().default("paymentChannelCode"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createPaymentChannelSchema = z.object({
  paymentChannelCode: z.string().min(1).max(50),
  name: z.string().max(50).optional(),
});

export const updatePaymentChannelSchema = z.object({
  paymentChannelCode: z.string().min(1).max(50).optional(),
  name: z.string().max(50).optional(),
});

// ═══════════════════════════════════════════════════
// Purposes
// ═══════════════════════════════════════════════════

export const listPurposesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  sortBy: z.string().default("purposeCode"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createPurposeSchema = z.object({
  purposeCode: z.string().min(1).max(50),
  name: z.string().max(50).optional(),
});

export const updatePurposeSchema = z.object({
  purposeCode: z.string().min(1).max(50).optional(),
  name: z.string().max(50).optional(),
});

// ═══════════════════════════════════════════════════
// Financial Transactions
// ═══════════════════════════════════════════════════

export const listTransactionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  category: z.enum(["INCOME", "EXPENSE"]).optional(),
  projectNo: z.string().optional(),
  purposeCode: z.string().optional(),
  paymentChannelCode: z.string().optional(),
  isLocked: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createTransactionSchema = z.object({
  category: z.enum(["INCOME", "EXPENSE"]),
  projectNo: z.string().max(50).optional(),
  purposeCode: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  paymentChannelCode: z.string().max(50).optional(),
  internalDocNo: z.string().max(50).optional(),
  internalDocPath: z.string().max(150).optional(),
  bankCode: z.string().max(50).optional(),
  accountNo: z.string().max(50).optional(),
  paymentTypeCode: z.string().max(50).optional(),
  currency: z.string().max(50).optional(),
  amount: z.coerce.number().optional(),
  amountPaid: z.coerce.number().optional(),
  amountLeft: z.coerce.number().optional(),
  bankDocNo: z.string().max(50).optional(),
  bankDocPath: z.string().max(150).optional(),
  expectedDate: z.coerce.date().nullable().optional(),
  actualDate: z.coerce.date().nullable().optional(),
  statementDocPath: z.string().max(150).optional(),
  branchCode: z.string().max(50).optional(),
  expectedTransactionNo: z.string().max(50).optional(),
});

export const updateTransactionSchema = z.object({
  category: z.enum(["INCOME", "EXPENSE"]).optional(),
  projectNo: z.string().max(50).optional(),
  purposeCode: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  paymentChannelCode: z.string().max(50).optional(),
  internalDocNo: z.string().max(50).optional(),
  internalDocPath: z.string().max(150).optional(),
  bankCode: z.string().max(50).optional(),
  accountNo: z.string().max(50).optional(),
  paymentTypeCode: z.string().max(50).optional(),
  currency: z.string().max(50).optional(),
  amount: z.coerce.number().optional(),
  amountPaid: z.coerce.number().optional(),
  amountLeft: z.coerce.number().optional(),
  bankDocNo: z.string().max(50).optional(),
  bankDocPath: z.string().max(150).optional(),
  expectedDate: z.coerce.date().nullable().optional(),
  actualDate: z.coerce.date().nullable().optional(),
  statementDocPath: z.string().max(150).optional(),
  branchCode: z.string().max(50).optional(),
  expectedTransactionNo: z.string().max(50).optional(),
});

export const lockTransactionSchema = z.object({
  descriptionLock: z.string().max(500).optional(),
});

export const archiveTransactionSchema = z.object({
  descriptionArchive: z.string().max(500).optional(),
});

export const transactionSummarySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ═══════════════════════════════════════════════════
// Inventory Transactions
// ═══════════════════════════════════════════════════

const invTransactionDetailSchema = z.object({
  nature: z.number().int(),
  purchaseOrderNo: z.string().min(1).max(50),
  barcode: z.string().min(1).max(50),
  projectNo: z.string().min(1).max(50),
  itemDescription: z.string().min(1).max(250),
  unitCode: z.string().min(1).max(50),
  locationCode: z.string().min(1).max(50),
  quantity: z.coerce.number().positive(),
  itemSerialNo: z.string().min(1).max(50),
  toProjectNo: z.string().max(10).optional(),
  defFob: z.coerce.number().min(0).default(0),
  currency: z.string().min(1).max(10),
  totDefFobAmount: z.coerce.number().min(0).default(0),
  actualFob: z.coerce.number().min(0).default(0),
  actualCurrency: z.string().min(1).max(10),
  totActualFobAmount: z.coerce.number().min(0).default(0),
  convRate: z.coerce.number().min(0).default(1),
  actualFobAed: z.coerce.number().min(0).default(0),
  totActualFobAed: z.coerce.number().min(0).default(0),
});

export const listInvTransactionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  projectNo: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createInvTransactionSchema = z.object({
  nature: z.number().int(),
  transactionDate: z.coerce.date().optional(),
  projectNo: z.string().min(1).max(50),
  supplierCode: z.string().min(1).max(50),
  description: z.string().max(255).nullable().optional(),
  vendorInvoiceNo: z.string().max(50).optional(),
  requestedBy: z.string().max(20).optional(),
  approvedBy: z.string().max(20).optional(),
  docFilePath: z.string().max(100).optional(),
  toProjectNo: z.string().max(10).optional(),
  items: z.array(invTransactionDetailSchema).default([]),
});

export const updateInvTransactionSchema = z.object({
  nature: z.number().int().optional(),
  transactionDate: z.coerce.date().optional(),
  projectNo: z.string().min(1).max(50).optional(),
  supplierCode: z.string().min(1).max(50).optional(),
  description: z.string().max(255).nullable().optional(),
  vendorInvoiceNo: z.string().max(50).optional(),
  requestedBy: z.string().max(20).optional(),
  approvedBy: z.string().max(20).optional(),
  docFilePath: z.string().max(100).optional(),
  toProjectNo: z.string().max(10).optional(),
  items: z.array(invTransactionDetailSchema).optional(),
});

// ═══════════════════════════════════════════════════
// Accounting Employees
// ═══════════════════════════════════════════════════

export const listEmployeesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.string().default("employeeCode"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1).max(50),
  firstName: z.string().max(500).optional(),
  lastName: z.string().max(500).optional(),
  nickName: z.string().max(50).optional(),
  monthlySalary: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateEmployeeSchema = z.object({
  employeeCode: z.string().min(1).max(50).optional(),
  firstName: z.string().max(500).optional(),
  lastName: z.string().max(500).optional(),
  nickName: z.string().max(50).optional(),
  monthlySalary: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ═══════════════════════════════════════════════════
// Accounting Employee Statuses
// ═══════════════════════════════════════════════════

export const listEmployeeStatusesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  sortBy: z.string().default("statusCode"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createStatusSchema = z.object({
  statusCode: z.string().min(1).max(50),
  name: z.string().max(50).optional(),
  description: z.string().max(50).optional(),
});

export const updateStatusSchema = z.object({
  statusCode: z.string().min(1).max(50).optional(),
  name: z.string().max(50).optional(),
  description: z.string().max(50).optional(),
});

// ═══════════════════════════════════════════════════
// Accounting Positions
// ═══════════════════════════════════════════════════

export const listPositionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  sortBy: z.string().default("positionCode"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createPositionSchema = z.object({
  positionCode: z.string().min(1).max(50),
  name: z.string().max(50).optional(),
  description: z.string().max(50).optional(),
});

export const updatePositionSchema = z.object({
  positionCode: z.string().min(1).max(50).optional(),
  name: z.string().max(50).optional(),
  description: z.string().max(50).optional(),
});

// ═══════════════════════════════════════════════════
// Accounting Departments
// ═══════════════════════════════════════════════════

export const listDepartmentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  sortBy: z.string().default("departmentCode"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createDepartmentSchema = z.object({
  departmentCode: z.string().min(1).max(50),
  name: z.string().max(50).optional(),
  description: z.string().max(50).optional(),
});

export const updateDepartmentSchema = z.object({
  departmentCode: z.string().min(1).max(50).optional(),
  name: z.string().max(50).optional(),
  description: z.string().max(50).optional(),
});

// ═══════════════════════════════════════════════════
// Accounting Projects
// ═══════════════════════════════════════════════════

export const listAccProjectsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  sortBy: z.string().default("projectCode"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createAccProjectSchema = z.object({
  projectCode: z.string().min(1).max(50),
  name: z.string().max(50).optional(),
  description: z.string().optional(),
});

export const updateAccProjectSchema = z.object({
  projectCode: z.string().min(1).max(50).optional(),
  name: z.string().max(50).optional(),
  description: z.string().optional(),
});

// ═══════════════════════════════════════════════════
// Accounting Remarks
// ═══════════════════════════════════════════════════

export const listRemarksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  sortBy: z.string().default("remarkCode"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createRemarkSchema = z.object({
  remarkCode: z.string().min(1).max(50),
  name: z.string().max(50).optional(),
  description: z.string().max(50).optional(),
});

export const updateRemarkSchema = z.object({
  remarkCode: z.string().min(1).max(50).optional(),
  name: z.string().max(50).optional(),
  description: z.string().max(50).optional(),
});

// ═══════════════════════════════════════════════════
// Timesheets
// ═══════════════════════════════════════════════════

export const listTimesheetsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  projectId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  statusId: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createTimesheetSchema = z.object({
  date: z.coerce.date(),
  employeeId: z.number().int().positive(),
  projectId: z.number().int().positive(),
  positionId: z.number().int().positive().optional(),
  departmentId: z.number().int().positive().optional(),
  statusId: z.number().int().positive().optional(),
  regularHours: z.coerce.number().min(0).optional(),
  extraHours: z.coerce.number().min(0).optional(),
  totalHours: z.coerce.number().min(0).optional(),
  remarkId: z.number().int().positive().optional(),
});

export const updateTimesheetSchema = z.object({
  date: z.coerce.date().optional(),
  employeeId: z.number().int().positive().optional(),
  projectId: z.number().int().positive().optional(),
  positionId: z.number().int().positive().nullable().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  statusId: z.number().int().positive().nullable().optional(),
  regularHours: z.coerce.number().min(0).optional(),
  extraHours: z.coerce.number().min(0).optional(),
  totalHours: z.coerce.number().min(0).optional(),
  remarkId: z.number().int().positive().nullable().optional(),
});

export const timesheetSummarySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ═══════════════════════════════════════════════════
// LPO
// ═══════════════════════════════════════════════════

export const listLpoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  projectId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().default("lpoDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
