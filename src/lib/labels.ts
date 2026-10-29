const TYPE_LABELS: Record<string, string> = {
  yol: "Yol",
  gida: "Gıda",
  konaklama: "Konaklama",
  posta: "Posta gideri",
  tebligat: "Tebligat gideri",
  harc: "Harç",
  bilirkisi: "Bilirkişi ücreti",
  kesif: "Keşif gideri",
  dosya: "Dosya masrafı",
  diger: "Diğer",
};

export function typeLabel(type: string, catalog: Record<string, string>): string {
  return catalog[type] ?? TYPE_LABELS[type] ?? type;
}

export function parseTypeCatalog(data: unknown): Record<string, string> {
  if (!data || typeof data !== "object") {
    return {};
  }
  const record = data as Record<string, unknown>;
  const raw = Array.isArray(record.items) ? record.items : [];
  const labels: Record<string, string> = {};
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const item = entry as Record<string, unknown>;
    const label = typeof item.label === "string" ? item.label.trim() : "";
    const value = typeof item.value === "string" ? item.value.trim() : "";
    if (value && label) {
      labels[value] = label;
    }
  }
  return labels;
}
