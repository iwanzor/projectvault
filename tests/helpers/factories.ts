import type { Permission } from "@/types/next-auth";

let idCounter = 1;
function nextId() {
  return idCounter++;
}

// Reset ID counter between test files if needed
export function resetIdCounter() {
  idCounter = 1;
}

export function createMockUser(overrides?: Record<string, unknown>) {
  const id = nextId();
  return {
    id,
    branchCode: "BR001",
    userCode: `USR${String(id).padStart(3, "0")}`,
    username: `user${id}`,
    passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz012345678901234567890",
    pcName: null,
    voucherPrefix: null,
    loginStatus: false,
    isAdmin: false,
    isActive: true,
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function createMockPermission(
  module: string,
  overrides?: Partial<Permission>
): Permission {
  return {
    module,
    viewAll: false,
    viewDetails: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
    ...overrides,
  };
}

export function createMockItem(overrides?: Record<string, unknown>) {
  const id = nextId();
  return {
    id,
    barcode: `ITEM${String(id).padStart(6, "0")}`,
    name: `Test Item ${id}`,
    modelNo: `MODEL-${id}`,
    unitId: 1,
    brandId: 1,
    mainCategoryId: 1,
    subCategory1Id: 1,
    subCategory2Id: 1,
    packingTypeId: null,
    supplierId: null,
    currencyId: null,
    salesRate: 100.0,
    fobPrice: 50.0,
    defaultPrice: 75.0,
    estimatedArrivalPrice: 60.0,
    shipmentCostPara: 5.0,
    customsCostPara: 3.0,
    conversionRate: 1.0,
    salesMarkup: 20.0,
    vatPerc: 5.0,
    maximumQuantity: 1000.0,
    minimumQuantity: 1.0,
    reOrderQuantity: 10.0,
    weight: 0.0,
    actualWeight: 0.0,
    height: 0.0,
    depth: 0.0,
    width: 0.0,
    volumetricWeight: 0.0,
    packagingDimension: 0.0,
    itemType: "ITEM",
    isActive: true,
    isCombo: false,
    hasSerialNumber: true,
    isServices: false,
    isAccessories: false,
    isLabor: false,
    imagePath: null,
    pdfDocPath: null,
    footprintPath: null,
    estimatedArrivalTime: null,
    manCode1: null,
    manCode2: null,
    createdBy: "USR001",
    updatedBy: "USR001",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function createMockQuotation(overrides?: Record<string, unknown>) {
  const id = nextId();
  return {
    id,
    quotationNo: `SQ-${String(id).padStart(6, "0")}`,
    branchCode: "BR001",
    quotationDate: new Date("2025-01-15T00:00:00Z"),
    customerId: 1,
    quotationTermsId: null,
    description: `Test quotation ${id}`,
    status: "QUOTATION",
    revisionNo: 0,
    totalAmount: 1000.0,
    discountPercentage: 0.0,
    discountAmount: 0.0,
    netAmount: 1000.0,
    vatPerc: 5.0,
    vatAmount: 50.0,
    grossTotal: 1050.0,
    commPerc: null,
    commAmount: null,
    committedBy: null,
    committedDate: null,
    hasRevision: false,
    usedInProject: false,
    isArchived: false,
    createdBy: "USR001",
    updatedBy: "USR001",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function createMockCustomer(overrides?: Record<string, unknown>) {
  const id = nextId();
  return {
    id,
    customerCode: `CUST${String(id).padStart(4, "0")}`,
    name: `Test Customer ${id}`,
    address: "123 Test Street",
    areaId: null,
    cityId: null,
    phone: "+1234567890",
    fax: null,
    mobile: null,
    email: `customer${id}@test.com`,
    other: null,
    contactPerson1: "John Doe",
    cp1Designation: "Manager",
    cp1Email: `contact${id}@test.com`,
    cp1Mobile: null,
    contactPerson2: null,
    cp2Designation: null,
    cp2Email: null,
    cp2Mobile: null,
    contactPerson3: null,
    cp3Designation: null,
    cp3Email: null,
    cp3Mobile: null,
    gpCustomerId: null,
    isExport: false,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}
