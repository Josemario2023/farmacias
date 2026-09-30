import { useEffect, useState } from "react";
import { Button, Table, Tag, Spin, Empty, message, Select } from "antd";
import { PlusOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  obtenerCajas, obtenerCortes, verCorte, corteAbierto,
} from "../api/cash.api";
import type { Caja, Corte } from "../api/cash.api";
import {
  AbrirTurnoModal, MovimientoCajaModal, CerrarTurnoModal,
} from "../components/caja/CajaModales";
import { Kpi } from "../components/ui/Kpi";
import { BotonExportar } from "../components/ui/BotonExportar";
import type { ColumnaCsv } from "../utils/exportar";
import { IconCaja } from "../components/layout/icons";
import "../styles/components.css";

const money = (n: number | null | undefined) =>
  n === null || n === undefined
    ? "—"
    : "Q " + Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function CajaPage() {
  const [cargando, setCargando] = useState(true);
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [cajaSel, setCajaSel] = useState<number | null>(null);
  const [abierto, setAbierto] = useState<Corte | null>(null);
  const [historial, setHistorial] = useState<Corte[]>([]);

  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalMov, setModalMov] = useState(false);
  const [modalCerrar, setModalCerrar] = useState(false);

  const SUCURSAL = 1;

  const cargar = async () => {
    setCargando(true);
    try {
      const cs = await obtenerCajas();
      setCajas(cs);

      // Elegir la primera caja si aún no hay una seleccionada
      const caja = cajaSel ?? cs[0]?.cajaId ?? null;
      setCajaSel(caja);

      if (caja) {
        const ab = await corteAbierto(caja);
        // Si hay turno abierto, traerlo CON sus movimientos
        setAbierto(ab ? await verCorte(ab.corteId) : null);
      }

      const cortes = await obtenerCortes();
      setHistorial(cortes);
    } catch {
      message.error("No se pudieron cargar los datos de caja");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [cajaSel]);

  // ---------- Cálculo del saldo esperado ----------
  const movimientos = abierto?.movimientos ?? [];
  const ingresos = movimientos
    .filter((m) => m.tipo === "INGRESO")
    .reduce((a, m) => a + Number(m.monto), 0);
  const egresos = movimientos
    .filter((m) => m.tipo === "EGRESO")
    .reduce((a, m) => a + Number(m.monto), 0);
  const apertura = Number(abierto?.montoApertura ?? 0);
  const esperado = apertura + ingresos - egresos;

  const columnasCsv: ColumnaCsv<Corte>[] = [
    { titulo: "Corte", valor: (c) => c.corteId },
    { titulo: "Caja", valor: (c) => c.cajaId },
    { titulo: "Turno", valor: (c) => c.turno },
    { titulo: "Apertura", valor: (c) => Number(c.montoApertura).toFixed(2) },
    { titulo: "Sistema", valor: (c) => Number(c.totalSistema ?? 0).toFixed(2) },
    { titulo: "Contado", valor: (c) => c.totalContado !== null ? Number(c.totalContado).toFixed(2) : "" },
    { titulo: "Diferencia", valor: (c) => c.diferencia !== null ? Number(c.diferencia).toFixed(2) : "" },
    { titulo: "Estado", valor: (c) => c.estado },
  ];

  if (cargando) {
    return <div style={{ padding: 80, textAlign: "center" }}><Spin size="large" /></div>;
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Caja y corte</h2>
          <p>Apertura de turno, movimientos de efectivo y conciliación al cierre.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Select
            style={{ width: 170 }}
            value={cajaSel}
            onChange={setCajaSel}
            placeholder="Caja"
            options={cajas.map((c) => ({ value: c.cajaId, label: c.nombre }))}
          />
          <BotonExportar
            nombreArchivo="cortes"
            columnas={columnasCsv}
            filas={historial}
            texto="Exportar"
          />
        </div>
      </div>

      {/*  SIN TURNO ABIERTO  */}
      {!abierto ? (
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ padding: 40, textAlign: "center" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <>
                  <b style={{ color: "var(--ink)", display: "block", marginBottom: 4 }}>
                    No hay turno abierto en esta caja
                  </b>
                  <span className="muted">
                    Abre un turno con el fondo inicial para empezar a operar.
                  </span>
                </>
              }
            />
            <Button
              type="primary"
              size="large"
              icon={<UnlockOutlined />}
              onClick={() => setModalAbrir(true)}
              style={{ marginTop: 12 }}
              disabled={!cajaSel}
            >
              Abrir turno
            </Button>
          </div>
        </div>
      ) : (
        /*  CON TURNO ABIERTO  */
        <>
          <div className="kpi-grid">
            <Kpi label="Fondo de apertura" valor={money(apertura)} chip="chip-blue" icono={<IconCaja />} />
            <Kpi label="Ingresos del turno" valor={money(ingresos)} chip="chip-green"
                 detalle={movimientos.filter((m) => m.tipo === "INGRESO").length + " movimiento(s)"} />
            <Kpi label="Egresos del turno" valor={money(egresos)} chip="chip-amber"
                 detalle={movimientos.filter((m) => m.tipo === "EGRESO").length + " movimiento(s)"} />
            <Kpi label="Efectivo esperado" valor={money(esperado)} chip="chip-violet"
                 detalle="apertura + ingresos − egresos" />
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-h">
              <h3>
                Turno {abierto.turno} · corte #{abierto.corteId}
                <Tag color="blue" style={{ marginLeft: 10 }}>ABIERTO</Tag>
              </h3>
              <div style={{ display: "flex", gap: 8 }}>
                <Button icon={<PlusOutlined />} onClick={() => setModalMov(true)}>
                  Registrar movimiento
                </Button>
                <Button type="primary" danger icon={<LockOutlined />} onClick={() => setModalCerrar(true)}>
                  Cerrar turno
                </Button>
              </div>
            </div>

            {movimientos.length === 0 ? (
              <div className="empty">
                <b>Sin movimientos aún</b>
                Las ventas en efectivo se registran automáticamente aquí.
              </div>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Concepto</th>
                      <th>Tipo</th>
                      <th className="num">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((m) => (
                      <tr key={m.movimientoId}>
                        <td>{dayjs(m.fecha).format("HH:mm")}</td>
                        <td>
                          {m.concepto}
                          {m.refId && <><br /><small className="muted">Venta #{m.refId}</small></>}
                        </td>
                        <td>
                          <span className={"tag " + (m.tipo === "INGRESO" ? "chip-green" : "chip-amber")}>
                            {m.tipo === "INGRESO" ? "Ingreso" : "Egreso"}
                          </span>
                        </td>
                        <td className="num">
                          <span className={m.tipo === "INGRESO" ? "delta-pos" : "delta-neg"}>
                            {m.tipo === "INGRESO" ? "+" : "−"} {money(m.monto)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/*  HISTORIAL DE CORTES  */}
      <div className="card">
        <div className="card-h">
          <h3>Historial de cortes</h3>
        </div>
        <Table
          rowKey="corteId"
          dataSource={historial}
          pagination={{ pageSize: 8 }}
          size="middle"
          columns={[
            { title: "#", dataIndex: "corteId", width: 60 },
            { title: "Caja", dataIndex: "cajaId", width: 70 },
            { title: "Turno", dataIndex: "turno", width: 100 },
            { title: "Apertura", dataIndex: "montoApertura", align: "right", width: 110,
              render: (v) => money(v) },
            { title: "Sistema", dataIndex: "totalSistema", align: "right", width: 110,
              render: (v) => money(v) },
            { title: "Contado", dataIndex: "totalContado", align: "right", width: 110,
              render: (v) => money(v) },
            { title: "Diferencia", dataIndex: "diferencia", align: "right", width: 130,
              render: (v) => {
                if (v === null || v === undefined) return "—";
                const n = Number(v);
                if (n === 0) return <Tag color="green">Cuadrado</Tag>;
                return (
                  <Tag color={n < 0 ? "red" : "orange"}>
                    {n < 0 ? "Faltante " : "Sobrante "}{money(Math.abs(n))}
                  </Tag>
                );
              } },
            { title: "Estado", dataIndex: "estado", width: 100,
              render: (v) => <Tag color={v === "ABIERTO" ? "blue" : "default"}>{v}</Tag> },
          ]}
        />
      </div>

      {/* Modales */}
      {cajaSel && (
        <AbrirTurnoModal
          abierto={modalAbrir}
          onCerrar={() => setModalAbrir(false)}
          onListo={cargar}
          cajaId={cajaSel}
          sucursalId={SUCURSAL}
        />
      )}
      {abierto && (
        <>
          <MovimientoCajaModal
            abierto={modalMov}
            onCerrar={() => setModalMov(false)}
            onListo={cargar}
            corteId={abierto.corteId}
          />
          <CerrarTurnoModal
            abierto={modalCerrar}
            onCerrar={() => setModalCerrar(false)}
            onListo={cargar}
            corte={abierto}
            esperado={esperado}
          />
        </>
      )}
    </>
  );
}