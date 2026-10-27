export function normalizeLocation(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

export function normalizeLocations(values: string[]): string[] {
  return [...new Set(values.map(normalizeLocation))];
}
