import type { PrismaClient } from "../src/generated/prisma/client";

export async function seedSetup(prisma: PrismaClient) {
  console.log("Seeding setup data...");

  // ───────────────────────────────────────────────────
  // 1. Branch
  // ───────────────────────────────────────────────────
  await prisma.branch.createMany({
    data: [
      {
        branchCode: "HQ",
        companyCode: "PV",
        name: "ProjectVault Head Office",
        address1: "Office 301, Al Quoz Industrial Area",
        address2: "Dubai, UAE",
        phone: "+971-4-123-4567",
        email: "info@projectvault.ae",
      },
    ],
    skipDuplicates: true,
  });
  console.log("  Branches seeded");

  // ───────────────────────────────────────────────────
  // 2. Countries (20)
  // ───────────────────────────────────────────────────
  await prisma.country.createMany({
    data: [
      { countryCode: "AE", name: "United Arab Emirates" },
      { countryCode: "SA", name: "Saudi Arabia" },
      { countryCode: "QA", name: "Qatar" },
      { countryCode: "OM", name: "Oman" },
      { countryCode: "BH", name: "Bahrain" },
      { countryCode: "KW", name: "Kuwait" },
      { countryCode: "IN", name: "India" },
      { countryCode: "PK", name: "Pakistan" },
      { countryCode: "PH", name: "Philippines" },
      { countryCode: "EG", name: "Egypt" },
      { countryCode: "JO", name: "Jordan" },
      { countryCode: "LB", name: "Lebanon" },
      { countryCode: "GB", name: "United Kingdom" },
      { countryCode: "US", name: "United States" },
      { countryCode: "DE", name: "Germany" },
      { countryCode: "FR", name: "France" },
      { countryCode: "CN", name: "China" },
      { countryCode: "JP", name: "Japan" },
      { countryCode: "KR", name: "South Korea" },
      { countryCode: "TR", name: "Turkey" },
    ],
    skipDuplicates: true,
  });
  console.log("  Countries seeded (20)");

  // ───────────────────────────────────────────────────
  // 3. Cities (30+) - need country IDs first
  // ───────────────────────────────────────────────────
  const countryMap = new Map<string, number>();
  const countries = await prisma.country.findMany();
  for (const c of countries) {
    countryMap.set(c.countryCode, c.id);
  }

  const cid = (code: string) => {
    const id = countryMap.get(code);
    if (!id) throw new Error(`Country code '${code}' not found`);
    return id;
  };

  await prisma.city.createMany({
    data: [
      // UAE (7)
      { cityCode: "DXB", name: "Dubai", countryId: cid("AE") },
      { cityCode: "AUH", name: "Abu Dhabi", countryId: cid("AE") },
      { cityCode: "SHJ", name: "Sharjah", countryId: cid("AE") },
      { cityCode: "AJM", name: "Ajman", countryId: cid("AE") },
      { cityCode: "RAK", name: "Ras Al Khaimah", countryId: cid("AE") },
      { cityCode: "FUJ", name: "Fujairah", countryId: cid("AE") },
      { cityCode: "AIN", name: "Al Ain", countryId: cid("AE") },
      // Saudi Arabia (3)
      { cityCode: "RUH", name: "Riyadh", countryId: cid("SA") },
      { cityCode: "JED", name: "Jeddah", countryId: cid("SA") },
      { cityCode: "DMM", name: "Dammam", countryId: cid("SA") },
      // Qatar (1)
      { cityCode: "DOH", name: "Doha", countryId: cid("QA") },
      // Oman (1)
      { cityCode: "MCT", name: "Muscat", countryId: cid("OM") },
      // Bahrain (1)
      { cityCode: "BAH", name: "Manama", countryId: cid("BH") },
      // Kuwait (1)
      { cityCode: "KWI", name: "Kuwait City", countryId: cid("KW") },
      // India (3)
      { cityCode: "BOM", name: "Mumbai", countryId: cid("IN") },
      { cityCode: "DEL", name: "Delhi", countryId: cid("IN") },
      { cityCode: "MAA", name: "Chennai", countryId: cid("IN") },
      // Pakistan (2)
      { cityCode: "KHI", name: "Karachi", countryId: cid("PK") },
      { cityCode: "LHE", name: "Lahore", countryId: cid("PK") },
      // Philippines (1)
      { cityCode: "MNL", name: "Manila", countryId: cid("PH") },
      // Egypt (1)
      { cityCode: "CAI", name: "Cairo", countryId: cid("EG") },
      // Jordan (1)
      { cityCode: "AMM", name: "Amman", countryId: cid("JO") },
      // Lebanon (1)
      { cityCode: "BEY", name: "Beirut", countryId: cid("LB") },
      // UK (1)
      { cityCode: "LON", name: "London", countryId: cid("GB") },
      // USA (2)
      { cityCode: "NYC", name: "New York", countryId: cid("US") },
      { cityCode: "HOU", name: "Houston", countryId: cid("US") },
      // Germany (1)
      { cityCode: "FRA", name: "Frankfurt", countryId: cid("DE") },
      // France (1)
      { cityCode: "PAR", name: "Paris", countryId: cid("FR") },
      // China (2)
      { cityCode: "SHA", name: "Shanghai", countryId: cid("CN") },
      { cityCode: "GZH", name: "Guangzhou", countryId: cid("CN") },
      // Japan (1)
      { cityCode: "TYO", name: "Tokyo", countryId: cid("JP") },
      // South Korea (1)
      { cityCode: "SEL", name: "Seoul", countryId: cid("KR") },
      // Turkey (1)
      { cityCode: "IST", name: "Istanbul", countryId: cid("TR") },
    ],
    skipDuplicates: true,
  });
  console.log("  Cities seeded (33)");

  // ───────────────────────────────────────────────────
  // 4. Areas (20) - Dubai areas, need Dubai cityId
  // ───────────────────────────────────────────────────
  const dubai = await prisma.city.findFirst({ where: { cityCode: "DXB" } });
  if (!dubai) throw new Error("Dubai city not found");

  await prisma.area.createMany({
    data: [
      { areaCode: "DEIRA", name: "Deira", cityId: dubai.id },
      { areaCode: "BURDXB", name: "Bur Dubai", cityId: dubai.id },
      { areaCode: "JLT", name: "Jumeirah Lake Towers", cityId: dubai.id },
      { areaCode: "DIFC", name: "DIFC", cityId: dubai.id },
      { areaCode: "BZBAY", name: "Business Bay", cityId: dubai.id },
      { areaCode: "DTOWN", name: "Downtown Dubai", cityId: dubai.id },
      { areaCode: "MARINA", name: "Dubai Marina", cityId: dubai.id },
      { areaCode: "ALQUOZ", name: "Al Quoz", cityId: dubai.id },
      { areaCode: "JBALI", name: "Jebel Ali", cityId: dubai.id },
      { areaCode: "DIP", name: "Dubai Investment Park", cityId: dubai.id },
      { areaCode: "DSO", name: "Dubai Silicon Oasis", cityId: dubai.id },
      { areaCode: "MCITY", name: "Motor City", cityId: dubai.id },
      { areaCode: "SCITY", name: "Sports City", cityId: dubai.id },
      { areaCode: "JVC", name: "Jumeirah Village Circle", cityId: dubai.id },
      { areaCode: "BARSHA", name: "Al Barsha", cityId: dubai.id },
      { areaCode: "KARAMA", name: "Karama", cityId: dubai.id },
      { areaCode: "SATWA", name: "Satwa", cityId: dubai.id },
      { areaCode: "INTCTY", name: "International City", cityId: dubai.id },
      { areaCode: "DISCGD", name: "Discovery Gardens", cityId: dubai.id },
      { areaCode: "NAHDA", name: "Al Nahda", cityId: dubai.id },
    ],
    skipDuplicates: true,
  });
  console.log("  Areas seeded (20)");

  // ───────────────────────────────────────────────────
  // 5. Brands (20)
  // ───────────────────────────────────────────────────
  await prisma.brand.createMany({
    data: [
      { brandCode: "SCH", name: "Schneider Electric" },
      { brandCode: "ABB", name: "ABB" },
      { brandCode: "SIE", name: "Siemens" },
      { brandCode: "LEG", name: "Legrand" },
      { brandCode: "HAG", name: "Hager" },
      { brandCode: "EAT", name: "Eaton" },
      { brandCode: "PHI", name: "Philips" },
      { brandCode: "OSR", name: "Osram" },
      { brandCode: "DAI", name: "Daikin" },
      { brandCode: "CAR", name: "Carrier" },
      { brandCode: "TRA", name: "Trane" },
      { brandCode: "DAN", name: "Danfoss" },
      { brandCode: "GRU", name: "Grundfos" },
      { brandCode: "HON", name: "Honeywell" },
      { brandCode: "BOS", name: "Bosch" },
      { brandCode: "LGE", name: "LG" },
      { brandCode: "SAM", name: "Samsung" },
      { brandCode: "PAN", name: "Panasonic" },
      { brandCode: "MIT", name: "Mitsubishi" },
      { brandCode: "HIT", name: "Hitachi" },
    ],
    skipDuplicates: true,
  });
  console.log("  Brands seeded (20)");

  // ───────────────────────────────────────────────────
  // 6. Main Categories (10)
  // ───────────────────────────────────────────────────
  await prisma.mainCategory.createMany({
    data: [
      { mainCategoryCode: "ELEC", name: "Electrical" },
      { mainCategoryCode: "HVAC", name: "HVAC" },
      { mainCategoryCode: "PLMB", name: "Plumbing" },
      { mainCategoryCode: "FIRE", name: "Fire Fighting" },
      { mainCategoryCode: "LOWC", name: "Low Current" },
      { mainCategoryCode: "CIVL", name: "Civil" },
      { mainCategoryCode: "MECH", name: "Mechanical" },
      { mainCategoryCode: "SAFE", name: "Safety" },
      { mainCategoryCode: "LGHT", name: "Lighting" },
      { mainCategoryCode: "AUTO", name: "Automation" },
    ],
    skipDuplicates: true,
  });
  console.log("  Main Categories seeded (10)");

  // ───────────────────────────────────────────────────
  // 7. Sub Categories 1 (25) - need mainCategoryIds
  // ───────────────────────────────────────────────────
  const mainCatMap = new Map<string, number>();
  const mainCats = await prisma.mainCategory.findMany();
  for (const mc of mainCats) {
    mainCatMap.set(mc.mainCategoryCode, mc.id);
  }

  const mcid = (code: string) => {
    const id = mainCatMap.get(code);
    if (!id) throw new Error(`MainCategory code '${code}' not found`);
    return id;
  };

  await prisma.subCategory1.createMany({
    data: [
      // Electrical (5)
      { subCategory1Code: "CABLES", name: "Cables", mainCategoryId: mcid("ELEC") },
      { subCategory1Code: "SWGEAR", name: "Switchgear", mainCategoryId: mcid("ELEC") },
      { subCategory1Code: "DISTBD", name: "Distribution Boards", mainCategoryId: mcid("ELEC") },
      { subCategory1Code: "WRACC", name: "Wiring Accessories", mainCategoryId: mcid("ELEC") },
      { subCategory1Code: "EARTH", name: "Earthing", mainCategoryId: mcid("ELEC") },
      // HVAC (5)
      { subCategory1Code: "ACUNIT", name: "AC Units", mainCategoryId: mcid("HVAC") },
      { subCategory1Code: "DUCT", name: "Ducting", mainCategoryId: mcid("HVAC") },
      { subCategory1Code: "HVCTRL", name: "Controls", mainCategoryId: mcid("HVAC") },
      { subCategory1Code: "INSUL", name: "Insulation", mainCategoryId: mcid("HVAC") },
      { subCategory1Code: "CHILL", name: "Chillers", mainCategoryId: mcid("HVAC") },
      // Plumbing (5)
      { subCategory1Code: "PIPES", name: "Pipes", mainCategoryId: mcid("PLMB") },
      { subCategory1Code: "FITTNG", name: "Fittings", mainCategoryId: mcid("PLMB") },
      { subCategory1Code: "VALVES", name: "Valves", mainCategoryId: mcid("PLMB") },
      { subCategory1Code: "PUMPS", name: "Pumps", mainCategoryId: mcid("PLMB") },
      { subCategory1Code: "SANWR", name: "Sanitaryware", mainCategoryId: mcid("PLMB") },
      // Fire Fighting (5)
      { subCategory1Code: "DETECT", name: "Detection", mainCategoryId: mcid("FIRE") },
      { subCategory1Code: "SUPPR", name: "Suppression", mainCategoryId: mcid("FIRE") },
      { subCategory1Code: "ALARM", name: "Alarms", mainCategoryId: mcid("FIRE") },
      { subCategory1Code: "HOSE", name: "Hose Systems", mainCategoryId: mcid("FIRE") },
      { subCategory1Code: "EXTING", name: "Extinguishers", mainCategoryId: mcid("FIRE") },
      // Low Current (1)
      { subCategory1Code: "CCTV", name: "CCTV Systems", mainCategoryId: mcid("LOWC") },
      // Civil (1)
      { subCategory1Code: "STRUC", name: "Structural", mainCategoryId: mcid("CIVL") },
      // Mechanical (1)
      { subCategory1Code: "LIFTS", name: "Lifts & Elevators", mainCategoryId: mcid("MECH") },
      // Safety (1)
      { subCategory1Code: "PPE", name: "PPE Equipment", mainCategoryId: mcid("SAFE") },
      // Lighting (1)
      { subCategory1Code: "INTLGT", name: "Interior Lighting", mainCategoryId: mcid("LGHT") },
    ],
    skipDuplicates: true,
  });
  console.log("  Sub Categories 1 seeded (25)");

  // ───────────────────────────────────────────────────
  // 8. Sub Categories 2 (30) - need subCategory1Ids
  // ───────────────────────────────────────────────────
  const subCat1Map = new Map<string, number>();
  const subCats1 = await prisma.subCategory1.findMany();
  for (const sc of subCats1) {
    subCat1Map.set(sc.subCategory1Code, sc.id);
  }

  const sc1id = (code: string) => {
    const id = subCat1Map.get(code);
    if (!id) throw new Error(`SubCategory1 code '${code}' not found`);
    return id;
  };

  await prisma.subCategory2.createMany({
    data: [
      // Under Cables (3)
      { subCategory2Code: "LVCBL", name: "LV Cables", subCategory1Id: sc1id("CABLES") },
      { subCategory2Code: "MVCBL", name: "MV Cables", subCategory1Id: sc1id("CABLES") },
      { subCategory2Code: "CTRLCBL", name: "Control Cables", subCategory1Id: sc1id("CABLES") },
      // Under Switchgear (4)
      { subCategory2Code: "MCB", name: "MCB", subCategory1Id: sc1id("SWGEAR") },
      { subCategory2Code: "MCCB", name: "MCCB", subCategory1Id: sc1id("SWGEAR") },
      { subCategory2Code: "ACB", name: "ACB", subCategory1Id: sc1id("SWGEAR") },
      { subCategory2Code: "CONTCTR", name: "Contactors", subCategory1Id: sc1id("SWGEAR") },
      // Under Distribution Boards (2)
      { subCategory2Code: "MDB", name: "Main Distribution Board", subCategory1Id: sc1id("DISTBD") },
      { subCategory2Code: "SMDB", name: "Sub Main Distribution Board", subCategory1Id: sc1id("DISTBD") },
      // Under Wiring Accessories (2)
      { subCategory2Code: "SOCKET", name: "Sockets & Outlets", subCategory1Id: sc1id("WRACC") },
      { subCategory2Code: "SWITCH", name: "Switches", subCategory1Id: sc1id("WRACC") },
      // Under Earthing (1)
      { subCategory2Code: "ERTHRD", name: "Earthing Rods", subCategory1Id: sc1id("EARTH") },
      // Under AC Units (4)
      { subCategory2Code: "SPLITAC", name: "Split AC", subCategory1Id: sc1id("ACUNIT") },
      { subCategory2Code: "CASSAC", name: "Cassette AC", subCategory1Id: sc1id("ACUNIT") },
      { subCategory2Code: "DUCTAC", name: "Duct AC", subCategory1Id: sc1id("ACUNIT") },
      { subCategory2Code: "VRF", name: "VRF Systems", subCategory1Id: sc1id("ACUNIT") },
      // Under Ducting (2)
      { subCategory2Code: "GIDUCT", name: "GI Ducting", subCategory1Id: sc1id("DUCT") },
      { subCategory2Code: "FLEXDC", name: "Flexible Duct", subCategory1Id: sc1id("DUCT") },
      // Under Pipes (4)
      { subCategory2Code: "UPVC", name: "UPVC Pipes", subCategory1Id: sc1id("PIPES") },
      { subCategory2Code: "PPR", name: "PPR Pipes", subCategory1Id: sc1id("PIPES") },
      { subCategory2Code: "GIPIPE", name: "GI Pipes", subCategory1Id: sc1id("PIPES") },
      { subCategory2Code: "COPPER", name: "Copper Pipes", subCategory1Id: sc1id("PIPES") },
      // Under Valves (2)
      { subCategory2Code: "GATEV", name: "Gate Valves", subCategory1Id: sc1id("VALVES") },
      { subCategory2Code: "BALLV", name: "Ball Valves", subCategory1Id: sc1id("VALVES") },
      // Under Detection (2)
      { subCategory2Code: "SMKDET", name: "Smoke Detectors", subCategory1Id: sc1id("DETECT") },
      { subCategory2Code: "HTDET", name: "Heat Detectors", subCategory1Id: sc1id("DETECT") },
      // Under Suppression (2)
      { subCategory2Code: "SPRINK", name: "Sprinkler Systems", subCategory1Id: sc1id("SUPPR") },
      { subCategory2Code: "FM200", name: "FM200 Systems", subCategory1Id: sc1id("SUPPR") },
      // Under Alarms (1)
      { subCategory2Code: "FALRM", name: "Fire Alarm Panels", subCategory1Id: sc1id("ALARM") },
      // Under Hose Systems (1)
      { subCategory2Code: "HOSERL", name: "Hose Reels", subCategory1Id: sc1id("HOSE") },
    ],
    skipDuplicates: true,
  });
  console.log("  Sub Categories 2 seeded (30)");

  // ───────────────────────────────────────────────────
  // 9. Units (15)
  // ───────────────────────────────────────────────────
  await prisma.unit.createMany({
    data: [
      { unitCode: "PCS", name: "Pieces" },
      { unitCode: "SET", name: "Set" },
      { unitCode: "MTR", name: "Meter" },
      { unitCode: "KG", name: "Kilogram" },
      { unitCode: "LTR", name: "Liter" },
      { unitCode: "BOX", name: "Box" },
      { unitCode: "ROLL", name: "Roll" },
      { unitCode: "SQM", name: "Square Meter" },
      { unitCode: "CUM", name: "Cubic Meter" },
      { unitCode: "LOT", name: "Lot" },
      { unitCode: "BAG", name: "Bag" },
      { unitCode: "DRUM", name: "Drum" },
      { unitCode: "PAIR", name: "Pair" },
      { unitCode: "EACH", name: "Each" },
      { unitCode: "PACK", name: "Pack" },
    ],
    skipDuplicates: true,
  });
  console.log("  Units seeded (15)");

  // ───────────────────────────────────────────────────
  // 10. Packing Types (8)
  // ───────────────────────────────────────────────────
  await prisma.packingType.createMany({
    data: [
      { packingTypeCode: "BOX", name: "Box" },
      { packingTypeCode: "CTN", name: "Carton" },
      { packingTypeCode: "PLT", name: "Pallet" },
      { packingTypeCode: "BDL", name: "Bundle" },
      { packingTypeCode: "DRM", name: "Drum" },
      { packingTypeCode: "RLL", name: "Roll" },
      { packingTypeCode: "BAG", name: "Bag" },
      { packingTypeCode: "LSE", name: "Loose" },
    ],
    skipDuplicates: true,
  });
  console.log("  Packing Types seeded (8)");

  // ───────────────────────────────────────────────────
  // 11. Currencies (10)
  // ───────────────────────────────────────────────────
  await prisma.currency.createMany({
    data: [
      { currencyCode: "AED", name: "UAE Dirham", symbol: "AED", conversionRate: 1.0 },
      { currencyCode: "SAR", name: "Saudi Riyal", symbol: "SAR", conversionRate: 0.98 },
      { currencyCode: "QAR", name: "Qatari Riyal", symbol: "QAR", conversionRate: 1.01 },
      { currencyCode: "OMR", name: "Omani Rial", symbol: "OMR", conversionRate: 9.55 },
      { currencyCode: "BHD", name: "Bahraini Dinar", symbol: "BHD", conversionRate: 9.75 },
      { currencyCode: "KWD", name: "Kuwaiti Dinar", symbol: "KWD", conversionRate: 11.95 },
      { currencyCode: "USD", name: "US Dollar", symbol: "$", conversionRate: 3.67 },
      { currencyCode: "EUR", name: "Euro", symbol: "\u20AC", conversionRate: 3.98 },
      { currencyCode: "GBP", name: "British Pound", symbol: "\u00A3", conversionRate: 4.65 },
      { currencyCode: "INR", name: "Indian Rupee", symbol: "\u20B9", conversionRate: 0.044 },
    ],
    skipDuplicates: true,
  });
  console.log("  Currencies seeded (10)");

  // ───────────────────────────────────────────────────
  // 12. VAT Rates (5)
  // ───────────────────────────────────────────────────
  await prisma.vatRate.createMany({
    data: [
      { vatCode: "VAT0", name: "Zero Rated", vatPerc: 0 },
      { vatCode: "VAT5", name: "Standard 5%", vatPerc: 5 },
      { vatCode: "VAT10", name: "Standard 10%", vatPerc: 10 },
      { vatCode: "VAT15", name: "Standard 15%", vatPerc: 15 },
      { vatCode: "EXEMPT", name: "Exempt", vatPerc: 0 },
    ],
    skipDuplicates: true,
  });
  console.log("  VAT Rates seeded (5)");

  // ───────────────────────────────────────────────────
  // 13. Quotation Terms (10)
  // ───────────────────────────────────────────────────
  await prisma.quotationTerms.createMany({
    data: [
      { quotationTermsCode: "PMT30", terms: "Payment within 30 days from the date of invoice." },
      { quotationTermsCode: "ADV50", terms: "50% advance payment required before commencement of work." },
      { quotationTermsCode: "DEL46", terms: "Delivery within 4-6 weeks from the date of confirmed order." },
      { quotationTermsCode: "VAL30", terms: "Prices valid for 30 days from the date of quotation." },
      { quotationTermsCode: "WAR12", terms: "Warranty for 12 months from the date of commissioning." },
      { quotationTermsCode: "INST", terms: "Installation included in the quoted price." },
      { quotationTermsCode: "FOBDXB", terms: "FOB Dubai warehouse, freight not included." },
      { quotationTermsCode: "CIFD", terms: "CIF Destination, all charges included up to delivery point." },
      { quotationTermsCode: "SUBAV", terms: "Subject to stock availability at the time of order confirmation." },
      { quotationTermsCode: "EXVAT", terms: "All prices are exclusive of VAT. VAT will be charged as applicable." },
    ],
    skipDuplicates: true,
  });
  console.log("  Quotation Terms seeded (10)");

  // ───────────────────────────────────────────────────
  // 14. Document Info (10)
  // ───────────────────────────────────────────────────
  await prisma.documentInfo.createMany({
    data: [
      { documentCode: "LPO", description: "Local Purchase Order" },
      { documentCode: "INV", description: "Invoice" },
      { documentCode: "DN", description: "Delivery Note" },
      { documentCode: "PL", description: "Packing List" },
      { documentCode: "COO", description: "Certificate of Origin" },
      { documentCode: "TC", description: "Test Certificate" },
      { documentCode: "MS", description: "Material Submittal" },
      { documentCode: "SD", description: "Shop Drawing" },
      { documentCode: "ABD", description: "As-Built Drawing" },
      { documentCode: "OMM", description: "O&M Manual" },
    ],
    skipDuplicates: true,
  });
  console.log("  Document Info seeded (10)");

  // ───────────────────────────────────────────────────
  // 15. Payment Types (5)
  // ───────────────────────────────────────────────────
  await prisma.paymentType.createMany({
    data: [
      { paymentTypeCode: "CASH", name: "Cash" },
      { paymentTypeCode: "BT", name: "Bank Transfer" },
      { paymentTypeCode: "CHQ", name: "Cheque" },
      { paymentTypeCode: "CC", name: "Credit Card" },
      { paymentTypeCode: "LC", name: "Letter of Credit" },
    ],
    skipDuplicates: true,
  });
  console.log("  Payment Types seeded (5)");

  // ───────────────────────────────────────────────────
  // 16. Payment Channels (5)
  // ───────────────────────────────────────────────────
  await prisma.paymentChannel.createMany({
    data: [
      { paymentChannelCode: "DIRECT", name: "Direct Payment" },
      { paymentChannelCode: "AGENT", name: "Through Agent" },
      { paymentChannelCode: "ONLINE", name: "Online Transfer" },
      { paymentChannelCode: "WIRE", name: "Wire Transfer" },
      { paymentChannelCode: "LCHAN", name: "LC Channel" },
    ],
    skipDuplicates: true,
  });
  console.log("  Payment Channels seeded (5)");

  // ───────────────────────────────────────────────────
  // 17. Purposes (10)
  // ───────────────────────────────────────────────────
  await prisma.purpose.createMany({
    data: [
      { purposeCode: "MATPUR", name: "Material Purchase" },
      { purposeCode: "SUBPAY", name: "Subcontractor Payment" },
      { purposeCode: "SAL", name: "Salary Payment" },
      { purposeCode: "RENT", name: "Office Rent" },
      { purposeCode: "UTIL", name: "Utilities" },
      { purposeCode: "INS", name: "Insurance" },
      { purposeCode: "LIC", name: "License & Permits" },
      { purposeCode: "TRANS", name: "Transportation" },
      { purposeCode: "MISC", name: "Miscellaneous" },
      { purposeCode: "PETTY", name: "Petty Cash" },
    ],
    skipDuplicates: true,
  });
  console.log("  Purposes seeded (10)");

  // ───────────────────────────────────────────────────
  // 18. AccEmployeeStatus (5)
  // ───────────────────────────────────────────────────
  await prisma.accEmployeeStatus.createMany({
    data: [
      { statusCode: "ACT", name: "Active" },
      { statusCode: "LEAVE", name: "On Leave" },
      { statusCode: "PROB", name: "Probation" },
      { statusCode: "TERM", name: "Terminated" },
      { statusCode: "RESG", name: "Resigned" },
    ],
    skipDuplicates: true,
  });
  console.log("  AccEmployeeStatus seeded (5)");

  // ───────────────────────────────────────────────────
  // 19. AccPosition (8)
  // ───────────────────────────────────────────────────
  await prisma.accPosition.createMany({
    data: [
      { positionCode: "PM", name: "Project Manager" },
      { positionCode: "SE", name: "Site Engineer" },
      { positionCode: "FM", name: "Foreman" },
      { positionCode: "ELEC", name: "Electrician" },
      { positionCode: "PLMB", name: "Plumber" },
      { positionCode: "HVACT", name: "HVAC Technician" },
      { positionCode: "SO", name: "Safety Officer" },
      { positionCode: "SK", name: "Store Keeper" },
    ],
    skipDuplicates: true,
  });
  console.log("  AccPositions seeded (8)");

  // ───────────────────────────────────────────────────
  // 20. AccDepartment (5)
  // ───────────────────────────────────────────────────
  await prisma.accDepartment.createMany({
    data: [
      { departmentCode: "MEP", name: "MEP Department" },
      { departmentCode: "ELEC", name: "Electrical Department" },
      { departmentCode: "HVAC", name: "HVAC Department" },
      { departmentCode: "PLMB", name: "Plumbing Department" },
      { departmentCode: "ADMIN", name: "Administration" },
    ],
    skipDuplicates: true,
  });
  console.log("  AccDepartments seeded (5)");

  // ───────────────────────────────────────────────────
  // 21. AccRemark (5)
  // ───────────────────────────────────────────────────
  await prisma.accRemark.createMany({
    data: [
      { remarkCode: "PRES", name: "Present" },
      { remarkCode: "ABS", name: "Absent" },
      { remarkCode: "HALF", name: "Half Day" },
      { remarkCode: "OT", name: "Overtime" },
      { remarkCode: "HOL", name: "Holiday" },
    ],
    skipDuplicates: true,
  });
  console.log("  AccRemarks seeded (5)");

  console.log("Setup data seeding complete!");
}
