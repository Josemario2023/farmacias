export const TASA_IVA = 0.12;
export const conIva = (base: number) => Math.round(base * (1 + TASA_IVA) * 100) / 100;