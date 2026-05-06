import { HWP_PACK_PRICE, RP_PACK_PRICE } from "@/lib/pricing";

export interface PackConfig {
  id: string;
  name: string;
  sku: string;
  backCover: string;
  price: number;
  packSize: number;
  category: "holy-week" | "resurrection";
  description: string;
  accent: string;
}

export const PACK_CONFIGS: Record<string, PackConfig> = {
  "holy-week-pack": {
    id: "holy-week-pack",
    name: "Holy Week Pack",
    sku: "HWP_PACK",
    backCover: "Holy Week Pack BACK.png",
    price: HWP_PACK_PRICE,
    packSize: 23,
    category: "holy-week",
    description:
      "From the triumphal entry into Jerusalem through the burial — the full arc of Holy Week in Coptic iconographic style. Twenty-three moments for the Great Fast.",
    accent: "var(--brand)",
  },
  "resurrection-pack": {
    id: "resurrection-pack",
    name: "Resurrection Pack",
    sku: "RP_PACK",
    backCover: "Resurrection Pack BACK.png",
    price: RP_PACK_PRICE,
    packSize: 10,
    category: "resurrection",
    description:
      "Ten appearances of the Risen Lord — from the empty tomb through Pentecost. The fifty days of the Bright Season, gathered for wherever joy belongs.",
    accent: "var(--gold)",
  },
};

export const SKU_TO_SLUG: Record<string, string> = {
  HWP_PACK: "holy-week-pack",
  RP_PACK: "resurrection-pack",
};

export const PACK_CONFIG_LIST = Object.values(PACK_CONFIGS);
