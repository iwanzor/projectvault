/**
 * Maps sortBy "name" to a model-specific field when the model doesn't have a "name" field.
 * Falls back to createdAt if the field doesn't exist.
 */
export function getSortField(sortBy: string, validFields: string[]): string {
  if (sortBy === "name") {
    // Try common alternatives
    const alternatives = ["description", "documentCode", "code", "terms", "quotationTermsCode"];
    for (const alt of alternatives) {
      if (validFields.includes(alt)) return alt;
    }
    return "createdAt";
  }
  return validFields.includes(sortBy) ? sortBy : "createdAt";
}
