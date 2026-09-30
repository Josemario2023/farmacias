interface Props {
  etiqueta: string;
  valor: number;
  maximo: number;
}

// Barra horizontal proporcional (como en el prototipo)
export function BarraRegion({ etiqueta, valor, maximo }: Props) {
  const porcentaje = maximo > 0 ? (valor / maximo) * 100 : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: "var(--ink)", fontWeight: 500 }}>{etiqueta}</span>
        <span style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
          Q {valor.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div style={{ height: 8, background: "var(--line-soft)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          width: porcentaje + "%",
          height: "100%",
          background: "var(--brand)",
          borderRadius: 999,
          transition: "width .4s",
        }} />
      </div>
    </div>
  );
}