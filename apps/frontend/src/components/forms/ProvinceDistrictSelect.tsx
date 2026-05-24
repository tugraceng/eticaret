"use client";

import { useMemo } from "react";
import { TR_PROVINCE_NAMES, districtsForProvince } from "@/lib/tr-province-district";

type Props = {
  province: string;
  district: string;
  onProvinceChange: (province: string) => void;
  onDistrictChange: (district: string) => void;
  disabled?: boolean;
  provinceError?: string;
  districtError?: string;
};

export function ProvinceDistrictSelect({
  province,
  district,
  onProvinceChange,
  onDistrictChange,
  disabled,
  provinceError,
  districtError,
}: Props) {
  const provinceOptions = useMemo(() => {
    if (province && !TR_PROVINCE_NAMES.includes(province)) {
      return [province, ...TR_PROVINCE_NAMES];
    }
    return TR_PROVINCE_NAMES;
  }, [province]);

  const districtOptions = useMemo(() => {
    const list = districtsForProvince(province);
    if (district && !list.includes(district)) {
      return [district, ...list];
    }
    return list;
  }, [province, district]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">İl *</label>
        <select
          value={province}
          disabled={disabled}
          onChange={(e) => {
            onProvinceChange(e.target.value);
            onDistrictChange("");
          }}
          className="input-soft mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
          autoComplete="address-level1"
        >
          <option value="">İl seçin</option>
          {provinceOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {provinceError ? <p className="mt-1 text-xs text-rose-600">{provinceError}</p> : null}
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">İlçe *</label>
        <select
          value={district}
          disabled={disabled || !province}
          onChange={(e) => onDistrictChange(e.target.value)}
          className="input-soft mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
          autoComplete="address-level2"
        >
          <option value="">{province ? "İlçe seçin" : "Önce il seçin"}</option>
          {districtOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {districtError ? <p className="mt-1 text-xs text-rose-600">{districtError}</p> : null}
      </div>
    </div>
  );
}
