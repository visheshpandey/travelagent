export type PoiKind = "heritage" | "food" | "nightlife" | "shopping" | "nature" | "stay";

export interface PoiMetaRow {
  label: string;
  value: string;
}

export interface PoiPopupData {
  kind: PoiKind;
  title: string;
  subtitle?: string;
  accentColor: string;
  rows: PoiMetaRow[];
}

export const POI_ENTER_MS = 420;
export const POI_SETTLE_MS = 260;
