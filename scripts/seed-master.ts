import type { PrismaClient } from "../src/generated/prisma/client";

export async function seedMaster(prisma: PrismaClient) {
  console.log("Seeding master data...");

  // ─── LOOKUP: Fetch all setup data we need ──────────────────────────

  const brands = await prisma.brand.findMany();
  const mainCategories = await prisma.mainCategory.findMany();
  const subCategories1 = await prisma.subCategory1.findMany();
  const subCategories2 = await prisma.subCategory2.findMany();
  const units = await prisma.unit.findMany();
  const packingTypes = await prisma.packingType.findMany();
  const currencies = await prisma.currency.findMany();
  const cities = await prisma.city.findMany();
  const countries = await prisma.country.findMany();

  // Helper functions to find IDs
  function brandId(nameSearch: string): number | null {
    const b = brands.find((x) => x.name.toLowerCase().includes(nameSearch.toLowerCase()));
    return b?.id ?? null;
  }

  function mainCatId(nameSearch: string): number | null {
    const c = mainCategories.find((x) => x.name.toLowerCase().includes(nameSearch.toLowerCase()));
    return c?.id ?? null;
  }

  function subCat1Id(nameSearch: string, mainCatIdFilter?: number | null): number | null {
    const candidates = mainCatIdFilter
      ? subCategories1.filter((x) => x.mainCategoryId === mainCatIdFilter)
      : subCategories1;
    const s = candidates.find((x) => x.name.toLowerCase().includes(nameSearch.toLowerCase()));
    return s?.id ?? subCategories1.find((x) => x.name.toLowerCase().includes(nameSearch.toLowerCase()))?.id ?? null;
  }

  function subCat2Id(nameSearch: string, subCat1IdFilter?: number | null): number | null {
    const candidates = subCat1IdFilter
      ? subCategories2.filter((x) => x.subCategory1Id === subCat1IdFilter)
      : subCategories2;
    const s = candidates.find((x) => x.name.toLowerCase().includes(nameSearch.toLowerCase()));
    return s?.id ?? subCategories2.find((x) => x.name.toLowerCase().includes(nameSearch.toLowerCase()))?.id ?? null;
  }

  function unitId(nameSearch: string): number | null {
    const u = units.find(
      (x) =>
        x.unitCode.toLowerCase() === nameSearch.toLowerCase() ||
        x.name.toLowerCase().includes(nameSearch.toLowerCase()),
    );
    return u?.id ?? null;
  }

  function packingTypeId(nameSearch: string): number | null {
    const p = packingTypes.find(
      (x) =>
        x.packingTypeCode.toLowerCase() === nameSearch.toLowerCase() ||
        x.name.toLowerCase().includes(nameSearch.toLowerCase()),
    );
    return p?.id ?? null;
  }

  function currencyId(codeSearch: string): number | null {
    const c = currencies.find(
      (x) =>
        x.currencyCode.toLowerCase() === codeSearch.toLowerCase() ||
        x.name.toLowerCase().includes(codeSearch.toLowerCase()),
    );
    return c?.id ?? null;
  }

  function cityId(nameSearch: string): number | null {
    const c = cities.find((x) => x.name.toLowerCase().includes(nameSearch.toLowerCase()));
    return c?.id ?? null;
  }

  // Resolve common IDs
  const pcsUnitId = unitId("PCS") ?? unitId("pcs") ?? unitId("piece");
  const mtrUnitId = unitId("MTR") ?? unitId("mtr") ?? unitId("meter");
  const setUnitId = unitId("SET") ?? unitId("set");

  const defaultPackingId = packingTypes.length > 0 ? packingTypes[0].id : null;
  const aedCurrencyId = currencyId("AED");

  const dubaiCityId = cityId("Dubai");
  const abuDhabiCityId = cityId("Abu Dhabi");
  const sharjahCityId = cityId("Sharjah");
  const ajmanCityId = cityId("Ajman");

  // Brand IDs
  const schneiderId = brandId("Schneider");
  const abbId = brandId("ABB");
  const legrandId = brandId("Legrand");
  const daikinId = brandId("Daikin");
  const danfossId = brandId("Danfoss");
  const grundfosId = brandId("Grundfos");
  const honeywellId = brandId("Honeywell");
  const philipsId = brandId("Philips");

  // Main category IDs
  const electricalMainCatId = mainCatId("Electrical");
  const hvacMainCatId = mainCatId("HVAC");
  const plumbingMainCatId = mainCatId("Plumbing");
  const fireFightingMainCatId = mainCatId("Fire");
  const lightingMainCatId = mainCatId("Lighting");

  // Sub-category 1 IDs (level 1 under main categories)
  const switchgearSubCat1 = subCat1Id("Switchgear", electricalMainCatId);
  const distributionBoardsSubCat1 = subCat1Id("Distribution", electricalMainCatId);
  const cablesSubCat1 = subCat1Id("Cable", electricalMainCatId);
  const wiringAccessoriesSubCat1 = subCat1Id("Wiring", electricalMainCatId);
  const acUnitsSubCat1 = subCat1Id("AC Unit", hvacMainCatId) ?? subCat1Id("Unit", hvacMainCatId);
  const ductingSubCat1 = subCat1Id("Duct", hvacMainCatId);
  const insulationSubCat1 = subCat1Id("Insulation", hvacMainCatId);
  const pipesSubCat1 = subCat1Id("Pipe", plumbingMainCatId);
  const valvesSubCat1 = subCat1Id("Valve", plumbingMainCatId);
  const pumpsSubCat1 = subCat1Id("Pump", plumbingMainCatId);
  const detectionSubCat1 = subCat1Id("Detection", fireFightingMainCatId);
  const alarmsSubCat1 = subCat1Id("Alarm", fireFightingMainCatId);
  const suppressionSubCat1 = subCat1Id("Suppression", fireFightingMainCatId);
  const hoseSystemsSubCat1 = subCat1Id("Hose", fireFightingMainCatId);
  const extinguishersSubCat1 = subCat1Id("Extinguisher", fireFightingMainCatId);

  // Sub-category 2 IDs (level 2 under sub-categories 1)
  const mcbSubCat2 = subCat2Id("MCB", switchgearSubCat1);
  const mccbSubCat2 = subCat2Id("MCCB", switchgearSubCat1);
  const lvCablesSubCat2 = subCat2Id("LV", cablesSubCat1);
  const mvCablesSubCat2 = subCat2Id("MV", cablesSubCat1);
  const splitAcSubCat2 = subCat2Id("Split", acUnitsSubCat1);
  const cassetteAcSubCat2 = subCat2Id("Cassette", acUnitsSubCat1);
  const vrfSubCat2 = subCat2Id("VRF", acUnitsSubCat1);
  const upvcSubCat2 = subCat2Id("UPVC", pipesSubCat1);
  const pprSubCat2 = subCat2Id("PPR", pipesSubCat1);

  // ─── Fallback: use the first subCategory2 if we can't find a specific match
  // Because subCategory2Id is required in the schema, we need a fallback
  function resolveSubCat2(
    primary: number | null,
    subCat1: number | null,
    ...fallbackSearches: string[]
  ): number | null {
    if (primary) return primary;
    // Try to find any subCat2 under the given subCat1
    if (subCat1) {
      const anyUnderSubCat1 = subCategories2.find((x) => x.subCategory1Id === subCat1);
      if (anyUnderSubCat1) return anyUnderSubCat1.id;
    }
    // Try fallback searches
    for (const search of fallbackSearches) {
      const found = subCat2Id(search);
      if (found) return found;
    }
    // Last resort: first available subCategory2
    return subCategories2.length > 0 ? subCategories2[0].id : null;
  }

  // Fallback: first available sub-category 1 for main categories that may not have matched
  function resolveSubCat1(primary: number | null, mainCat: number | null): number | null {
    if (primary) return primary;
    if (mainCat) {
      const anyUnderMainCat = subCategories1.find((x) => x.mainCategoryId === mainCat);
      if (anyUnderMainCat) return anyUnderMainCat.id;
    }
    return subCategories1.length > 0 ? subCategories1[0].id : null;
  }

  // ─── 1. ITEMS ──────────────────────────────────────────────────────

  console.log("  Seeding items...");

  // Validate we have minimal required setup data
  if (brands.length === 0 || mainCategories.length === 0 || subCategories1.length === 0 || subCategories2.length === 0 || units.length === 0) {
    console.warn("  WARNING: Missing setup data (brands, categories, units). Skipping items.");
  } else {
    // Use the first brand as a fallback
    const fallbackBrandId = brands[0].id;
    const fallbackMainCatId = mainCategories[0].id;
    const fallbackSubCat1Id = subCategories1[0].id;
    const fallbackSubCat2Id = subCategories2[0].id;
    const fallbackUnitId = units[0].id;

    // Distribution Boards sub-category 2: try to find one, or use fallback
    const distBoardSubCat2 = resolveSubCat2(
      subCat2Id("Distribution", distributionBoardsSubCat1),
      distributionBoardsSubCat1,
      "Distribution",
    );

    // Wiring Accessories sub-category 2
    const wiringAccSubCat2 = resolveSubCat2(
      subCat2Id("Wiring", wiringAccessoriesSubCat1),
      wiringAccessoriesSubCat1,
      "Wiring", "Accessory",
    );

    // Ducting sub-category 2
    const ductingSubCat2 = resolveSubCat2(
      subCat2Id("Duct", ductingSubCat1),
      ductingSubCat1,
      "Duct",
    );

    // Insulation sub-category 2
    const insulationSubCat2 = resolveSubCat2(
      subCat2Id("Insulation", insulationSubCat1),
      insulationSubCat1,
      "Insulation",
    );

    // Valves sub-category 2
    const valvesSubCat2 = resolveSubCat2(
      subCat2Id("Valve", valvesSubCat1),
      valvesSubCat1,
      "Valve",
    );

    // Pumps sub-category 2
    const pumpsSubCat2 = resolveSubCat2(
      subCat2Id("Pump", pumpsSubCat1),
      pumpsSubCat1,
      "Pump",
    );

    // Detection sub-category 2
    const detectionSubCat2 = resolveSubCat2(
      subCat2Id("Detection", detectionSubCat1),
      detectionSubCat1,
      "Detection",
    );

    // Alarms sub-category 2
    const alarmsSubCat2 = resolveSubCat2(
      subCat2Id("Alarm", alarmsSubCat1),
      alarmsSubCat1,
      "Alarm",
    );

    // Suppression sub-category 2
    const suppressionSubCat2 = resolveSubCat2(
      subCat2Id("Suppression", suppressionSubCat1),
      suppressionSubCat1,
      "Suppression",
    );

    // Hose Systems sub-category 2
    const hoseSubCat2 = resolveSubCat2(
      subCat2Id("Hose", hoseSystemsSubCat1),
      hoseSystemsSubCat1,
      "Hose",
    );

    // Extinguishers sub-category 2
    const extinguisherSubCat2 = resolveSubCat2(
      subCat2Id("Extinguisher", extinguishersSubCat1),
      extinguishersSubCat1,
      "Extinguisher",
    );

    // Lighting sub-category 1 and 2
    const lightingSubCat1 = resolveSubCat1(
      subCat1Id("Lighting", lightingMainCatId) ?? subCat1Id("Light", lightingMainCatId),
      lightingMainCatId,
    );
    const lightingSubCat2 = resolveSubCat2(
      subCat2Id("Light", lightingSubCat1),
      lightingSubCat1,
      "Light", "LED",
    );

    interface ItemDef {
      barcode: string;
      name: string;
      modelNo: string;
      brandId: number;
      mainCategoryId: number;
      subCategory1Id: number;
      subCategory2Id: number;
      unitId: number;
      fobPrice: number;
    }

    const itemDefs: ItemDef[] = [
      // 1-4: MCBs - Schneider - Electrical/Switchgear/MCB
      { barcode: "ITM-0001", name: "MCB 1P 6A", modelNo: "A9F74106", brandId: schneiderId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: switchgearSubCat1 ?? fallbackSubCat1Id, subCategory2Id: mcbSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 25 },
      { barcode: "ITM-0002", name: "MCB 1P 16A", modelNo: "A9F74116", brandId: schneiderId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: switchgearSubCat1 ?? fallbackSubCat1Id, subCategory2Id: mcbSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 28 },
      { barcode: "ITM-0003", name: "MCB 1P 20A", modelNo: "A9F74120", brandId: schneiderId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: switchgearSubCat1 ?? fallbackSubCat1Id, subCategory2Id: mcbSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 30 },
      { barcode: "ITM-0004", name: "MCB 3P 32A", modelNo: "A9F74332", brandId: schneiderId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: switchgearSubCat1 ?? fallbackSubCat1Id, subCategory2Id: mcbSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 95 },
      // 5-6: MCCBs - ABB - Electrical/Switchgear/MCCB
      { barcode: "ITM-0005", name: "MCCB 3P 100A", modelNo: "1SDA067153R1", brandId: abbId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: switchgearSubCat1 ?? fallbackSubCat1Id, subCategory2Id: mccbSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 850 },
      { barcode: "ITM-0006", name: "MCCB 3P 250A", modelNo: "1SDA067399R1", brandId: abbId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: switchgearSubCat1 ?? fallbackSubCat1Id, subCategory2Id: mccbSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 1800 },
      // 7-8: Distribution Boards - Schneider
      { barcode: "ITM-0007", name: "Distribution Board 12 Way", modelNo: "PRA10264", brandId: schneiderId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: distributionBoardsSubCat1 ?? resolveSubCat1(null, electricalMainCatId) ?? fallbackSubCat1Id, subCategory2Id: distBoardSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 450 },
      { barcode: "ITM-0008", name: "Distribution Board 24 Way", modelNo: "PRA10548", brandId: schneiderId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: distributionBoardsSubCat1 ?? resolveSubCat1(null, electricalMainCatId) ?? fallbackSubCat1Id, subCategory2Id: distBoardSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 780 },
      // 9-10: LV Cables - Legrand
      { barcode: "ITM-0009", name: "Cable 4C x 6mm NYY", modelNo: "NYY-4C-6MM", brandId: legrandId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: cablesSubCat1 ?? fallbackSubCat1Id, subCategory2Id: lvCablesSubCat2 ?? resolveSubCat2(null, cablesSubCat1, "LV", "Cable") ?? fallbackSubCat2Id, unitId: mtrUnitId ?? fallbackUnitId, fobPrice: 12 },
      { barcode: "ITM-0010", name: "Cable 4C x 16mm NYY", modelNo: "NYY-4C-16MM", brandId: legrandId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: cablesSubCat1 ?? fallbackSubCat1Id, subCategory2Id: lvCablesSubCat2 ?? resolveSubCat2(null, cablesSubCat1, "LV", "Cable") ?? fallbackSubCat2Id, unitId: mtrUnitId ?? fallbackUnitId, fobPrice: 28 },
      // 11: MV Cables - Legrand
      { barcode: "ITM-0011", name: "Cable 1C x 95mm XLPE", modelNo: "XLPE-1C-95MM", brandId: legrandId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: cablesSubCat1 ?? fallbackSubCat1Id, subCategory2Id: mvCablesSubCat2 ?? resolveSubCat2(null, cablesSubCat1, "MV", "Cable") ?? fallbackSubCat2Id, unitId: mtrUnitId ?? fallbackUnitId, fobPrice: 65 },
      // 12: Cable Tray - Legrand - Electrical/Cables/LV
      { barcode: "ITM-0012", name: "Cable Tray 300mm Perforated", modelNo: "CT-300-PERF", brandId: legrandId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: cablesSubCat1 ?? fallbackSubCat1Id, subCategory2Id: lvCablesSubCat2 ?? resolveSubCat2(null, cablesSubCat1, "LV", "Cable") ?? fallbackSubCat2Id, unitId: mtrUnitId ?? fallbackUnitId, fobPrice: 45 },
      // 13-14: PVC Conduits - Legrand - Electrical/Wiring Accessories
      { barcode: "ITM-0013", name: "PVC Conduit 20mm", modelNo: "PVC-20MM", brandId: legrandId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: wiringAccessoriesSubCat1 ?? resolveSubCat1(null, electricalMainCatId) ?? fallbackSubCat1Id, subCategory2Id: wiringAccSubCat2 ?? fallbackSubCat2Id, unitId: mtrUnitId ?? fallbackUnitId, fobPrice: 3.5 },
      { barcode: "ITM-0014", name: "PVC Conduit 25mm", modelNo: "PVC-25MM", brandId: legrandId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: wiringAccessoriesSubCat1 ?? resolveSubCat1(null, electricalMainCatId) ?? fallbackSubCat1Id, subCategory2Id: wiringAccSubCat2 ?? fallbackSubCat2Id, unitId: mtrUnitId ?? fallbackUnitId, fobPrice: 5 },
      // 15-16: Socket/Switch - Schneider - Electrical/Wiring Accessories
      { barcode: "ITM-0015", name: "Socket Outlet 13A", modelNo: "E8215-15-WE", brandId: schneiderId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: wiringAccessoriesSubCat1 ?? resolveSubCat1(null, electricalMainCatId) ?? fallbackSubCat1Id, subCategory2Id: wiringAccSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 18 },
      { barcode: "ITM-0016", name: "Light Switch 1 Gang", modelNo: "E8231-1-WE", brandId: schneiderId ?? fallbackBrandId, mainCategoryId: electricalMainCatId ?? fallbackMainCatId, subCategory1Id: wiringAccessoriesSubCat1 ?? resolveSubCat1(null, electricalMainCatId) ?? fallbackSubCat1Id, subCategory2Id: wiringAccSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 15 },
      // 17-18: Split AC - Daikin - HVAC/AC Units/Split AC
      { barcode: "ITM-0017", name: "Split AC 1.5 Ton", modelNo: "FTKM50UV16", brandId: daikinId ?? fallbackBrandId, mainCategoryId: hvacMainCatId ?? fallbackMainCatId, subCategory1Id: acUnitsSubCat1 ?? resolveSubCat1(null, hvacMainCatId) ?? fallbackSubCat1Id, subCategory2Id: splitAcSubCat2 ?? resolveSubCat2(null, acUnitsSubCat1, "Split", "AC") ?? fallbackSubCat2Id, unitId: setUnitId ?? pcsUnitId ?? fallbackUnitId, fobPrice: 2200 },
      { barcode: "ITM-0018", name: "Split AC 2 Ton", modelNo: "FTKM60UV16", brandId: daikinId ?? fallbackBrandId, mainCategoryId: hvacMainCatId ?? fallbackMainCatId, subCategory1Id: acUnitsSubCat1 ?? resolveSubCat1(null, hvacMainCatId) ?? fallbackSubCat1Id, subCategory2Id: splitAcSubCat2 ?? resolveSubCat2(null, acUnitsSubCat1, "Split", "AC") ?? fallbackSubCat2Id, unitId: setUnitId ?? pcsUnitId ?? fallbackUnitId, fobPrice: 2800 },
      // 19: Cassette AC - Daikin - HVAC/AC Units/Cassette AC
      { barcode: "ITM-0019", name: "Cassette AC 3 Ton", modelNo: "FCAG100B", brandId: daikinId ?? fallbackBrandId, mainCategoryId: hvacMainCatId ?? fallbackMainCatId, subCategory1Id: acUnitsSubCat1 ?? resolveSubCat1(null, hvacMainCatId) ?? fallbackSubCat1Id, subCategory2Id: cassetteAcSubCat2 ?? resolveSubCat2(null, acUnitsSubCat1, "Cassette", "AC") ?? fallbackSubCat2Id, unitId: setUnitId ?? pcsUnitId ?? fallbackUnitId, fobPrice: 4500 },
      // 20: VRF Outdoor - Daikin - HVAC/AC Units/VRF
      { barcode: "ITM-0020", name: "VRF Outdoor Unit 10HP", modelNo: "RXYQ10TAY1", brandId: daikinId ?? fallbackBrandId, mainCategoryId: hvacMainCatId ?? fallbackMainCatId, subCategory1Id: acUnitsSubCat1 ?? resolveSubCat1(null, hvacMainCatId) ?? fallbackSubCat1Id, subCategory2Id: vrfSubCat2 ?? resolveSubCat2(null, acUnitsSubCat1, "VRF") ?? fallbackSubCat2Id, unitId: setUnitId ?? pcsUnitId ?? fallbackUnitId, fobPrice: 25000 },
      // 21: Copper Pipe - Danfoss - HVAC/Ducting
      { barcode: "ITM-0021", name: "Copper Pipe 15mm", modelNo: "CP-15MM-TYPE-L", brandId: danfossId ?? fallbackBrandId, mainCategoryId: hvacMainCatId ?? fallbackMainCatId, subCategory1Id: ductingSubCat1 ?? resolveSubCat1(null, hvacMainCatId) ?? fallbackSubCat1Id, subCategory2Id: ductingSubCat2 ?? fallbackSubCat2Id, unitId: mtrUnitId ?? fallbackUnitId, fobPrice: 22 },
      // 22: AC Insulation - Danfoss - HVAC/Insulation
      { barcode: "ITM-0022", name: "AC Insulation 13mm", modelNo: "INS-13MM-BLK", brandId: danfossId ?? fallbackBrandId, mainCategoryId: hvacMainCatId ?? fallbackMainCatId, subCategory1Id: insulationSubCat1 ?? resolveSubCat1(null, hvacMainCatId) ?? fallbackSubCat1Id, subCategory2Id: insulationSubCat2 ?? fallbackSubCat2Id, unitId: mtrUnitId ?? fallbackUnitId, fobPrice: 8 },
      // 23-24: UPVC Pipes - Plumbing/Pipes/UPVC
      { barcode: "ITM-0023", name: "UPVC Pipe 110mm", modelNo: "UPVC-110-CLASS-D", brandId: grundfosId ?? fallbackBrandId, mainCategoryId: plumbingMainCatId ?? fallbackMainCatId, subCategory1Id: pipesSubCat1 ?? resolveSubCat1(null, plumbingMainCatId) ?? fallbackSubCat1Id, subCategory2Id: upvcSubCat2 ?? resolveSubCat2(null, pipesSubCat1, "UPVC", "Pipe") ?? fallbackSubCat2Id, unitId: mtrUnitId ?? fallbackUnitId, fobPrice: 18 },
      { barcode: "ITM-0024", name: "UPVC Pipe 75mm", modelNo: "UPVC-75-CLASS-D", brandId: grundfosId ?? fallbackBrandId, mainCategoryId: plumbingMainCatId ?? fallbackMainCatId, subCategory1Id: pipesSubCat1 ?? resolveSubCat1(null, plumbingMainCatId) ?? fallbackSubCat1Id, subCategory2Id: upvcSubCat2 ?? resolveSubCat2(null, pipesSubCat1, "UPVC", "Pipe") ?? fallbackSubCat2Id, unitId: mtrUnitId ?? fallbackUnitId, fobPrice: 12 },
      // 25: PPR Pipe - Plumbing/Pipes/PPR
      { barcode: "ITM-0025", name: "PPR Pipe 25mm", modelNo: "PPR-25-PN20", brandId: grundfosId ?? fallbackBrandId, mainCategoryId: plumbingMainCatId ?? fallbackMainCatId, subCategory1Id: pipesSubCat1 ?? resolveSubCat1(null, plumbingMainCatId) ?? fallbackSubCat1Id, subCategory2Id: pprSubCat2 ?? resolveSubCat2(null, pipesSubCat1, "PPR", "Pipe") ?? fallbackSubCat2Id, unitId: mtrUnitId ?? fallbackUnitId, fobPrice: 6 },
      // 26-27: Valves - Honeywell - Plumbing/Valves
      { barcode: "ITM-0026", name: 'Gate Valve 2"', modelNo: "GV-2IN-PN16", brandId: honeywellId ?? fallbackBrandId, mainCategoryId: plumbingMainCatId ?? fallbackMainCatId, subCategory1Id: valvesSubCat1 ?? resolveSubCat1(null, plumbingMainCatId) ?? fallbackSubCat1Id, subCategory2Id: valvesSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 120 },
      { barcode: "ITM-0027", name: 'Check Valve 4"', modelNo: "CV-4IN-PN16", brandId: honeywellId ?? fallbackBrandId, mainCategoryId: plumbingMainCatId ?? fallbackMainCatId, subCategory1Id: valvesSubCat1 ?? resolveSubCat1(null, plumbingMainCatId) ?? fallbackSubCat1Id, subCategory2Id: valvesSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 280 },
      // 28: Submersible Pump - Grundfos - Plumbing/Pumps
      { barcode: "ITM-0028", name: "Submersible Pump 2HP", modelNo: "SP-5A-18", brandId: grundfosId ?? fallbackBrandId, mainCategoryId: plumbingMainCatId ?? fallbackMainCatId, subCategory1Id: pumpsSubCat1 ?? resolveSubCat1(null, plumbingMainCatId) ?? fallbackSubCat1Id, subCategory2Id: pumpsSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 3500 },
      // 29-31: Fire Detection - Honeywell
      { barcode: "ITM-0029", name: "Fire Alarm Panel 4 Zone", modelNo: "..."/*"2X-F4-FB2-99"*/.replace("...", "2X-F4-FB2-99"), brandId: honeywellId ?? fallbackBrandId, mainCategoryId: fireFightingMainCatId ?? fallbackMainCatId, subCategory1Id: detectionSubCat1 ?? resolveSubCat1(null, fireFightingMainCatId) ?? fallbackSubCat1Id, subCategory2Id: detectionSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 2800 },
      { barcode: "ITM-0030", name: "Smoke Detector Addressable", modelNo: "?"/*"TC806A1037"*/.replace("?", "TC806A1037"), brandId: honeywellId ?? fallbackBrandId, mainCategoryId: fireFightingMainCatId ?? fallbackMainCatId, subCategory1Id: detectionSubCat1 ?? resolveSubCat1(null, fireFightingMainCatId) ?? fallbackSubCat1Id, subCategory2Id: detectionSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 85 },
      { barcode: "ITM-0031", name: "Heat Detector", modelNo: "TC846A1013", brandId: honeywellId ?? fallbackBrandId, mainCategoryId: fireFightingMainCatId ?? fallbackMainCatId, subCategory1Id: detectionSubCat1 ?? resolveSubCat1(null, fireFightingMainCatId) ?? fallbackSubCat1Id, subCategory2Id: detectionSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 65 },
      // 32: Manual Call Point - Honeywell - Fire Fighting/Alarms
      { barcode: "ITM-0032", name: "Manual Call Point", modelNo: "M700KAC-FF", brandId: honeywellId ?? fallbackBrandId, mainCategoryId: fireFightingMainCatId ?? fallbackMainCatId, subCategory1Id: alarmsSubCat1 ?? resolveSubCat1(null, fireFightingMainCatId) ?? fallbackSubCat1Id, subCategory2Id: alarmsSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 45 },
      // 33: Fire Sprinkler - Honeywell - Fire Fighting/Suppression
      { barcode: "ITM-0033", name: "Fire Sprinkler Head", modelNo: "SPK-68C-PEND", brandId: honeywellId ?? fallbackBrandId, mainCategoryId: fireFightingMainCatId ?? fallbackMainCatId, subCategory1Id: suppressionSubCat1 ?? resolveSubCat1(null, fireFightingMainCatId) ?? fallbackSubCat1Id, subCategory2Id: suppressionSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 25 },
      // 34: Fire Hose Reel - Fire Fighting/Hose Systems
      { barcode: "ITM-0034", name: "Fire Hose Reel 30m", modelNo: "FHR-30M-19MM", brandId: honeywellId ?? fallbackBrandId, mainCategoryId: fireFightingMainCatId ?? fallbackMainCatId, subCategory1Id: hoseSystemsSubCat1 ?? resolveSubCat1(null, fireFightingMainCatId) ?? fallbackSubCat1Id, subCategory2Id: hoseSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 650 },
      // 35: Fire Extinguisher - Fire Fighting/Extinguishers
      { barcode: "ITM-0035", name: "Fire Extinguisher 6kg", modelNo: "FE-6KG-ABC", brandId: honeywellId ?? fallbackBrandId, mainCategoryId: fireFightingMainCatId ?? fallbackMainCatId, subCategory1Id: extinguishersSubCat1 ?? resolveSubCat1(null, fireFightingMainCatId) ?? fallbackSubCat1Id, subCategory2Id: extinguisherSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 120 },
      // 36-40: Lighting - Philips
      { barcode: "ITM-0036", name: "Emergency Light LED", modelNo: "BWC110-LED-WH", brandId: philipsId ?? fallbackBrandId, mainCategoryId: lightingMainCatId ?? fallbackMainCatId, subCategory1Id: lightingSubCat1 ?? fallbackSubCat1Id, subCategory2Id: lightingSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 85 },
      { barcode: "ITM-0037", name: "Exit Sign LED", modelNo: "EXIT-LED-GRN", brandId: philipsId ?? fallbackBrandId, mainCategoryId: lightingMainCatId ?? fallbackMainCatId, subCategory1Id: lightingSubCat1 ?? fallbackSubCat1Id, subCategory2Id: lightingSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 55 },
      { barcode: "ITM-0038", name: "LED Panel Light 600x600", modelNo: "RC065B-LED40S", brandId: philipsId ?? fallbackBrandId, mainCategoryId: lightingMainCatId ?? fallbackMainCatId, subCategory1Id: lightingSubCat1 ?? fallbackSubCat1Id, subCategory2Id: lightingSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 95 },
      { barcode: "ITM-0039", name: "LED Downlight 12W", modelNo: "DN130B-D150-12W", brandId: philipsId ?? fallbackBrandId, mainCategoryId: lightingMainCatId ?? fallbackMainCatId, subCategory1Id: lightingSubCat1 ?? fallbackSubCat1Id, subCategory2Id: lightingSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 35 },
      { barcode: "ITM-0040", name: "LED Floodlight 100W", modelNo: "BVP150-LED100", brandId: philipsId ?? fallbackBrandId, mainCategoryId: lightingMainCatId ?? fallbackMainCatId, subCategory1Id: lightingSubCat1 ?? fallbackSubCat1Id, subCategory2Id: lightingSubCat2 ?? fallbackSubCat2Id, unitId: pcsUnitId ?? fallbackUnitId, fobPrice: 180 },
    ];

    for (const item of itemDefs) {
      await prisma.item.upsert({
        where: { barcode: item.barcode },
        update: {},
        create: {
          barcode: item.barcode,
          name: item.name,
          modelNo: item.modelNo,
          brandId: item.brandId,
          mainCategoryId: item.mainCategoryId,
          subCategory1Id: item.subCategory1Id,
          subCategory2Id: item.subCategory2Id,
          unitId: item.unitId,
          packingTypeId: defaultPackingId,
          currencyId: aedCurrencyId,
          fobPrice: item.fobPrice,
          defaultPrice: item.fobPrice,
          salesRate: Math.round(item.fobPrice * 1.3),
          conversionRate: 1,
          vatPerc: 5,
          itemType: "ITEM",
          isActive: true,
          hasSerialNumber: false,
        },
      });
    }

    console.log(`  Created/verified ${itemDefs.length} items.`);
  }

  // ─── 2. CUSTOMERS ─────────────────────────────────────────────────

  console.log("  Seeding customers...");

  const customerDefs = [
    { customerCode: "CUST-001", name: "Al Futtaim Engineering", contactPerson1: "Ahmed Al Futtaim", phone: "+971-4-213-1001", email: "ahmed@alfuttaim-eng.ae", address: "Al Quoz Industrial Area 3, Dubai", city: "Dubai", trnNumber: "100345678900001" },
    { customerCode: "CUST-002", name: "Emaar Properties", contactPerson1: "Khalid Emaar", phone: "+971-4-213-1002", email: "khalid@emaar.ae", address: "Emaar Square, Downtown Dubai", city: "Dubai", trnNumber: "100345678900002" },
    { customerCode: "CUST-003", name: "ALEC Engineering & Contracting", contactPerson1: "Mohammed Ali", phone: "+971-4-213-1003", email: "mohammed@alec.ae", address: "Jebel Ali Free Zone, Dubai", city: "Dubai", trnNumber: "100345678900003" },
    { customerCode: "CUST-004", name: "Arabtec Construction", contactPerson1: "Saeed Hassan", phone: "+971-4-213-1004", email: "saeed@arabtec.ae", address: "Business Bay, Dubai", city: "Dubai", trnNumber: "100345678900004" },
    { customerCode: "CUST-005", name: "Drake & Scull International", contactPerson1: "Omar DSI", phone: "+971-4-213-1005", email: "omar@drakescull.ae", address: "Dubai Investment Park, Dubai", city: "Dubai", trnNumber: "100345678900005" },
    { customerCode: "CUST-006", name: "Dutco Balfour Beatty", contactPerson1: "Raj Kumar", phone: "+971-4-213-1006", email: "raj@dutcobalfour.ae", address: "Al Quoz Industrial Area 1, Dubai", city: "Dubai", trnNumber: "100345678900006" },
    { customerCode: "CUST-007", name: "Al Habtoor Engineering", contactPerson1: "Fahad Habtoor", phone: "+971-4-213-1007", email: "fahad@alhabtoor-eng.ae", address: "Al Habtoor City, Sheikh Zayed Road, Dubai", city: "Dubai", trnNumber: "100345678900007" },
    { customerCode: "CUST-008", name: "Shapoorji Pallonji", contactPerson1: "Ravi Menon", phone: "+971-4-213-1008", email: "ravi@shapoorji.ae", address: "DAFZA, Dubai", city: "Dubai", trnNumber: "100345678900008" },
    { customerCode: "CUST-009", name: "L&T Construction ME", contactPerson1: "Suresh Patel", phone: "+971-2-445-1009", email: "suresh@lnt-me.ae", address: "Electra Street, Abu Dhabi", city: "Abu Dhabi", trnNumber: "100345678900009" },
    { customerCode: "CUST-010", name: "Samsung C&T", contactPerson1: "Kim Soo", phone: "+971-4-213-1010", email: "kim.soo@samsungcnt.ae", address: "Dubai Marina, Dubai", city: "Dubai", trnNumber: "100345678900010" },
    { customerCode: "CUST-011", name: "Hyundai Engineering", contactPerson1: "Park Jin", phone: "+971-4-213-1011", email: "park.jin@hyundai-eng.ae", address: "Jumeirah Lake Towers, Dubai", city: "Dubai", trnNumber: "100345678900011" },
    { customerCode: "CUST-012", name: "China State Construction", contactPerson1: "Wang Li", phone: "+971-4-213-1012", email: "wang.li@cscec-me.ae", address: "Al Barsha, Dubai", city: "Dubai", trnNumber: "100345678900012" },
    { customerCode: "CUST-013", name: "Consolidated Contractors", contactPerson1: "Nabil Said", phone: "+971-2-445-1013", email: "nabil@ccc-group.ae", address: "Khalidiya, Abu Dhabi", city: "Abu Dhabi", trnNumber: "100345678900013" },
    { customerCode: "CUST-014", name: "Al Jaber Group", contactPerson1: "Sultan Al Jaber", phone: "+971-2-445-1014", email: "sultan@aljaber.ae", address: "Mussafah Industrial, Abu Dhabi", city: "Abu Dhabi", trnNumber: "100345678900014" },
    { customerCode: "CUST-015", name: "BESIX Group", contactPerson1: "Marc Janssen", phone: "+971-4-213-1015", email: "marc@besix.ae", address: "DIFC, Dubai", city: "Dubai", trnNumber: "100345678900015" },
    { customerCode: "CUST-016", name: "Brookfield Multiplex", contactPerson1: "James Wilson", phone: "+971-4-213-1016", email: "james@multiplex.ae", address: "Sheikh Zayed Road, Dubai", city: "Dubai", trnNumber: "100345678900016" },
    { customerCode: "CUST-017", name: "Sobha Group", contactPerson1: "PNC Menon", phone: "+971-4-213-1017", email: "pnc@sobha.ae", address: "Sobha Hartland, MBR City, Dubai", city: "Dubai", trnNumber: "100345678900017" },
    { customerCode: "CUST-018", name: "Damac Properties", contactPerson1: "Hussain Damac", phone: "+971-4-213-1018", email: "hussain@damac.ae", address: "DAMAC Hills, Dubai", city: "Dubai", trnNumber: "100345678900018" },
    { customerCode: "CUST-019", name: "Nakheel", contactPerson1: "Sara Ahmed", phone: "+971-4-213-1019", email: "sara@nakheel.ae", address: "Palm Jumeirah, Dubai", city: "Dubai", trnNumber: "100345678900019" },
    { customerCode: "CUST-020", name: "Dubai Properties Group", contactPerson1: "Fatima Hassan", phone: "+971-4-213-1020", email: "fatima@dubaiproperties.ae", address: "Business Bay, Dubai", city: "Dubai", trnNumber: "100345678900020" },
  ];

  for (const cust of customerDefs) {
    const resolvedCityId = cityId(cust.city);
    await prisma.customer.upsert({
      where: { customerCode: cust.customerCode },
      update: {},
      create: {
        customerCode: cust.customerCode,
        name: cust.name,
        contactPerson1: cust.contactPerson1,
        phone: cust.phone,
        email: cust.email,
        address: cust.address,
        cityId: resolvedCityId,
        other: cust.trnNumber,
      },
    });
  }

  console.log(`  Created/verified ${customerDefs.length} customers.`);

  // ─── 3. SUPPLIERS ──────────────────────────────────────────────────

  console.log("  Seeding suppliers...");

  const supplierDefs = [
    { supplierCode: "SUP-001", name: "Schneider Electric Middle East", contactPerson1: "Rami Qasem", phone: "+971-4-409-5100", email: "rami.qasem@se.com", address: "Jebel Ali Free Zone, Dubai", city: "Dubai" },
    { supplierCode: "SUP-002", name: "ABB Middle East", contactPerson1: "Samer Haddad", phone: "+971-4-809-6100", email: "samer.haddad@abb.com", address: "Jebel Ali Free Zone, Dubai", city: "Dubai" },
    { supplierCode: "SUP-003", name: "Siemens LLC", contactPerson1: "Helmut Fischer", phone: "+971-2-696-1300", email: "helmut.fischer@siemens.com", address: "Capital Gate Tower, Abu Dhabi", city: "Abu Dhabi" },
    { supplierCode: "SUP-004", name: "Al Mawrid Trading", contactPerson1: "Faisal Al Mawrid", phone: "+971-4-335-2201", email: "faisal@almawrid.ae", address: "Deira, Dubai", city: "Dubai" },
    { supplierCode: "SUP-005", name: "National Cables Industry", contactPerson1: "Abdullah Nasser", phone: "+971-2-551-0100", email: "abdullah@nci.ae", address: "Mussafah Industrial, Abu Dhabi", city: "Abu Dhabi" },
    { supplierCode: "SUP-006", name: "Gulf Switchgear", contactPerson1: "Iqbal Hussain", phone: "+971-6-534-2801", email: "iqbal@gulfswitchgear.ae", address: "Industrial Area 15, Sharjah", city: "Sharjah" },
    { supplierCode: "SUP-007", name: "Al Ghandi Electronics", contactPerson1: "Majid Al Ghandi", phone: "+971-4-269-3300", email: "majid@alghandi.ae", address: "Al Quoz, Dubai", city: "Dubai" },
    { supplierCode: "SUP-008", name: "Daikin Middle East", contactPerson1: "Takeshi Yamamoto", phone: "+971-4-883-4455", email: "takeshi@daikin-me.com", address: "DAFZA, Dubai", city: "Dubai" },
    { supplierCode: "SUP-009", name: "Carrier Middle East", contactPerson1: "John Parker", phone: "+971-4-886-5200", email: "john.parker@carrier.com", address: "Dubai Investment Park, Dubai", city: "Dubai" },
    { supplierCode: "SUP-010", name: "Danfoss Middle East", contactPerson1: "Lars Jensen", phone: "+971-4-371-4500", email: "lars.jensen@danfoss.com", address: "Jebel Ali Free Zone, Dubai", city: "Dubai" },
    { supplierCode: "SUP-011", name: "Grundfos Gulf", contactPerson1: "Erik Nielsen", phone: "+971-4-368-8600", email: "erik.nielsen@grundfos.com", address: "Jebel Ali Free Zone, Dubai", city: "Dubai" },
    { supplierCode: "SUP-012", name: "Honeywell Building Technologies", contactPerson1: "Mike Stevens", phone: "+971-4-450-5800", email: "mike.stevens@honeywell.com", address: "Dubai Silicon Oasis, Dubai", city: "Dubai" },
    { supplierCode: "SUP-013", name: "Philips Lighting ME", contactPerson1: "Peter De Vries", phone: "+971-4-341-5900", email: "peter.devries@signify.com", address: "DAFZA, Dubai", city: "Dubai" },
    { supplierCode: "SUP-014", name: "Legrand Middle East", contactPerson1: "Antoine Fabre", phone: "+971-4-371-6500", email: "antoine.fabre@legrand.com", address: "Jebel Ali Free Zone, Dubai", city: "Dubai" },
    { supplierCode: "SUP-015", name: "Hager Middle East", contactPerson1: "Klaus Weber", phone: "+971-4-371-4600", email: "klaus.weber@hager.com", address: "Jebel Ali Free Zone, Dubai", city: "Dubai" },
    { supplierCode: "SUP-016", name: "Eaton Electric", contactPerson1: "David Brown", phone: "+971-4-809-7200", email: "david.brown@eaton.com", address: "Dubai Investment Park, Dubai", city: "Dubai" },
    { supplierCode: "SUP-017", name: "Al Bahar HVAC", contactPerson1: "Nasir Al Bahar", phone: "+971-6-543-1200", email: "nasir@albahar-hvac.ae", address: "Industrial Area 10, Sharjah", city: "Sharjah" },
    { supplierCode: "SUP-018", name: "Emirates Fire Safety", contactPerson1: "Tariq Aziz", phone: "+971-4-447-2100", email: "tariq@emiratesfiresafety.ae", address: "Al Quoz Industrial 4, Dubai", city: "Dubai" },
    { supplierCode: "SUP-019", name: "Gulf Piping Company", contactPerson1: "Mahesh Reddy", phone: "+971-6-748-3500", email: "mahesh@gulfpiping.ae", address: "New Industrial Area, Ajman", city: "Ajman" },
    { supplierCode: "SUP-020", name: "Modern Building Materials", contactPerson1: "Ali Reza", phone: "+971-4-333-6800", email: "ali@modernbm.ae", address: "Al Quoz Industrial 2, Dubai", city: "Dubai" },
  ];

  for (const sup of supplierDefs) {
    const resolvedCityId = cityId(sup.city);
    await prisma.supplier.upsert({
      where: { supplierCode: sup.supplierCode },
      update: {},
      create: {
        supplierCode: sup.supplierCode,
        name: sup.name,
        contactPerson1: sup.contactPerson1,
        phone: sup.phone,
        email: sup.email,
        address: sup.address,
        cityId: resolvedCityId,
      },
    });
  }

  console.log(`  Created/verified ${supplierDefs.length} suppliers.`);

  // ─── 4. ITEM SUPPLIERS ─────────────────────────────────────────────

  console.log("  Seeding item-supplier links...");

  // Fetch the created items and suppliers for linking
  const allItems = await prisma.item.findMany({ select: { id: true, barcode: true, name: true } });
  const allSuppliers = await prisma.supplier.findMany({ select: { id: true, supplierCode: true } });

  function findItemId(barcode: string): number | null {
    return allItems.find((i) => i.barcode === barcode)?.id ?? null;
  }

  function findSupplierId(code: string): number | null {
    return allSuppliers.find((s) => s.supplierCode === code)?.id ?? null;
  }

  // Mapping: item barcodes -> supplier codes
  const itemSupplierLinks: { itemBarcode: string; supplierCodes: string[] }[] = [
    // Schneider items -> Schneider (SUP-001), Al Mawrid (SUP-004), Gulf Switchgear (SUP-006)
    { itemBarcode: "ITM-0001", supplierCodes: ["SUP-001", "SUP-004", "SUP-006"] },
    { itemBarcode: "ITM-0002", supplierCodes: ["SUP-001", "SUP-004", "SUP-006"] },
    { itemBarcode: "ITM-0003", supplierCodes: ["SUP-001", "SUP-004", "SUP-006"] },
    { itemBarcode: "ITM-0004", supplierCodes: ["SUP-001", "SUP-004"] },
    // ABB items -> ABB (SUP-002), Al Mawrid (SUP-004)
    { itemBarcode: "ITM-0005", supplierCodes: ["SUP-002", "SUP-004"] },
    { itemBarcode: "ITM-0006", supplierCodes: ["SUP-002", "SUP-004"] },
    // Distribution Boards - Schneider -> Schneider (SUP-001), Al Ghandi (SUP-007)
    { itemBarcode: "ITM-0007", supplierCodes: ["SUP-001", "SUP-007"] },
    { itemBarcode: "ITM-0008", supplierCodes: ["SUP-001", "SUP-007"] },
    // Cables - Legrand -> Legrand (SUP-014), National Cables (SUP-005)
    { itemBarcode: "ITM-0009", supplierCodes: ["SUP-014", "SUP-005", "SUP-020"] },
    { itemBarcode: "ITM-0010", supplierCodes: ["SUP-014", "SUP-005", "SUP-020"] },
    { itemBarcode: "ITM-0011", supplierCodes: ["SUP-014", "SUP-005"] },
    { itemBarcode: "ITM-0012", supplierCodes: ["SUP-014", "SUP-020"] },
    // Conduits/Wiring - Legrand -> Legrand (SUP-014), Modern BM (SUP-020)
    { itemBarcode: "ITM-0013", supplierCodes: ["SUP-014", "SUP-020"] },
    { itemBarcode: "ITM-0014", supplierCodes: ["SUP-014", "SUP-020"] },
    // Socket/Switch - Schneider -> Schneider (SUP-001), Legrand (SUP-014)
    { itemBarcode: "ITM-0015", supplierCodes: ["SUP-001", "SUP-014"] },
    { itemBarcode: "ITM-0016", supplierCodes: ["SUP-001", "SUP-014"] },
    // AC units - Daikin -> Daikin (SUP-008), Al Bahar HVAC (SUP-017)
    { itemBarcode: "ITM-0017", supplierCodes: ["SUP-008", "SUP-017"] },
    { itemBarcode: "ITM-0018", supplierCodes: ["SUP-008", "SUP-017"] },
    { itemBarcode: "ITM-0019", supplierCodes: ["SUP-008", "SUP-009"] },
    { itemBarcode: "ITM-0020", supplierCodes: ["SUP-008"] },
    // HVAC accessories - Danfoss -> Danfoss (SUP-010), Al Bahar (SUP-017)
    { itemBarcode: "ITM-0021", supplierCodes: ["SUP-010", "SUP-017"] },
    { itemBarcode: "ITM-0022", supplierCodes: ["SUP-010", "SUP-017"] },
    // Plumbing - Grundfos -> Grundfos (SUP-011), Gulf Piping (SUP-019)
    { itemBarcode: "ITM-0023", supplierCodes: ["SUP-011", "SUP-019"] },
    { itemBarcode: "ITM-0024", supplierCodes: ["SUP-011", "SUP-019"] },
    { itemBarcode: "ITM-0025", supplierCodes: ["SUP-019", "SUP-020"] },
    // Valves - Honeywell -> Honeywell (SUP-012), Gulf Piping (SUP-019)
    { itemBarcode: "ITM-0026", supplierCodes: ["SUP-012", "SUP-019"] },
    { itemBarcode: "ITM-0027", supplierCodes: ["SUP-012", "SUP-019"] },
    // Pump - Grundfos -> Grundfos (SUP-011)
    { itemBarcode: "ITM-0028", supplierCodes: ["SUP-011"] },
    // Fire fighting - Honeywell -> Honeywell (SUP-012), Emirates Fire Safety (SUP-018)
    { itemBarcode: "ITM-0029", supplierCodes: ["SUP-012", "SUP-018"] },
    { itemBarcode: "ITM-0030", supplierCodes: ["SUP-012", "SUP-018"] },
    { itemBarcode: "ITM-0031", supplierCodes: ["SUP-012", "SUP-018"] },
    { itemBarcode: "ITM-0032", supplierCodes: ["SUP-012", "SUP-018"] },
    { itemBarcode: "ITM-0033", supplierCodes: ["SUP-018"] },
    { itemBarcode: "ITM-0034", supplierCodes: ["SUP-018", "SUP-020"] },
    { itemBarcode: "ITM-0035", supplierCodes: ["SUP-018", "SUP-020"] },
    // Lighting - Philips -> Philips (SUP-013), Modern BM (SUP-020)
    { itemBarcode: "ITM-0036", supplierCodes: ["SUP-013", "SUP-020"] },
    { itemBarcode: "ITM-0037", supplierCodes: ["SUP-013", "SUP-020"] },
    { itemBarcode: "ITM-0038", supplierCodes: ["SUP-013"] },
    { itemBarcode: "ITM-0039", supplierCodes: ["SUP-013"] },
    { itemBarcode: "ITM-0040", supplierCodes: ["SUP-013", "SUP-020"] },
  ];

  const itemSupplierData: { itemId: number; supplierId: number }[] = [];
  for (const link of itemSupplierLinks) {
    const iId = findItemId(link.itemBarcode);
    if (!iId) continue;
    for (const supCode of link.supplierCodes) {
      const sId = findSupplierId(supCode);
      if (!sId) continue;
      itemSupplierData.push({ itemId: iId, supplierId: sId });
    }
  }

  if (itemSupplierData.length > 0) {
    await prisma.itemSupplier.createMany({
      data: itemSupplierData,
      skipDuplicates: true,
    });
  }

  console.log(`  Created/verified ${itemSupplierData.length} item-supplier links.`);

  // ─── 5. COMBO ITEMS ────────────────────────────────────────────────

  console.log("  Seeding combo items...");

  // First, create the parent combo items in the Item table
  if (brands.length > 0 && mainCategories.length > 0 && subCategories1.length > 0 && subCategories2.length > 0 && units.length > 0) {
    const fallbackBrandId = brands[0].id;
    const fallbackMainCatId = mainCategories[0].id;
    const fallbackSubCat1Id = subCategories1[0].id;
    const fallbackSubCat2Id = subCategories2[0].id;
    const fallbackUnitId = units[0].id;

    const comboDefs = [
      { barcode: "COMBO-001", name: "DB + MCB Installation Kit", modelNo: "KIT-DB12-MCB", fobPrice: 630 },
      { barcode: "COMBO-002", name: "Split AC Complete Kit", modelNo: "KIT-SAC-2T", fobPrice: 2830 },
      { barcode: "COMBO-003", name: "Fire Detection Starter Kit", modelNo: "KIT-FD-BASIC", fobPrice: 3030 },
      { barcode: "COMBO-004", name: "Plumbing Valve Set", modelNo: "KIT-PLB-VALVE", fobPrice: 400 },
      { barcode: "COMBO-005", name: "LED Lighting Office Kit", modelNo: "KIT-LED-OFC", fobPrice: 475 },
    ];

    for (const combo of comboDefs) {
      await prisma.item.upsert({
        where: { barcode: combo.barcode },
        update: {},
        create: {
          barcode: combo.barcode,
          name: combo.name,
          modelNo: combo.modelNo,
          brandId: fallbackBrandId,
          mainCategoryId: fallbackMainCatId,
          subCategory1Id: fallbackSubCat1Id,
          subCategory2Id: fallbackSubCat2Id,
          unitId: setUnitId ?? fallbackUnitId,
          packingTypeId: defaultPackingId,
          currencyId: aedCurrencyId,
          fobPrice: combo.fobPrice,
          defaultPrice: combo.fobPrice,
          salesRate: Math.round(combo.fobPrice * 1.3),
          conversionRate: 1,
          vatPerc: 5,
          itemType: "COMBO",
          isCombo: true,
          isActive: true,
          hasSerialNumber: false,
        },
      });
    }

    // Now create the combo item children
    // Re-fetch items to get combo parent IDs
    const refreshedItems = await prisma.item.findMany({ select: { id: true, barcode: true } });
    function itemIdByBarcode(bc: string): number | null {
      return refreshedItems.find((i) => i.barcode === bc)?.id ?? null;
    }

    const comboChildDefs: { parentBarcode: string; childBarcode: string; quantity: number }[] = [
      // COMBO-001: DB 12 Way + 6x MCB 1P 20A
      { parentBarcode: "COMBO-001", childBarcode: "ITM-0007", quantity: 1 },
      { parentBarcode: "COMBO-001", childBarcode: "ITM-0003", quantity: 6 },
      // COMBO-002: Split AC 2 Ton + Copper Pipe + Insulation
      { parentBarcode: "COMBO-002", childBarcode: "ITM-0018", quantity: 1 },
      { parentBarcode: "COMBO-002", childBarcode: "ITM-0021", quantity: 5 },
      { parentBarcode: "COMBO-002", childBarcode: "ITM-0022", quantity: 5 },
      // COMBO-003: Fire Alarm Panel + 3x Smoke Detector + 1x Heat Detector + 1x Manual Call Point
      { parentBarcode: "COMBO-003", childBarcode: "ITM-0029", quantity: 1 },
      { parentBarcode: "COMBO-003", childBarcode: "ITM-0030", quantity: 3 },
      { parentBarcode: "COMBO-003", childBarcode: "ITM-0031", quantity: 1 },
      { parentBarcode: "COMBO-003", childBarcode: "ITM-0032", quantity: 1 },
      // COMBO-004: Gate Valve 2" + Check Valve 4"
      { parentBarcode: "COMBO-004", childBarcode: "ITM-0026", quantity: 1 },
      { parentBarcode: "COMBO-004", childBarcode: "ITM-0027", quantity: 1 },
      // COMBO-005: 4x LED Panel Light + 2x LED Downlight + 1x Emergency Light
      { parentBarcode: "COMBO-005", childBarcode: "ITM-0038", quantity: 4 },
      { parentBarcode: "COMBO-005", childBarcode: "ITM-0039", quantity: 2 },
      { parentBarcode: "COMBO-005", childBarcode: "ITM-0036", quantity: 1 },
    ];

    const comboInserts: { parentItemId: number; childItemId: number; quantity: number }[] = [];
    for (const cd of comboChildDefs) {
      const parentId = itemIdByBarcode(cd.parentBarcode);
      const childId = itemIdByBarcode(cd.childBarcode);
      if (parentId && childId) {
        comboInserts.push({
          parentItemId: parentId,
          childItemId: childId,
          quantity: cd.quantity,
        });
      }
    }

    if (comboInserts.length > 0) {
      await prisma.comboItem.createMany({
        data: comboInserts,
        skipDuplicates: true,
      });
    }

    console.log(`  Created/verified ${comboDefs.length} combo items with ${comboInserts.length} child links.`);
  }

  // ─── 6. BANKS ──────────────────────────────────────────────────────

  console.log("  Seeding banks...");

  const bankDefs = [
    { bankCode: "ENBD", name: "Emirates NBD", address: "Baniyas Road, Deira, Dubai", phone: "+971-4-316-0316", isCreditCard: true },
    { bankCode: "ADCB", name: "Abu Dhabi Commercial Bank", address: "Sheikh Zayed Road, Dubai", phone: "+971-2-621-0090", isCreditCard: true },
    { bankCode: "DIB", name: "Dubai Islamic Bank", address: "Al Muraqqabat, Deira, Dubai", phone: "+971-4-609-2222", isCreditCard: false },
    { bankCode: "MASH", name: "Mashreq Bank", address: "Omar Bin Al Khattab St, Deira, Dubai", phone: "+971-4-424-4444", isCreditCard: true },
    { bankCode: "FAB", name: "First Abu Dhabi Bank", address: "Khalifa Street, Abu Dhabi", phone: "+971-2-681-1511", isCreditCard: true },
    { bankCode: "RAKB", name: "RAK Bank", address: "Al Maktoum Road, Deira, Dubai", phone: "+971-4-213-0000", isCreditCard: true },
    { bankCode: "CBD", name: "Commercial Bank of Dubai", address: "Al Ittihad Road, Deira, Dubai", phone: "+971-4-212-5000", isCreditCard: false },
    { bankCode: "NBF", name: "National Bank of Fujairah", address: "Hamdan Street, Abu Dhabi", phone: "+971-9-222-8888", isCreditCard: false },
    { bankCode: "SIB", name: "Sharjah Islamic Bank", address: "Al Buhaira Corniche, Sharjah", phone: "+971-6-599-9999", isCreditCard: false },
    { bankCode: "HSBC", name: "HSBC Bank Middle East", address: "DIFC, Sheikh Zayed Road, Dubai", phone: "+971-4-228-5920", isCreditCard: true },
  ];

  for (const bank of bankDefs) {
    await prisma.bank.upsert({
      where: { bankCode: bank.bankCode },
      update: {},
      create: {
        bankCode: bank.bankCode,
        branchCode: "HQ",
        name: bank.name,
        address: bank.address,
        cityId: dubaiCityId,
        phone: bank.phone,
        isGst: true,
        isCreditCard: bank.isCreditCard,
      },
    });
  }

  console.log(`  Created/verified ${bankDefs.length} banks.`);

  // ─── 7. BANK ACCOUNTS ─────────────────────────────────────────────

  console.log("  Seeding bank accounts...");

  const createdBanks = await prisma.bank.findMany({ select: { id: true, bankCode: true } });

  function findBankId(code: string): number | null {
    return createdBanks.find((b) => b.bankCode === code)?.id ?? null;
  }

  const bankAccountDefs = [
    // Emirates NBD - 2 accounts
    { bankCode: "ENBD", accountNo: "1017-0654-3298-01", accountType: "Current", currencyCode: "AED", amount: 2500000 },
    { bankCode: "ENBD", accountNo: "1017-0654-3298-02", accountType: "Savings", currencyCode: "AED", amount: 1000000 },
    // ADCB
    { bankCode: "ADCB", accountNo: "1120-0871-5543-01", accountType: "Current", currencyCode: "AED", amount: 3500000 },
    // DIB
    { bankCode: "DIB", accountNo: "2035-1122-8876-01", accountType: "Current", currencyCode: "AED", amount: 1500000 },
    // Mashreq
    { bankCode: "MASH", accountNo: "3041-2233-4455-01", accountType: "Current", currencyCode: "AED", amount: 2000000 },
    { bankCode: "MASH", accountNo: "3041-2233-4455-02", accountType: "Current", currencyCode: "USD", amount: 500000 },
    // FAB
    { bankCode: "FAB", accountNo: "4050-3344-5566-01", accountType: "Current", currencyCode: "AED", amount: 5000000 },
    { bankCode: "FAB", accountNo: "4050-3344-5566-02", accountType: "Savings", currencyCode: "AED", amount: 1000000 },
    // RAK Bank
    { bankCode: "RAKB", accountNo: "5060-4455-6677-01", accountType: "Current", currencyCode: "AED", amount: 800000 },
    // CBD
    { bankCode: "CBD", accountNo: "6070-5566-7788-01", accountType: "Current", currencyCode: "AED", amount: 1200000 },
    // NBF
    { bankCode: "NBF", accountNo: "7080-6677-8899-01", accountType: "Current", currencyCode: "AED", amount: 600000 },
    // SIB
    { bankCode: "SIB", accountNo: "8090-7788-9900-01", accountType: "Current", currencyCode: "AED", amount: 900000 },
    // HSBC - 2 accounts
    { bankCode: "HSBC", accountNo: "9100-8899-0011-01", accountType: "Current", currencyCode: "AED", amount: 4000000 },
    { bankCode: "HSBC", accountNo: "9100-8899-0011-02", accountType: "Current", currencyCode: "USD", amount: 750000 },
    // Extra ADCB savings
    { bankCode: "ADCB", accountNo: "1120-0871-5543-02", accountType: "Savings", currencyCode: "AED", amount: 100000 },
  ];

  const bankAccountInserts: {
    bankId: number;
    accountNo: string;
    accountType: string;
    currencyCode: string;
    amount: number;
  }[] = [];

  for (const ba of bankAccountDefs) {
    const bId = findBankId(ba.bankCode);
    if (bId) {
      bankAccountInserts.push({
        bankId: bId,
        accountNo: ba.accountNo,
        accountType: ba.accountType,
        currencyCode: ba.currencyCode,
        amount: ba.amount,
      });
    }
  }

  if (bankAccountInserts.length > 0) {
    await prisma.bankAccount.createMany({
      data: bankAccountInserts,
      skipDuplicates: true,
    });
  }

  console.log(`  Created/verified ${bankAccountInserts.length} bank accounts.`);

  // ─── 8. EMPLOYEES ──────────────────────────────────────────────────

  console.log("  Seeding employees...");

  const employeeDefs = [
    { employeeCode: "EMP-001", firstName: "Ahmad", lastName: "Hassan", nickName: "Ahmad H", monthlySalary: 12000 },
    { employeeCode: "EMP-002", firstName: "Mohammed", lastName: "Ali", nickName: "Mohammed A", monthlySalary: 15000 },
    { employeeCode: "EMP-003", firstName: "Rajesh", lastName: "Kumar", nickName: "Rajesh K", monthlySalary: 8000 },
    { employeeCode: "EMP-004", firstName: "Suresh", lastName: "Nair", nickName: "Suresh N", monthlySalary: 7500 },
    { employeeCode: "EMP-005", firstName: "Imran", lastName: "Khan", nickName: "Imran K", monthlySalary: 9500 },
    { employeeCode: "EMP-006", firstName: "Abdullah", lastName: "Salem", nickName: "Abdullah S", monthlySalary: 18000 },
    { employeeCode: "EMP-007", firstName: "Khalid", lastName: "Omar", nickName: "Khalid O", monthlySalary: 14000 },
    { employeeCode: "EMP-008", firstName: "Pradeep", lastName: "Singh", nickName: "Pradeep S", monthlySalary: 7000 },
    { employeeCode: "EMP-009", firstName: "Ravi", lastName: "Sharma", nickName: "Ravi S", monthlySalary: 6500 },
    { employeeCode: "EMP-010", firstName: "Tariq", lastName: "Mahmoud", nickName: "Tariq M", monthlySalary: 11000 },
    { employeeCode: "EMP-011", firstName: "Hassan", lastName: "Abbas", nickName: "Hassan A", monthlySalary: 10000 },
    { employeeCode: "EMP-012", firstName: "Yousuf", lastName: "Ibrahim", nickName: "Yousuf I", monthlySalary: 13000 },
    { employeeCode: "EMP-013", firstName: "Deepak", lastName: "Patel", nickName: "Deepak P", monthlySalary: 7500 },
    { employeeCode: "EMP-014", firstName: "Anwar", lastName: "Hussain", nickName: "Anwar H", monthlySalary: 9000 },
    { employeeCode: "EMP-015", firstName: "Vijay", lastName: "Menon", nickName: "Vijay M", monthlySalary: 8500 },
  ];

  for (const emp of employeeDefs) {
    await prisma.accEmployee.upsert({
      where: { employeeCode: emp.employeeCode },
      update: {},
      create: {
        employeeCode: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        nickName: emp.nickName,
        monthlySalary: emp.monthlySalary,
        isActive: true,
      },
    });
  }

  console.log(`  Created/verified ${employeeDefs.length} employees.`);

  // ─── 9. ACC PROJECTS ──────────────────────────────────────────────

  console.log("  Seeding accounting projects...");

  const accProjectDefs = [
    { projectCode: "PRJ01", name: "Villa Renovation", description: "Complete villa renovation project including MEP works" },
    { projectCode: "PRJ02", name: "Tower MEP", description: "High-rise tower MEP installation and commissioning" },
    { projectCode: "PRJ03", name: "Mall Electrical", description: "Shopping mall electrical systems installation" },
    { projectCode: "PRJ04", name: "Hospital HVAC", description: "Hospital HVAC system design and installation" },
    { projectCode: "PRJ05", name: "School Plumbing", description: "School plumbing and drainage system overhaul" },
    { projectCode: "PRJ06", name: "Hotel Fitout", description: "5-star hotel interior fitout MEP services" },
    { projectCode: "PRJ07", name: "Warehouse MEP", description: "Industrial warehouse MEP infrastructure" },
    { projectCode: "PRJ08", name: "Office Tower", description: "Commercial office tower MEP fit-out" },
    { projectCode: "PRJ09", name: "Residential Complex", description: "Multi-building residential complex MEP works" },
    { projectCode: "PRJ10", name: "Industrial Facility", description: "Industrial manufacturing facility MEP systems" },
  ];

  for (const proj of accProjectDefs) {
    await prisma.accProject.upsert({
      where: { projectCode: proj.projectCode },
      update: {},
      create: {
        projectCode: proj.projectCode,
        name: proj.name,
        description: proj.description,
      },
    });
  }

  console.log(`  Created/verified ${accProjectDefs.length} accounting projects.`);

  // ─── DONE ──────────────────────────────────────────────────────────

  console.log("Master data seeding complete.");
}
