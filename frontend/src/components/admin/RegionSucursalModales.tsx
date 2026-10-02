import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Switch, message } from "antd";
import {
  crearRegion, actualizarRegion, crearSucursal, actualizarSucursal, obtenerRegiones,
} from "../../api/users.api";
import type { Region, Sucursal } from "../../api/users.api";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onListo: () => void;
}


// Para crear y editar REGION 

export function RegionModal({ abierto, onCerrar, onListo, editar }: Props & { editar?: Region | null }) {
  const [form] = Form.useForm();
  const [guardando, setGuardando] = useState(false);
  const esEdicion = !!editar;

  useEffect(() => {
    if (abierto) {
      form.resetFields();
      if (editar) form.setFieldsValue({ ...editar, activo: editar.activo === 1 });
    }
  }, [abierto, editar]);

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setGuardando(true);
      const dto = { ...v, activo: v.activo === false ? 0 : 1 };
      if (esEdicion) await actualizarRegion(editar!.regionId, dto);
      else await crearRegion(dto);
      message.success(esEdicion ? "Región actualizada" : "Región creada");
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
    <Modal title={esEdicion ? "Editar región" : "Nueva región"} open={abierto}
           onCancel={onCerrar} onOk={guardar} confirmLoading={guardando}
           okText="Guardar" cancelText="Cancelar" width={440}>
      <Form form={form} layout="vertical">
        <Form.Item name="codigo" label="Código"
                   rules={[{ required: true, message: "Escribe el código" }]}>
          <Input placeholder="Ej. CENTRO" maxLength={20} />
        </Form.Item>
        <Form.Item name="nombre" label="Nombre"
                   rules={[{ required: true, message: "Escribe el nombre" }]}>
          <Input placeholder="Ej. Región Central" maxLength={100} />
        </Form.Item>
        {esEdicion && (
          <Form.Item name="activo" label="Activa" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}


// SUCURSAL

export function SucursalModal({ abierto, onCerrar, onListo, editar }: Props & { editar?: Sucursal | null }) {
  const [form] = Form.useForm();
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [guardando, setGuardando] = useState(false);
  const esEdicion = !!editar;

  useEffect(() => {
    if (abierto) {
      form.resetFields();
      obtenerRegiones().then(setRegiones).catch(() => {});
      if (editar) form.setFieldsValue({ ...editar, activo: editar.activo === 1 });
    }
  }, [abierto, editar]);

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setGuardando(true);
      const dto = { ...v, activo: v.activo === false ? 0 : 1 };
      if (esEdicion) await actualizarSucursal(editar!.sucursalId, dto);
      else await crearSucursal(dto);
      message.success(esEdicion ? "Sucursal actualizada" : "Sucursal creada");
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
    <Modal title={esEdicion ? "Editar sucursal" : "Nueva sucursal"} open={abierto}
           onCancel={onCerrar} onOk={guardar} confirmLoading={guardando}
           okText="Guardar" cancelText="Cancelar" width={480}>
      <Form form={form} layout="vertical" initialValues={{ tipo: "SUCURSAL" }}>
        <Form.Item name="regionId" label="Región"
                   rules={[{ required: true, message: "Elige la región" }]}>
          <Select placeholder="Selecciona"
            options={regiones.filter((r) => r.activo === 1)
              .map((r) => ({ value: r.regionId, label: r.nombre }))} />
        </Form.Item>
        <Form.Item name="codigo" label="Código"
                   rules={[{ required: true, message: "Escribe el código" }]}>
          <Input placeholder="Ej. SUC-003" maxLength={20} />
        </Form.Item>
        <Form.Item name="nombre" label="Nombre"
                   rules={[{ required: true, message: "Escribe el nombre" }]}>
          <Input placeholder="Ej. Farmacia Zona 10" maxLength={100} />
        </Form.Item>
        <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}
                   extra="Un STAND es un punto de venta pequeño sin bodega propia">
          <Select options={[
            { value: "SUCURSAL", label: "Sucursal" },
            { value: "STAND", label: "Stand" },
          ]} />
        </Form.Item>
        <Form.Item name="direccion" label="Dirección">
          <Input.TextArea rows={2} maxLength={200} placeholder="Opcional" />
        </Form.Item>
        {esEdicion && (
          <Form.Item name="activo" label="Activa" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}