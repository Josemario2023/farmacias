import type { ReactNode } from "react";

interface Props {
  label: string;
  valor: string | number;
  chip?: "chip-green" | "chip-amber" | "chip-blue" | "chip-violet" | "chip-red";
  detalle?: string;
  icono?: ReactNode;
}

export function Kpi({ label, valor, chip = "chip-blue", detalle, icono }: Props) {
  return (
    <div className="card pad kpi">
      {icono && <span className={"ic-chip " + chip}>{icono}</span>}
      <div className="lab">{label}</div>
      <div className="num">{valor}</div>
      {detalle && <span className="delta muted">{detalle}</span>}
    </div>
  );
}