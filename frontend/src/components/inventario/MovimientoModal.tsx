import { useEffect, useState } from "react";
import { Modal, Form, Select, InputNumber, Input, message } from "antd";
import { obtenerProductos, obtenerLotes, registrarMovimiento } from "../../api/inventory.api";
import type { Producto, Lote } from "../../api/inventory.api";
import { LISTA_TIPOS, etiquetaTipo } from "../ui/TipoMovimiento";
import { useCatalogos } from "../../hoocks/useCatalogos";
import { useSesion } from "../../hoocks/useSesion";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onListo: () => void;   // avisa al padre para que recargue
}

export function MovimientoModal({ abierto, onCerrar, onListo }: Props) {
 const cat=useCatalogos();
 const {usuario} = useSesion();
  const [form] = Form.useForm();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [guardando, setGuardando] = useState(false);
  

  useEffect(() => {
    if (abierto) {
      obtenerProductos().then(setProductos).catch(() => {});
      form.resetFields();
      setLotes([]);
    }
  }, [abierto]);

  // Al elegir producto, cargar SUS lotes (no todos)
  const alCambiarProducto = async (productoId: number) => {
    form.setFieldValue("loteId", undefined);
    try {
      const l = await obtenerLotes(productoId);
      setLotes(l);
      if (l.length === 0) {
        message.warning("Este producto no tiene lotes. Crea uno primero en el catálogo.");
      }
    } catch {
      setLotes([]);
    }
  };

  const guardar = async () => {
    try {
      const valores = await form.validateFields();
      setGuardando(true);
      await registrarMovimiento({
        ...valores,
        usuarioId:usuario?.usuarioId,   // TODO: tomarlo del usuario en sesión
      });
      message.success("Movimiento registrado");
      onListo();
      onCerrar();
    } catch (e: any) {
      if (e?.errorFields) return;   // error de validación del formulario
      message.error(e?.response?.data?.message ?? "No se pudo registrar el movimiento");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      title="Registrar movimiento de inventario"
      open={abierto}
      onCancel={onCerrar}
      onOk={guardar}
      confirmLoading={guardando}
      okText="Registrar"
      cancelText="Cancelar"
      width={520}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="tipoMovimiento"
          label="Tipo de movimiento"
          rules={[{ required: true, message: "Elige el tipo" }]}
        >
          <Select
            placeholder="Selecciona"
            options={LISTA_TIPOS.map((t) => ({ value: t, label: etiquetaTipo(t) }))}
          />
        </Form.Item>

        <Form.Item
          name="productoId"
          label="Producto"
          rules={[{ required: true, message: "Elige el producto" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Buscar producto"
            onChange={alCambiarProducto}
            options={productos.map((p) => ({
              value: p.productoId,
              label: p.codigo + " · " + p.nombre,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="loteId"
          label="Lote"
          rules={[{ required: true, message: "Elige el lote" }]}
          extra="Los movimientos siempre se registran contra un lote específico"
        >
          <Select
            placeholder={lotes.length ? "Selecciona el lote" : "Primero elige un producto"}
            disabled={lotes.length === 0}
            options={lotes.map((l) => ({
              value: l.loteId,
              label: l.numeroLote + " · vence " + String(l.fechaVencimiento).slice(0, 10),
            }))}
          />
        </Form.Item>

        <Form.Item
          name="sucursalId"
          label="Sucursal"
          rules={[{ required: true, message: "Selecciona una sucursal" }]}
        >
          <Select
            placeholder="Selecciona"
            options={cat.listaSucursales}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          name="cantidad"
          label="Cantidad"
          rules={[{ required: true, message: "Indica la cantidad" }]}
        >
          <InputNumber min={0.001} step={1} style={{ width: "100%" }} placeholder="0" />
        </Form.Item>

        <Form.Item name="documentoRef" label="Documento de referencia">
          <Input placeholder="Ej. OC-001, factura, traslado" maxLength={50} />
        </Form.Item>

        <Form.Item name="observaciones" label="Observaciones">
          <Input.TextArea rows={2} maxLength={300} placeholder="Opcional" />
        </Form.Item>
      </Form>
    </Modal>
  );
}