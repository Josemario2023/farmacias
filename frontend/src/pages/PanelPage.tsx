import { useEffect, useState } from "react";
import { Spin, Button, message, Empty, Tag,DatePicker, Select } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { obtenerVentas } from "../api/pos.api";
import { obtenerFacturas } from "../api/billing.api";
import { obtenerHallazgos, ventasDetalle, consolidarTodo } from "../api/audit.api";
import type { Hallazgo } from "../api/audit.api";
import { alertasBajoMinimo, alertasPorVencer } from "../api/inventory.api";
import { Kpi } from "../components/ui/Kpi";
import { BarraRegion } from "../components/ui/BarraRegion";
import { AlertaItem } from "../components/ui/AlertaItem";
import {
  IconPos, IconFactura, IconInventario, IconCaja,
} from "../components/layout/icons";
import "../styles/components.css";
import { BotonExportar } from "../components/ui/BotonExportar";
import type { ColumnaCsv } from "../utils/exportar";
import { useCatalogos } from "../hoocks/useCatalogos";
import { useAlcance } from "../hoocks/useAlcance";

const money = (n: number) =>
  "Q " + Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PanelPage() {
  const cat = useCatalogos();
  const alc = useAlcance();
  const [cargando, setCargando] = useState(true);

  const [ventasBase, setVentas] = useState<any[]>([]);
  const [facturasBase, setFacturas] = useState<any[]>([]);
  const [hallazgosBase, setHallazgos] = useState<Hallazgo[]>([]);
  const [ventasDet, setVentasDet] = useState<any[]>([]);
  const [rango, setRango] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [agrupar, setAgrupar] = useState<"region" | "sucursal" | "mes">("region");
  const [bajoMinimoBase, setBajoMinimo] = useState<any[]>([]);
  const [porVencerBase, setPorVencer] = useState<any[]>([]);
  const ventas = ventasBase.filter((v) => alc.dentro(v.sucursalId));
  const facturas = facturasBase.filter((f) => alc.dentro(f.sucursalId));
  const hallazgos = hallazgosBase.filter((h) => alc.dentro(h.sucursalId));
  const bajoMinimo = bajoMinimoBase.filter((a) => alc.dentro(a.sucursalId));
  const porVencer = porVencerBase.filter((a) => alc.dentro(a.sucursalId));
  // una región se muestra si alguna de sus sucursales está dentro del alcance
  const ventasFiltradas = ventasDet.filter((r) => alc.dentro(r.sucursalId));
  const mapaVentas = new Map<string, { etiqueta: string; total: number; cant: number }>();
  ventasFiltradas.forEach((r) => {
    const clave =
      agrupar === "mes" ? r.fecha.slice(0, 7)
      : agrupar === "region" ? String(r.regionId)
      : String(r.sucursalId);
    const etiqueta =
      agrupar === "mes" ? dayjs(clave + "-01").format("MMMM YYYY")
      : agrupar === "region" ? cat.region(r.regionId)
      : cat.sucursal(r.sucursalId);
    const g = mapaVentas.get(clave) ?? { etiqueta, total: 0, cant: 0 };
    g.total += Number(r.totalVentas);
    g.cant += Number(r.cantidadVentas);
    mapaVentas.set(clave, g);
  });
  const barras = Array.from(mapaVentas.entries())
    .sort((a, b) => (agrupar === "mes" ? a[0].localeCompare(b[0]) : b[1].total - a[1].total))
    .map(([, g]) => g);

    const cargarVentas = async () => {
    try {
      setVentasDet(
        await ventasDetalle(rango[0].format("YYYY-MM-DD"), rango[1].format("YYYY-MM-DD")),
      );
    } catch { /* si auditoría está caída, el resto del panel igual carga */ }
  };

  const cargar = async () => {
    setCargando(true);

    // Promise.allSettled: si un servicio está caído, el resto igual carga
    const [v, f, h, bm, pv] = await Promise.allSettled([
      obtenerVentas(),
      obtenerFacturas(),
      obtenerHallazgos({ estado: "ABIERTO" }),
      alertasBajoMinimo(),
      alertasPorVencer(60),
    ]);

    if (v.status === "fulfilled") setVentas(v.value);
    if (f.status === "fulfilled") setFacturas(f.value);
    if (h.status === "fulfilled") setHallazgos(h.value);
    if (bm.status === "fulfilled") setBajoMinimo(bm.value);
    if (pv.status === "fulfilled") setPorVencer(pv.value);

    setCargando(false);
  };

  // Al abrir: consolidar lo pendiente y cargar todo
  useEffect(() => {
    consolidarTodo()
      .catch(() => {})
      .then(() => { cargar(); cargarVentas(); });
  }, []);

  // Al cambiar el período
  useEffect(() => { cargarVentas(); }, [rango]);

  // Recalcula el consolidado del día y recarga
  const actualizarConsolidado = async () => {
    try {
       await consolidarTodo();
      message.success("Consolidado actualizado");
      cargar();
      cargarVentas();
    } catch {
      message.error("No se pudo actualizar el consolidado");
    }
  };

  // ---------- Cálculos para los KPIs ----------
  const hoy = dayjs().format("YYYY-MM-DD");
  const ventasHoy = ventas.filter((v) => dayjs(v.fecha).format("YYYY-MM-DD") === hoy);
  const totalHoy = ventasHoy.reduce((a, v) => a + Number(v.total), 0);
  const facturasEmitidas = facturas.filter((f) => f.estado === "EMITIDA").length;
  const alertasStock = bajoMinimo.length + porVencer.length;
  const hallazgosAltos = hallazgos.filter((h) => h.severidad === "ALTA").length;

   const maxRegion = Math.max(...barras.map((b) => b.total), 1);

  if (cargando) {
    return <div style={{ padding: 80, textAlign: "center" }}><Spin size="large" /></div>;
  }
  const columnasVentas: ColumnaCsv<any>[] = [
    { titulo: "Número", valor: (v) => v.numero },
    { titulo: "Fecha", valor: (v) => dayjs(v.fecha).format("DD/MM/YYYY HH:mm") },
    { titulo: "Sucursal", valor: (v) => v.sucursalId },
    { titulo: "Usuario", valor: (v) => v.usuarioId },
    { titulo: "Estado", valor: (v) => v.estado },
    { titulo: "Total", valor: (v) => Number(v.total).toFixed(2) },
  ];
  return (
    <>
      <div className="page-head">
        <div>
          <h2>Panel general</h2>
          <p>Resumen de la operación · {dayjs().format("dddd D [de] MMMM, YYYY")}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <BotonExportar
            nombreArchivo="ventas"
            columnas={columnasVentas}
            filas={ventas}
            texto="Exportar ventas"
          />
          <Button icon={<ReloadOutlined />} onClick={actualizarConsolidado}>
            Actualizar consolidado
          </Button>
        </div>
      </div>

      {/* ---------- KPIs ---------- */}
      <div className="kpi-grid">
        <Kpi
          label="Ventas de hoy"
          valor={money(totalHoy)}
          chip="chip-green"
          detalle={ventasHoy.length + " venta(s)"}
          icono={<IconPos />}
        />
        <Kpi
          label="Facturas emitidas"
          valor={facturasEmitidas}
          chip="chip-blue"
          detalle={"de " + facturas.length + " en total"}
          icono={<IconFactura />}
        />
        <Kpi
          label="Alertas de inventario"
          valor={alertasStock}
          chip="chip-amber"
          detalle={bajoMinimo.length + " bajo mínimo · " + porVencer.length + " por vencer"}
          icono={<IconInventario />}
        />
        <Kpi
          label="Hallazgos abiertos"
          valor={hallazgos.length}
          chip={hallazgosAltos > 0 ? "chip-red" : "chip-violet"}
          detalle={hallazgosAltos + " de severidad alta"}
          icono={<IconCaja />}
        />
      </div>

      {/* ---------- Ventas por región + Alertas ---------- */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }}>
         <div className="card">
          <div className="card-h">
            <h3>Ventas por {agrupar === "mes" ? "mes" : agrupar === "region" ? "región" : "sucursal"}</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <DatePicker.RangePicker
                size="small"
                format="DD/MM/YYYY"
                allowClear={false}
                value={rango}
                onChange={(v) => { if (v && v[0] && v[1]) setRango([v[0], v[1]]); }}
                presets={[
                  { label: "Este mes", value: [dayjs().startOf("month"), dayjs().endOf("month")] },
                  { label: "Mes pasado", value: [
                      dayjs().subtract(1, "month").startOf("month"),
                      dayjs().subtract(1, "month").endOf("month"),
                    ] },
                  { label: "Últimos 3 meses", value: [dayjs().subtract(2, "month").startOf("month"), dayjs().endOf("month")] },
                  { label: "Este año", value: [dayjs().startOf("year"), dayjs().endOf("year")] },
                ]}
              />
              <Select
                size="small"
                value={agrupar}
                onChange={setAgrupar}
                style={{ width: 110 }}
                options={[
                  { value: "region", label: "Región" },
                  { value: "sucursal", label: "Sucursal" },
                  { value: "mes", label: "Mes" },
                ]}
              />
            </div>
          </div>
          <div style={{ padding: 18 }}>
            {barras.length === 0 ? (
              <Empty
                description="Sin ventas consolidadas en este período"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              barras.map((b, i) => (
                <BarraRegion
                  key={i}
                  etiqueta={b.etiqueta + " · " + b.cant + " venta(s)"}
                  valor={b.total}
                  maximo={maxRegion}
                />
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Alertas operativas</h3>
          </div>
          <div style={{ padding: "6px 18px 14px" }}>
            {hallazgos.length === 0 && bajoMinimo.length === 0 && porVencer.length === 0 ? (
              <Empty description="Todo en orden" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <>
                {hallazgos.slice(0, 3).map((h) => (
                  <AlertaItem
                    key={h.hallazgoId}
                    severidad={h.severidad}
                    titulo={h.tipo.replace(/_/g, " ")}
                    detalle={h.descripcion}
                  />
                ))}
                {bajoMinimo.slice(0, 2).map((a, i) => (
                  <AlertaItem
                    key={"bm" + i}
                    severidad="MEDIA"
                    titulo={a.nombre + " · stock " + a.stockActual}
                    detalle={"Bajo el mínimo (" + a.stockMinimo + ") · faltan " + a.faltante}
                  />
                ))}
                {porVencer.slice(0, 2).map((v, i) => (
                  <AlertaItem
                    key={"pv" + i}
                    severidad="BAJA"
                    titulo={v.nombre + " · lote " + v.numeroLote}
                    detalle={"Vence en " + v.diasRestantes + " días (" + v.fechaVencimiento + ")"}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Últimas ventas y facturas ---------- */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-h"><h3>Últimas ventas</h3></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Sucursal</th>
                  <th>Estado</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {ventas.slice(0, 5).map((v) => (
                  <tr key={v.ventaId}>
                    <td><b>{v.numero}</b></td>
                    <td>{cat.sucursal(v.sucursalId)}</td>                   
                    <td>
                      <Tag color={v.estado === "PAGADA" ? "blue" : "default"}>{v.estado}</Tag>
                    </td>
                    <td className="num">{money(v.total)}</td>
                  </tr>
                ))}
                {ventas.length === 0 && (
                  <tr><td colSpan={4} className="muted" style={{ textAlign: "center", padding: 24 }}>
                    Sin ventas registradas
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>Últimas facturas</h3></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Venta</th>
                  <th className="num">Impuesto</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {facturas.slice(0, 5).map((f) => (
                  <tr key={f.facturaId}>
                    <td><b>{f.numero}</b></td>
                    <td>{f.ventaId ?? "—"}</td>
                    <td className="num">{money(f.impuesto)}</td>
                    <td className="num">{money(f.total)}</td>
                  </tr>
                ))}
                {facturas.length === 0 && (
                  <tr><td colSpan={4} className="muted" style={{ textAlign: "center", padding: 24 }}>
                    Sin facturas emitidas
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}