import { useEffect, useState } from "react";
import { Tabs, Table, Tag, Button, Select, DatePicker, Spin, message, Empty, Drawer, Descriptions } from "antd";
import { ReloadOutlined, SyncOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  obtenerHallazgos, cambiarEstadoHallazgo, ventasDetalle, cajaDetalle,
  obtenerBitacora, resumenBitacora, consolidarTodo, sincronizarBitacora,
} from "../api/audit.api";
import type { Hallazgo, RegistroBitacora } from "../api/audit.api";
import {
  nombreTabla, nombreModulo, infoOperacion, descomponerJson, resumirCambio,
} from "../utils/traducirAuditoria";
import { Kpi } from "../components/ui/Kpi";
import { BarraRegion } from "../components/ui/BarraRegion";
import { BotonExportar } from "../components/ui/BotonExportar";
import type { ColumnaCsv } from "../utils/exportar";
import { IconAuditoria, IconCaja, IconPos } from "../components/layout/icons";
import "../styles/components.css";
import { useCatalogos } from "../hoocks/useCatalogos";
import { traducirValor } from "../utils/traducirAuditoria";
import { useAlcance } from "../hoocks/useAlcance";

const money = (n: number) =>
  "Q " + Number(n ?? 0).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function AuditoriaPage() {
  const [cargando, setCargando] = useState(true);
  const cat = useCatalogos();
  const alc = useAlcance();

  const [hallazgos, setHallazgos] = useState<Hallazgo[]>([]);
  const [ventasDet, setVentasDet] = useState<any[]>([]);
  const [cajaDet, setCajaDet] = useState<any[]>([]);
  const [rango, setRango] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [agrupar, setAgrupar] = useState<"region" | "sucursal" | "mes">("region");
  const [bitacora, setBitacora] = useState<RegistroBitacora[]>([]);
  const [resumen, setResumen] = useState<any[]>([]);

  // Filtros de la bitácora
  const [fEsquema, setFEsquema] = useState<string>();
  const [fOperacion, setFOperacion] = useState<string>();
  const [fDesde, setFDesde] = useState<string>();

  // Detalle del cambio (panel lateral)
  const [detalle, setDetalle] = useState<RegistroBitacora | null>(null);

  const cargar = async () => {
    setCargando(true);
    const [h, bi, rs] = await Promise.allSettled([
      obtenerHallazgos(),
      obtenerBitacora(),
      resumenBitacora(),
    ]);

    if (h.status === "fulfilled") setHallazgos(h.value);
    if (bi.status === "fulfilled") setBitacora(bi.value);
    if (rs.status === "fulfilled") setResumen(rs.value);

    setCargando(false);
  };

  const cargarTableros = async () => {
    const desde = rango[0].format("YYYY-MM-DD");
    const hasta = rango[1].format("YYYY-MM-DD");
    const [v, c] = await Promise.allSettled([
      ventasDetalle(desde, hasta),
      cajaDetalle(desde, hasta),
    ]);
    if (v.status === "fulfilled") setVentasDet(v.value);
    if (c.status === "fulfilled") setCajaDet(c.value);
  };

  // Al abrir la página: consolidar lo pendiente y cargar todo
  useEffect(() => {
    consolidarTodo()
      .catch(() => {})
      .then(() => { cargar(); cargarTableros(); });
  }, []);

  // Al cambiar el período
  useEffect(() => { cargarTableros(); }, [rango]);

  const filtrarBitacora = async () => {
    try {
      const datos = await obtenerBitacora({
        esquema: fEsquema,
        operacion: fOperacion,
        fechaInicio: fDesde,
      });
      setBitacora(datos);
    } catch {
      message.error("No se pudo consultar la bitácora");
    }
  };

  const resolver = async (id: number, estado: string) => {
    try {
      await cambiarEstadoHallazgo(id, estado);
      message.success("Hallazgo marcado como " + estado.toLowerCase());
      cargar();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Error desconocido";
      message.error("No se pudo actualizar: " + msg);
      console.error("Error al resolver hallazgo:", e);
    }
  };

  const sincronizar = async () => {
    try {
      const r = await sincronizarBitacora();
      message.success(r.mensaje + " · " + (r.enviadas ?? 0) + " registro(s)");
    } catch {
      message.error("No se pudo sincronizar con SQL Server");
    }
  };

  const abiertos = hallazgos.filter((h) => h.estado === "ABIERTO");
  const altos = abiertos.filter((h) => h.severidad === "ALTA");

  // Solo lo que entra en el alcance de sucursales del usuario
  const ventasFiltradas = ventasDet.filter((r) => alc.dentro(r.sucursalId));
  const cajaFiltrada = cajaDet.filter((r) => alc.dentro(r.sucursalId));
  const totalPeriodo = ventasFiltradas.reduce((a, r) => a + Number(r.totalVentas), 0);
  const cantidadPeriodo = ventasFiltradas.reduce((a, r) => a + Number(r.cantidadVentas), 0);

  // Ventas agrupadas como el usuario lo pida: región, sucursal o mes
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
  const maxVentas = Math.max(...barras.map((b) => b.total), 1);

  // Caja agrupada por sucursal
  const mapaCaja = new Map<number, { regionId: number; ingresos: number; dif: number; dias: number }>();
  cajaFiltrada.forEach((r) => {
    const g = mapaCaja.get(r.sucursalId) ?? { regionId: r.regionId, ingresos: 0, dif: 0, dias: 0 };
    g.ingresos += Number(r.totalIngresos);
    g.dif += Number(r.diferencia);
    g.dias += 1;
    mapaCaja.set(r.sucursalId, g);
  });
  const cajaPorSucursal = Array.from(mapaCaja.entries())
    .map(([sucursalId, g]) => ({ sucursalId, ...g }))
    .sort((a, b) => a.dif - b.dif);
  const diferenciaTotal = cajaPorSucursal.reduce((a, s) => a + s.dif, 0);

  if (cargando) {
    return <div style={{ padding: 80, textAlign: "center" }}><Spin size="large" /></div>;
  }

  //  TABLEROS
  const tabTableros = (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="toolbar">
          <div className="f">
            <label>Período</label>
            <DatePicker.RangePicker
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
          </div>
          <div className="f" style={{ minWidth: 180 }}>
            <label>Ver ventas por</label>
            <Select
              value={agrupar}
              onChange={setAgrupar}
              style={{ width: "100%" }}
              options={[
                { value: "region", label: "Región" },
                { value: "sucursal", label: "Sucursal" },
                { value: "mes", label: "Mes" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi label="Hallazgos abiertos" valor={abiertos.length}
             chip={altos.length > 0 ? "chip-red" : "chip-violet"}
             detalle={altos.length + " de severidad alta"} icono={<IconAuditoria />} />
        <Kpi label="Ventas del período" valor={money(totalPeriodo)}
             chip="chip-green" detalle={cantidadPeriodo + " venta(s) consolidadas"} icono={<IconPos />} />
        <Kpi label="Descuadre acumulado" valor={money(diferenciaTotal)}
             chip={diferenciaTotal < 0 ? "chip-red" : "chip-blue"}
             detalle="suma de faltantes y sobrantes" icono={<IconCaja />} />
        <Kpi label="Cambios registrados" valor={bitacora.length}
             chip="chip-blue" detalle="en la bitácora" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-h">
            <h3>Ventas por {agrupar === "mes" ? "mes" : agrupar === "region" ? "región" : "sucursal"}</h3>
          </div>
          <div style={{ padding: 18 }}>
            {barras.length === 0 ? (
              <Empty description="Sin ventas consolidadas en este período" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              barras.map((b, i) => (
                <BarraRegion key={i}
                  etiqueta={b.etiqueta + " · " + b.cant + " venta(s)"}
                  valor={b.total} maximo={maxVentas} />
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>Control de caja por sucursal</h3></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Sucursal</th>
                  <th>Región</th>
                  <th className="num">Ingresos</th>
                  <th className="num">Descuadre</th>
                </tr>
              </thead>
              <tbody>
                {cajaPorSucursal.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: 24 }} className="muted">
                    Sin cierres de caja en este período
                  </td></tr>
                ) : cajaPorSucursal.map((s) => (
                  <tr key={s.sucursalId}>
                    <td><b>{cat.sucursal(s.sucursalId)}</b></td>
                    <td>{cat.region(s.regionId)}</td>
                    <td className="num">{money(s.ingresos)}</td>
                    <td className="num">
                      {s.dif === 0 ? <Tag color="green">Cuadrado</Tag>
                        : <Tag color={s.dif < 0 ? "red" : "orange"}>
                            {s.dif < 0 ? "Faltante " : "Sobrante "}{money(Math.abs(s.dif))}
                          </Tag>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );

  //  HALLAZGOS
  const tabHallazgos = (
    <div className="card">
      <div className="card-h">
        <h3>Hallazgos detectados</h3>
        <BotonExportar nombreArchivo="hallazgos" size="small"
          columnas={[
            { titulo: "ID", valor: (h: Hallazgo) => h.hallazgoId },
            { titulo: "Tipo", valor: (h) => h.tipo.replace(/_/g, " ") },
            { titulo: "Severidad", valor: (h) => h.severidad },
            { titulo: "Descripción", valor: (h) => h.descripcion },
            { titulo: "Sucursal", valor: (h) => h.sucursalId },
            { titulo: "Región", valor: (h) => h.regionId },
            { titulo: "Monto", valor: (h) => h.monto ?? "" },
            { titulo: "Estado", valor: (h) => h.estado },
            { titulo: "Fecha", valor: (h) => dayjs(h.creadoEn).format("DD/MM/YYYY HH:mm") },
          ] as ColumnaCsv<Hallazgo>[]}
          filas={hallazgos} />
      </div>
      <Table
        rowKey="hallazgoId"
        dataSource={hallazgos}
        pagination={{ pageSize: 10 }}
        size="middle"
        columns={[
          { title: "Severidad", dataIndex: "severidad", width: 110,
            render: (v) => <Tag color={v === "ALTA" ? "red" : v === "MEDIA" ? "orange" : "blue"}>{v}</Tag> },
          { title: "Tipo", dataIndex: "tipo", width: 190,
            render: (v) => v.replace(/_/g, " ") },
          { title: "Descripción", dataIndex: "descripcion" },
          { title: "Ubicación", width: 180,
            render: (_, h: Hallazgo) => (
              <>
                {cat.sucursal(h.sucursalId)}
                <br />
                <small className="muted">{cat.region(h.regionId)}</small>
              </>
            ) },
          { title: "Monto", dataIndex: "monto", align: "right", width: 110,
            render: (v) => v ? money(v) : "—" },
          { title: "Fecha", dataIndex: "creadoEn", width: 130,
            render: (v) => dayjs(v).format("DD/MM/YY HH:mm") },
          { title: "Estado", dataIndex: "estado", width: 200,
            render: (v, h: Hallazgo) =>
              v === "RESUELTO" ? <Tag color="green">Resuelto</Tag> : (
                <div style={{ display: "flex", gap: 6 }}>
                  <Tag color={v === "ABIERTO" ? "red" : "orange"}>{v}</Tag>
                  <Button size="small" onClick={() => resolver(h.hallazgoId, "RESUELTO")}>
                    Resolver
                  </Button>
                </div>
              ) },
        ]}
      />
    </div>
  );

  // BITÁCORA
  const tabBitacora = (
    <>
      {/* Resumen de actividad por tabla */}
      {resumen.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-h"><h3>Actividad por módulo</h3></div>
          <div style={{ padding: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {resumen.map((r, i) => (
              <div key={i} style={{
                padding: "8px 14px",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontSize: 13,
              }}>
                <b style={{ color: "var(--ink)" }}>{nombreTabla(r.tabla)}</b>
                <br />
                <small className="muted">
                  {infoOperacion(r.operacion).label} · {r.cantidad} registro(s)
                </small>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="toolbar">
          <div className="f" style={{ minWidth: 170 }}>
            <label>Módulo</label>
            <Select allowClear placeholder="Todos" style={{ width: "100%" }}
              value={fEsquema} onChange={setFEsquema}
              options={[
                { value: "FRM_USERS", label: "Usuarios" },
                { value: "FRM_INVENTORY", label: "Inventario" },
                { value: "FRM_POS", label: "Punto de venta" },
                { value: "FRM_BILLING", label: "Facturación" },
                { value: "FRM_CASH", label: "Caja" },
                { value: "FRM_ASSETS", label: "Activos fijos" },
                { value: "FRM_DELIVERY", label: "Entregas" },
                { value: "FRM_PAYROLL", label: "Planilla" },
              ]} />
          </div>
          <div className="f" style={{ minWidth: 150 }}>
            <label>Acción</label>
            <Select allowClear placeholder="Todas" style={{ width: "100%" }}
              value={fOperacion} onChange={setFOperacion}
              options={[
                { value: "INSERT", label: "Creación" },
                { value: "UPDATE", label: "Modificación" },
                { value: "DELETE", label: "Eliminación" },
              ]} />
          </div>
          <div className="f">
            <label>Desde</label>
            <DatePicker format="DD/MM/YYYY"
              value={fDesde ? dayjs(fDesde) : null}
              onChange={(d) => setFDesde(d ? d.format("YYYY-MM-DD") : undefined)} />
          </div>
          <div className="f">
            <label>&nbsp;</label>
            <div style={{ display: "flex", gap: 8 }}>
              <Button type="primary" onClick={filtrarBitacora}>Filtrar</Button>
              <Button icon={<SyncOutlined />} onClick={sincronizar}>
                Sincronizar a SQL Server
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Registro de cambios</h3>
          <span className="muted" style={{ fontSize: 12.5 }}>
            {bitacora.length} registro(s) · clic en una fila para ver el detalle
          </span>
        </div>
        <Table
          rowKey="bitacoraId"
          dataSource={bitacora}
          pagination={{ pageSize: 12 }}
          size="middle"
          onRow={(r) => ({ onClick: () => setDetalle(r), style: { cursor: "pointer" } })}
          columns={[
            { title: "Fecha y hora", dataIndex: "fechaEvento", width: 145,
              render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm:ss") },
            { title: "Módulo", dataIndex: "esquema", width: 130,
              render: (v) => nombreModulo(v) },
            { title: "Qué cambió", width: 260,
              render: (_, r: RegistroBitacora) => (
                <>
                  <b>{nombreTabla(r.tabla)}</b>
                  <br />
                  <small className="muted">{resumirCambio(r)}</small>
                </>
              ) },
            { title: "Acción", dataIndex: "operacion", width: 120,
              render: (v) => {
                const i = infoOperacion(v);
                return <Tag color={i.color}>{i.label}</Tag>;
              } },
            { title: "Realizado por", dataIndex: "usuarioApp", width: 150,
              render: (v) => v ? cat.usuario(v) : <span className="muted">Sistema</span> },
          ]}
        />
      </div>

      {/* Panel lateral con el detalle del cambio */}
      <Drawer
        title={detalle ? nombreTabla(detalle.tabla) + " · " + infoOperacion(detalle.operacion).label : ""}
        open={!!detalle}
        onClose={() => setDetalle(null)}
        width={480}
      >
        {detalle && (
          <>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Módulo">{nombreModulo(detalle.esquema)}</Descriptions.Item>
              <Descriptions.Item label="Registro">#{detalle.clavePk}</Descriptions.Item>
              <Descriptions.Item label="Fecha">
                {dayjs(detalle.fechaEvento).format("DD/MM/YYYY HH:mm:ss")}
              </Descriptions.Item>
              <Descriptions.Item label="Realizado por">
                {detalle.usuarioApp ? cat.usuario(detalle.usuarioApp) : "Sistema (proceso automático)"}
              </Descriptions.Item>
            </Descriptions>

            {detalle.valoresAnteriores && (
              <>
                <h4 style={{ marginBottom: 8, color: "var(--muted)" }}>Valores anteriores</h4>
                <Descriptions column={1} size="small" bordered style={{ marginBottom: 20 }}>
                  {descomponerJson(detalle.valoresAnteriores).map((c, i) => (
                    <Descriptions.Item key={i} label={c.campo}>
                      {traducirValor(c.campo, c.valor, cat)}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </>
            )}
            <h4 style={{ marginBottom: 8, color: "var(--muted)" }}>
              {detalle.valoresAnteriores ? "Valores nuevos" : "Datos registrados"}
            </h4>
            <Descriptions column={1} size="small" bordered>
              {descomponerJson(detalle.valoresNuevos).map((c, i) => (
                <Descriptions.Item key={i} label={c.campo}>
                  {traducirValor(c.campo, c.valor, cat)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </>
        )}
      </Drawer>
    </>
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Auditoría central</h2>
          <p>Control de todas las sucursales · consolidados, hallazgos y registro de cambios.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={async () => {
          await consolidarTodo();
          cargar();
          cargarTableros();
        }}>
          Actualizar consolidados
        </Button>
      </div>

      <Tabs
        defaultActiveKey="tableros"
        items={[
          { key: "tableros", label: "Tableros", children: tabTableros },
          { key: "hallazgos", label: "Hallazgos (" + abiertos.length + ")", children: tabHallazgos },
          { key: "bitacora", label: "Bitácora de cambios", children: tabBitacora },
        ]}
      />
    </>
  );
}