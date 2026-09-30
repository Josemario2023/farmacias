import { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, Switch, message } from "antd";
import {
  crearCategoria, crearProducto, crearLote,
  obtenerCategorias, obtenerProductos,
} from "../../api/inventory.api";
import type { Categoria, Producto } from "../../api/inventory.api";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onListo: () => void;
}

// CATEGORIA

export function CategoriaModal({ abierto, onCerrar, onListo }: ModalProps) {
  const [form] = Form.useForm();
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { if (abierto) form.resetFields(); }, [abierto]);

  const guardar = async () => {
    try {
      const { nombre } = await form.validateFields();
      setGuardando(true);
      await crearCategoria(nombre);
      message.success("Categoría creada");
      onListo();
      onCerrar();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "No se pudo crear la categoría");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title="Nueva categoría" open={abierto} onCancel={onCerrar} onOk={guardar}
           confirmLoading={guardando} okText="Crear" cancelText="Cancelar" width={420}>
      <Form form={form} layout="vertical">
        <Form.Item name="nombre" label="Nombre"
                   rules={[{ required: true, message: "Escribe el nombre" }]}>
          <Input placeholder="Ej. Analgésicos" maxLength={100} />
        </Form.Item>
      </Form>
    </Modal>
  );
}


// PRODUCTO

export function ProductoModal({ abierto, onCerrar, onListo }: ModalProps) {
  const [form] = Form.useForm();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (abierto) {
      form.resetFields();
      obtenerCategorias().then(setCategorias).catch(() => {});
    }
  }, [abierto]);

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setGuardando(true);
      await crearProducto({
        codigo: v.codigo,
        nombre: v.nombre,
        categoriaId: v.categoriaId,
        precioBase: v.precioBase,
        requiereReceta: v.requiereReceta ? 1 : 0,
      });
      message.success("Producto creado. Ahora crea su lote para poder darle stock.");
      onListo();
      onCerrar();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "No se pudo crear el producto");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title="Nuevo producto" open={abierto} onCancel={onCerrar} onOk={guardar}
           confirmLoading={guardando} okText="Crear" cancelText="Cancelar" width={480}>
      <Form form={form} layout="vertical" initialValues={{ requiereReceta: false }}>
        <Form.Item name="codigo" label="Código"
                   rules={[{ required: true, message: "Escribe el código" }]}>
          <Input placeholder="Ej. MED-004" maxLength={30} />
        </Form.Item>

        <Form.Item name="nombre" label="Nombre"
                   rules={[{ required: true, message: "Escribe el nombre" }]}>
          <Input placeholder="Ej. Loratadina 10mg" maxLength={150} />
        </Form.Item>

        <Form.Item name="categoriaId" label="Categoría"
                   rules={[{ required: true, message: "Elige la categoría" }]}>
          <Select placeholder="Selecciona"
                  options={categorias.map((c) => ({ value: c.categoriaId, label: c.nombre }))} />
        </Form.Item>

        <Form.Item name="precioBase" label="Precio de venta"
                   rules={[{ required: true, message: "Indica el precio" }]}>
          <InputNumber min={0} step={0.01} precision={2} style={{ width: "100%" }}
                       prefix="Q" placeholder="0.00" />
        </Form.Item>

        <Form.Item name="requiereReceta" label="Requiere receta médica" valuePropName="checked"
                   extra="El POS advertirá al cajero antes de venderlo">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ============================================================
// LOTE
// ============================================================
export function LoteModal({ abierto, onCerrar, onListo }: ModalProps) {
  const [form] = Form.useForm();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (abierto) {
      form.resetFields();
      obtenerProductos().then(setProductos).catch(() => {});
    }
  }, [abierto]);

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setGuardando(true);
      await crearLote({
        productoId: v.productoId,
        numeroLote: v.numeroLote,
        fechaVencimiento: v.fechaVencimiento.format("YYYY-MM-DD"),
      });
      message.success("Lote creado. Ya puedes registrar entrada de stock.");
      onListo();
      onCerrar();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "No se pudo crear el lote");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title="Nuevo lote" open={abierto} onCancel={onCerrar} onOk={guardar}
           confirmLoading={guardando} okText="Crear" cancelText="Cancelar" width={480}>
      <Form form={form} layout="vertical">
        <Form.Item name="productoId" label="Producto"
                   rules={[{ required: true, message: "Elige el producto" }]}>
          <Select showSearch optionFilterProp="label" placeholder="Buscar producto"
                  options={productos.map((p) => ({
                    value: p.productoId, label: p.codigo + " · " + p.nombre,
                  }))} />
        </Form.Item>

        <Form.Item name="numeroLote" label="Número de lote"
                   rules={[{ required: true, message: "Escribe el número de lote" }]}>
          <Input placeholder="Ej. ACE-2027-B" maxLength={50} />
        </Form.Item>

        <Form.Item name="fechaVencimiento" label="Fecha de vencimiento"
                   rules={[{ required: true, message: "Indica el vencimiento" }]}>
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} placeholder="Selecciona la fecha" />
        </Form.Item>
      </Form>
    </Modal>
  );
}