import raw from "@/data/tr-il-ilce.json";

/** Türkiye il / ilçe listesi (yalnızca il–ilçe; mahalle yok). Kaynak: MIT `turkey-neighbourhoods` paketinden üretildi. */

export type TrProvinceRecord = { plate: string; name: string; districts: string[] };

const data = raw as { provinces: TrProvinceRecord[] };

const byName = new Map(data.provinces.map((p) => [p.name, p]));

/** İl adları (Türkçe sıra). */
export const TR_PROVINCE_NAMES: string[] = data.provinces.map((p) => p.name);

export function districtsForProvince(provinceName: string): string[] {
  return byName.get(provinceName.trim())?.districts ?? [];
}

export function isTrProvinceDistrictValid(il: string, ilce: string): boolean {
  const d = districtsForProvince(il);
  return d.length > 0 && d.includes(ilce.trim());
}
