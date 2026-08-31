const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFaDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

export function toEnDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

export function faNumber(value: number | string): string {
  return toFaDigits(Number(value).toLocaleString("en-US"));
}

export function faLength(mm: number): string {
  return `${toFaDigits(mm)} میلیمتر`;
}

export function faPercent(value: number): string {
  return `${toFaDigits(Math.round(value))}٪`;
}

export function faArea(cm2: number): string {
  return `${toFaDigits(Math.round(cm2).toLocaleString("en-US"))} سانتیمتر مربع`;
}
