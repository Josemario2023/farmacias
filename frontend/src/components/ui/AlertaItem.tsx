interface Props {
  severidad: "ALTA" | "MEDIA" | "BAJA" | string;
  titulo: string;
  detalle: string;
}

const COLOR: Record<string, string> = {
  ALTA: "var(--red)",
  MEDIA: "var(--amber)",
  BAJA: "var(--blue)",
};

export function AlertaItem({ severidad, titulo, detalle }: Props) {
  return (
    <div style={{
      display: "flex",
      gap: 11,
      padding: "11px 0",
      borderBottom: "1px solid var(--line-soft)",
    }}>
      {/* Barrita de color según la severidad */}
      <div style={{
        width: 3,
        borderRadius: 3,
        background: COLOR[severidad] ?? "var(--muted)",
        flex: "none",
      }} />
      <div style={{ minWidth: 0 }}>
        <b style={{ fontSize: 13.5, color: "var(--ink)", display: "block" }}>{titulo}</b>
        <small style={{ color: "var(--muted)", fontSize: 12 }}>{detalle}</small>
      </div>
    </div>
  );
}