import { useEffect, useState } from "react";
import { Spin, Tag, message, Button, Modal, Input, InputNumber, Select, Drawer } from "antd";
import dayjs from "dayjs";
import {
  obtenerPlanillas, obtenerPlanilla, crearPlanilla, cerrarPlanilla, registrarPago,
} from "../../api/payroll.api";
import type { Empleado, Planilla, PlanillaDetalle } from "../../api/payroll.api";
import { useCatalogos } from "../../hoocks/useCatalogos";
import { useSesion } from "../../hoocks/useSesion";
import { useAlcance } from "../../hoocks/useAlcance";
import "../../styles/components.css";
import { PrinterOutlined } from "@ant-design/icons";

const Q = (n: number) => "Q " + Number(n).toFixed(2);

const TIPOS = [
  { value: "SALARIO", label: "Salario" },
  { value: "BONO", label: "Bono" },
  { value: "OTRO", label: "Otro" },
];

export function PlanillasTab({ empleados }: { empleados: Empleado[] }) {
  const cat = useCatalogos();
  const alc = useAlcance();
  const { sucursalActiva } = useSesion();

  const [planillas, setPlanillas] = useState<Planilla[]>([]);
  const visibles = planillas.filter((p) => alc.dentro(p.sucursalId));
  const [cargando, setCargando] = useState(false);

  // modal planilla nueva
  const [modalNueva, setModalNueva] = useState(false);
  const [periodo, setPeriodo] = useState("");
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);

  // detalle y pago
  const [detalle, setDetalle] = useState<PlanillaDetalle | null>(null);
  const [abriendo, setAbriendo] = useState(false);
  const [empleadoId, setEmpleadoId] = useState<number | null>(null);
  const [tipo, setTipo] = useState("SALARIO");
  const [monto, setMonto] = useState<number | null>(null);
  const [pagando, setPagando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      setPlanillas(await obtenerPlanillas());
    } catch {
      message.error("No se pudieron cargar las planillas");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const nombreEmpleado = (id: number) =>
    empleados.find((e) => e.empleadoId === id)?.nombre ?? "Empleado " + id;

  // ---------- planilla nueva ----------
  const abrirNueva = () => {
    setPeriodo("");
    setSucursalId(sucursalActiva);
    setModalNueva(true);
  };

  const guardarNueva = async () => {
    if (!periodo || sucursalId == null) {
      message.warning("Elige el periodo y la sucursal");
      return;
    }
    setCreando(true);
    try {
      await crearPlanilla({ periodo, sucursalId });
      message.success("Planilla creada");
      setModalNueva(false);
      cargar();
    } catch (e: any) {
      const m = e?.response?.data?.message;
      message.error(Array.isArray(m) ? m.join(", ") : m ?? "No se pudo crear la planilla");
    } finally {
      setCreando(false);
    }
  };

  // detalle 
  const abrirDetalle = async (p: Planilla) => {
    setAbriendo(true);
    setEmpleadoId(null); setTipo("SALARIO"); setMonto(null);
    setDetalle({ ...p, pagos: [] });
    try {
      setDetalle(await obtenerPlanilla(p.planillaId));
    } catch {
      message.error("No se pudo cargar la planilla");
      setDetalle(null);
    } finally {
      setAbriendo(false);
    }
  };

  const pagar = async () => {
    if (!detalle) return;
    if (empleadoId == null || monto == null || monto <= 0) {
      message.warning("Elige el empleado y un monto mayor a cero");
      return;
    }
    setPagando(true);
    try {
      await registrarPago({ planillaId: detalle.planillaId, empleadoId, tipo, montoPagado: monto });
      message.success("Pago registrado");
      setEmpleadoId(null); setMonto(null);
      setDetalle(await obtenerPlanilla(detalle.planillaId));
      cargar();
    } catch (e: any) {
      const m = e?.response?.data?.message;
      message.error(Array.isArray(m) ? m.join(", ") : m ?? "No se pudo registrar el pago");
    } finally {
      setPagando(false);
    }
  };

  const cerrar = () => {
    if (!detalle) return;
    Modal.confirm({
      title: "Cerrar planilla " + detalle.periodo,
      content: "Una planilla cerrada ya no acepta más pagos. No se puede deshacer.",
      okText: "Cerrar planilla",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await cerrarPlanilla(detalle.planillaId);
          message.success("Planilla cerrada");
          setDetalle(null);
          cargar();
        } catch (e: any) {
          message.error(e?.response?.data?.message ?? "No se pudo cerrar la planilla");
        }
      },
    });
  };

  // Solo empleados activos de la sucursal de ESTA planilla
  const empleadosDeLaPlanilla = detalle
    ? empleados.filter((e) => e.sucursalId === detalle.sucursalId && e.activo === 1)
    : [];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Button type="primary" onClick={abrirNueva}>Nueva planilla</Button>
      </div>

      <div className="card">
        {cargando ? (
          <div style={{ padding: 60, textAlign: "center" }}><Spin /></div>
        ) : visibles.length === 0 ? (
          <div className="empty">
            <b>Sin planillas</b>
            Crea la primera con el botón "Nueva planilla".
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Sucursal</th>
                  <th className="num">Total pagado</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.planillaId} onClick={() => abrirDetalle(p)} style={{ cursor: "pointer" }}>
                    <td><b>{p.periodo}</b></td>
                    <td>{cat.sucursal(p.sucursalId)}</td>
                    <td className="num">{Q(p.totalPagado)}</td>
                    <td><Tag color={p.estado === "CERRADA" ? "default" : "green"}>{p.estado}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detalle y pagos */}
      <Drawer
        open={detalle != null}
        onClose={() => setDetalle(null)}
        size={620}
        title={detalle ? "Planilla " + detalle.periodo + " · " + cat.sucursal(detalle.sucursalId) : ""}
        loading={abriendo}
         extra={
          <Button icon={<PrinterOutlined />} type="primary" onClick={() => window.print()}>
            Imprimir
          </Button>
        }
      >
      
        {detalle && (
          <>
            <p><b>Estado:</b> <Tag color={detalle.estado === "CERRADA" ? "default" : "green"}>{detalle.estado}</Tag></p>
            <p><b>Total pagado:</b> {Q(detalle.totalPagado)}</p>

            <p style={{ marginTop: 16 }}><b>Pagos</b></p>
            {detalle.pagos.length === 0 ? (
              <p style={{ color: "#888" }}>Todavía no hay pagos en esta planilla.</p>
            ) : (
              <table className="tbl" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                    <th className="num">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.pagos.map((g) => (
                    <tr key={g.pagoPlanillaId}>
                      <td>{nombreEmpleado(g.empleadoId)}</td>
                      <td>{g.tipo}</td>
                      <td>{dayjs(g.fechaPago).format("DD/MM/YYYY")}</td>
                      <td className="num">{Q(g.montoPagado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {detalle.estado === "ABIERTA" && (
              <>
                <p style={{ marginTop: 20 }}><b>Registrar pago</b></p>
                <Select
                  style={{ width: "100%" }}
                  value={empleadoId}
                  onChange={setEmpleadoId}
                  placeholder={
                    empleadosDeLaPlanilla.length === 0
                      ? "No hay empleados activos en esta sucursal"
                      : "Elige el empleado"
                  }
                  options={empleadosDeLaPlanilla.map((e) => ({
                    value: e.empleadoId,
                    label: e.codigo + " · " + e.nombre,
                  }))}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Select style={{ width: 140 }} value={tipo} onChange={setTipo} options={TIPOS} />
                  <InputNumber
                    min={0}
                    value={monto}
                    onChange={setMonto}
                    placeholder="Monto (Q)"
                    style={{ flex: 1 }}
                  />
                  <Button type="primary" loading={pagando} onClick={pagar}>Pagar</Button>
                </div>

                <Button style={{ marginTop: 24 }} onClick={cerrar}>Cerrar planilla</Button>
              </>
            )}
          </>
        )}
      </Drawer>

      {/* Hoja que sale en papel: oculta en pantalla, visible solo al imprimir */}
      {detalle && (
        <div className="factura-print">
          <h2 style={{ textAlign: "center", margin: 0 }}>Farmacias</h2>
          <p style={{ textAlign: "center" }}>{cat.sucursal(detalle.sucursalId)}</p>
          <h3>Planilla {detalle.periodo} {detalle.estado === "CERRADA" ? "(CERRADA)" : "(ABIERTA)"}</h3>
          <p>Impreso: {dayjs().format("DD/MM/YYYY HH:mm")}</p>

          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #000" }}>Empleado</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #000" }}>Tipo</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #000" }}>Fecha</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #000" }}>Monto</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #000", width: 160 }}>Firma</th>
              </tr>
            </thead>
            <tbody>
              {detalle.pagos.map((g) => (
                <tr key={g.pagoPlanillaId}>
                  <td style={{ padding: "14px 0 4px" }}>{nombreEmpleado(g.empleadoId)}</td>
                  <td style={{ padding: "14px 0 4px" }}>{g.tipo}</td>
                  <td style={{ padding: "14px 0 4px" }}>{dayjs(g.fechaPago).format("DD/MM/YYYY")}</td>
                  <td style={{ padding: "14px 0 4px", textAlign: "right" }}>{Q(g.montoPagado)}</td>
                  <td style={{ borderBottom: "1px solid #000" }}></td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ textAlign: "right", marginTop: 16 }}>
            <b>Total pagado: {Q(detalle.totalPagado)}</b>
          </p>
        </div>
      )}; 
      
      {/* Planilla nueva */}
      <Modal
        open={modalNueva}
        title="Nueva planilla"
        onCancel={() => setModalNueva(false)}
        onOk={guardarNueva}
        okText="Crear"
        cancelText="Cancelar"
        confirmLoading={creando}
      >
        <p>Periodo</p>
        <Input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
        <p style={{ marginTop: 12 }}>Sucursal</p>
        <Select
          style={{ width: "100%" }}
          value={sucursalId}
          onChange={setSucursalId}
          placeholder="Elige una sucursal"
          options={alc.permitidas}
        />
        <p style={{ color: "#888", marginTop: 8 }}>
          Hay una sola planilla por sucursal y periodo. Los pagos solo pueden ser de empleados de esa sucursal.
        </p>
      </Modal>
    </>
  );
}