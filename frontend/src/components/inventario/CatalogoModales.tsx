import { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, Switch, message } from "antd";
import dayjs from "dayjs";
import {
  crearCategoria, crearProducto, actualizarProducto, crearLote,
  obtenerCategorias,actualizarCategoria,actualizarLote, obtenerProductos,
} from "../../api/inventory.api";
import type { Categoria, Producto } from "../../api/inventory.api";
import { conIva } from "../../utils/iva";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onListo: () => void;
}

// CATEGORIA

export function CategoriaModal({ abierto, onCerrar, onListo, editar }: ModalProps & { editar?: any }) {
  const [form] = Form.useForm();
  const [guardando, setGuardando] = useState(false);
  const esEdicion = !!editar;

  useEffect(() => {
    if (abierto) {
      form.resetFields();
      if (editar) form.setFieldsValue(editar);
    }
  }, [abierto, editar]);

  const guardar = async () => {
    try {
      const { nombre } = await form.validateFields();
      setGuardando(true);
      if (esEdicion) await actualizarCategoria(editar.categoriaId, nombre);
      else await crearCategoria(nombre);
      message.success(esEdicion ? "Categoría actualizada" : "Categoría creada");
      onListo();
      onCerrar();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title={esEdicion ? "Editar categoría" : "Nueva categoría"} open={abierto}
           onCancel={onCerrar} onOk={guardar} confirmLoading={guardando}
           okText="Guardar" cancelText="Cancelar" width={420}>
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

export function ProductoModal({ abierto, onCerrar, onListo, editar }: ModalProps & { editar?: any }) {
  const [form] = Form.useForm();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [guardando, setGuardando] = useState(false);
  const esEdicion = !!editar;

  useEffect(() => {
    if (abierto) {
      form.resetFields();
      obtenerCategorias().then(setCategorias).catch(() => {});
      if (editar) {
        form.setFieldsValue({
          ...editar,
          requiereReceta: editar.requiereReceta === 1,
          activo: editar.activo === 1,
        });
      }
    }
  }, [abierto, editar]);

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setGuardando(true);
      const dto = {
        codigo: v.codigo,
        nombre: v.nombre,
        categoriaId: v.categoriaId,
        precioBase: v.precioBase,
        requiereReceta: v.requiereReceta ? 1 : 0,
        ...(esEdicion ? { activo: v.activo === false ? 0 : 1 } : {}),
      };
      if (esEdicion) await actualizarProducto(editar.productoId, dto);
      else await crearProducto(dto);
      message.success(esEdicion
        ? "Producto actualizado"
        : "Producto creado. Ahora crea su lote para poder darle stock.");
      onListo();
      onCerrar();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title={esEdicion ? "Editar producto" : "Nuevo producto"} open={abierto}
           onCancel={onCerrar} onOk={guardar} confirmLoading={guardando}
           okText="Guardar" cancelText="Cancelar" width={480}>
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
         <Form.Item name="precioBase" label="Precio base (sin IVA)"
                   rules={[{ required: true, message: "Indica el precio" }]}>
          <InputNumber min={0} step={0.01} precision={2} style={{ width: "100%" }}
                       prefix="Q" placeholder="0.00" />
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(a, b) => a.precioBase !== b.precioBase}>
          {({ getFieldValue }) => (
            <p style={{ marginTop: -8 }}>
              Precio al público con IVA 12%:{" "}
              <b>Q {conIva(Number(getFieldValue("precioBase") ?? 0)).toFixed(2)}</b>
            </p>
          )}
        </Form.Item>
        <Form.Item name="requiereReceta" label="Requiere receta médica" valuePropName="checked"
                   extra="El POS advertirá al cajero antes de venderlo">
          <Switch />
        </Form.Item>
        {esEdicion && (
          <Form.Item name="activo" label="Activo" valuePropName="checked"
                     extra="Un producto inactivo no aparece en el POS">
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}


// LOTE

export function LoteModal({ abierto, onCerrar, onListo, editar }: ModalProps & { editar?: any }) {
  const [form] = Form.useForm();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [guardando, setGuardando] = useState(false);
  const esEdicion = !!editar;

  useEffect(() => {
    if (abierto) {
      form.resetFields();
      obtenerProductos().then(setProductos).catch(() => {});
      if (editar) {
        form.setFieldsValue({
          productoId: editar.productoId,
          numeroLote: editar.numeroLote,
          fechaVencimiento: dayjs(editar.fechaVencimiento),
        });
      }
    }
  }, [abierto, editar]);

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setGuardando(true);
      const dto = {
        productoId: v.productoId,
        numeroLote: v.numeroLote,
        fechaVencimiento: v.fechaVencimiento.format("YYYY-MM-DD"),
      };
      if (esEdicion) await actualizarLote(editar.loteId, dto);
      else await crearLote(dto);
      message.success(esEdicion
        ? "Lote actualizado"
        : "Lote creado. Ya puedes registrar entrada de stock.");
      onListo();
      onCerrar();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title={esEdicion ? "Editar lote" : "Nuevo lote"} open={abierto}
           onCancel={onCerrar} onOk={guardar} confirmLoading={guardando}
           okText="Guardar" cancelText="Cancelar" width={480}>
      <Form form={form} layout="vertical">
        <Form.Item name="productoId" label="Producto"
                   rules={[{ required: true, message: "Elige el producto" }]}>
          <Select showSearch optionFilterProp="label" placeholder="Buscar producto"
                  disabled={esEdicion}
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