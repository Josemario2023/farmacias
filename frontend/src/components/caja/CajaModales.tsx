import { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, Alert, message } from "antd";
import { abrirCorte, registrarMovimientoCaja, cerrarCorte } from "../../api/cash.api";
import type { Corte } from "../../api/cash.api";
import { useSesion } from "../../hoocks/useSesion";

interface BaseProps {
  abierto: boolean;
  onCerrar: () => void;
  onListo: () => void;
}


// ABRIR TURNO

export function AbrirTurnoModal({ abierto, onCerrar, onListo, cajaId, sucursalId }:
  BaseProps & { cajaId: number; sucursalId: number }) {
  const [form] = Form.useForm();
  const [guardando, setGuardando] = useState(false);
  const { usuario } = useSesion();

  useEffect(() => { if (abierto) form.resetFields(); }, [abierto]);

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setGuardando(true);
       await abrirCorte({ ...v, cajaId, sucursalId, usuarioId: usuario!.usuarioId });
      message.success("Turno abierto");
      onListo();
      onCerrar();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "No se pudo abrir el turno");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title="Abrir turno de caja" open={abierto} onCancel={onCerrar} onOk={guardar}
           confirmLoading={guardando} okText="Abrir turno" cancelText="Cancelar" width={440}>
      <Form form={form} layout="vertical" initialValues={{ turno: "MANANA" }}>
        <Form.Item name="turno" label="Turno" rules={[{ required: true }]}>
          <Select options={[
            { value: "MANANA", label: "Mañana" },
            { value: "TARDE", label: "Tarde" },
            { value: "NOCHE", label: "Noche" },
          ]} />
        </Form.Item>

        <Form.Item name="montoApertura" label="Fondo inicial"
                   rules={[{ required: true, message: "Indica el fondo con que abres" }]}
                   extra="El efectivo con que inicias la caja para dar cambio">
          <InputNumber min={0} step={0.01} precision={2} prefix="Q"
                       style={{ width: "100%" }} placeholder="0.00" />
        </Form.Item>
      </Form>
    </Modal>
  );
}


// MOVIMIENTO (ingreso / egreso manual)

export function MovimientoCajaModal({ abierto, onCerrar, onListo, corteId }:
  BaseProps & { corteId: number }) {
  const [form] = Form.useForm();
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { if (abierto) form.resetFields(); }, [abierto]);

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setGuardando(true);
      await registrarMovimientoCaja({ ...v, corteId });
      message.success("Movimiento registrado");
      onListo();
      onCerrar();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "No se pudo registrar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title="Registrar movimiento de caja" open={abierto} onCancel={onCerrar} onOk={guardar}
           confirmLoading={guardando} okText="Registrar" cancelText="Cancelar" width={440}>
      <Form form={form} layout="vertical" initialValues={{ tipo: "EGRESO" }}>
        <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
          <Select options={[
            { value: "INGRESO", label: "Ingreso (entra dinero)" },
            { value: "EGRESO", label: "Egreso (sale dinero)" },
          ]} />
        </Form.Item>

        <Form.Item name="concepto" label="Concepto"
                   rules={[{ required: true, message: "Describe el movimiento" }]}>
          <Input placeholder="Ej. Compra de bolsas, pago de mensajería" maxLength={150} />
        </Form.Item>

        <Form.Item name="monto" label="Monto"
                   rules={[{ required: true, message: "Indica el monto" }]}>
          <InputNumber min={0.01} step={0.01} precision={2} prefix="Q"
                       style={{ width: "100%" }} placeholder="0.00" />
        </Form.Item>
      </Form>
    </Modal>
  );
}


// CERRAR TURNO (con conciliación)

export function CerrarTurnoModal({ abierto, onCerrar, onListo, corte, esperado }:
  BaseProps & { corte: Corte; esperado: number }) {
  const [form] = Form.useForm();
  const [guardando, setGuardando] = useState(false);
  const [contado, setContado] = useState<number | null>(null);
  const { usuario } = useSesion();  

  useEffect(() => {
    if (abierto) { form.resetFields(); setContado(null); }
  }, [abierto]);

  // Diferencia en vivo, mientras el cajero escribe
  const diferencia = contado !== null ? contado - esperado : null;

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setGuardando(true);
      const r = await cerrarCorte(corte.corteId, {
        totalContado: v.totalContado,
         usuarioId: usuario!.usuarioId,
      });
      const msg = "Corte cerrado · " + r.estado +
        (r.diferencia !== 0 ? " de Q " + Math.abs(r.diferencia).toFixed(2) : "");
      message.success(msg);
      onListo();
      onCerrar();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "No se pudo cerrar el turno");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title="Cerrar turno · conciliación" open={abierto} onCancel={onCerrar} onOk={guardar}
           confirmLoading={guardando} okText="Cerrar turno" cancelText="Cancelar" width={460}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={"El sistema espera Q " + esperado.toFixed(2)}
        description="Cuenta el efectivo físico e ingrésalo abajo. La diferencia se registrará como faltante o sobrante."
      />

      <Form form={form} layout="vertical">
        <Form.Item name="totalContado" label="Efectivo contado"
                   rules={[{ required: true, message: "Ingresa el monto contado" }]}>
          <InputNumber min={0} step={0.01} precision={2} prefix="Q" size="large"
                       style={{ width: "100%" }} placeholder="0.00"
                       onChange={(v) => setContado(v as number)} />
        </Form.Item>
      </Form>

      {/* Muestra la diferencia en vivo */}
      {diferencia !== null && (
        <div style={{
          padding: "12px 14px",
          borderRadius: 8,
          background: diferencia === 0 ? "var(--brand-wash)"
                    : diferencia < 0 ? "var(--red-wash)" : "var(--amber-wash)",
          color: diferencia === 0 ? "var(--brand)"
               : diferencia < 0 ? "var(--red)" : "var(--amber)",
          fontWeight: 600,
          textAlign: "center",
        }}>
          {diferencia === 0
            ? "✓ La caja cuadra"
            : diferencia < 0
              ? "Faltante de Q " + Math.abs(diferencia).toFixed(2)
              : "Sobrante de Q " + diferencia.toFixed(2)}
        </div>
      )}
    </Modal>
  );
}