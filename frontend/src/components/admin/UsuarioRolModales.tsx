import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Switch, Transfer, Spin, message } from "antd";
import {
  crearUsuario, actualizarUsuario, crearRol, actualizarRol, crearPermiso,
  obtenerRoles, obtenerPermisos, obtenerSucursales,
  rolesDeUsuario, asignarRol, quitarRol,
  sucursalesDeUsuario, asignarSucursal, quitarSucursal,
  permisosDeRol, asignarPermiso, quitarPermiso,
} from "../../api/users.api";
import type { Usuario, Rol, Permiso, Sucursal } from "../../api/users.api";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onListo: () => void;
}


// USUARIO (crear / editar)

export function UsuarioModal({ abierto, onCerrar, onListo, editar }: Props & { editar?: Usuario | null }) {
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
      if (esEdicion) {
        // Al editar, la contrasena solo se manda si el usuario escribio una nueva
        const dto: any = { nombre: v.nombre, activo: v.activo === false ? 0 : 1 };
        if (v.password) dto.password = v.password;
        await actualizarUsuario(editar!.usuarioId, dto);
      } else {
        await crearUsuario({ username: v.username, password: v.password, nombre: v.nombre });
      }
      message.success(esEdicion ? "Usuario actualizado" : "Usuario creado");
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
    <Modal title={esEdicion ? "Editar usuario" : "Nuevo usuario"} open={abierto}
           onCancel={onCerrar} onOk={guardar} confirmLoading={guardando}
           okText="Guardar" cancelText="Cancelar" width={460}>
      <Form form={form} layout="vertical">
        <Form.Item name="username" label="Usuario"
                   rules={[{ required: !esEdicion, message: "Escribe el nombre de usuario" }]}>
          <Input placeholder="Ej. cajero3" maxLength={50} disabled={esEdicion} />
        </Form.Item>

        <Form.Item name="nombre" label="Nombre completo"
                   rules={[{ required: true, message: "Escribe el nombre" }]}>
          <Input placeholder="Ej. Ana Morales" maxLength={150} />
        </Form.Item>

        <Form.Item name="password"
                   label={esEdicion ? "Nueva contraseña (opcional)" : "Contraseña"}
                   rules={esEdicion ? [] : [
                     { required: true, message: "Escribe la contraseña" },
                     { min: 8, message: "Mínimo 8 caracteres" },
                   ]}
                   extra={esEdicion ? "Déjala vacía para no cambiarla" : "Mínimo 8 caracteres"}>
          <Input.Password placeholder="••••••••" />
        </Form.Item>

        {esEdicion && (
          <Form.Item name="activo" label="Activo" valuePropName="checked"
                     extra="Un usuario inactivo no puede iniciar sesión">
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}


// ASIGNAR ROLES Y SUCURSALES a un usuario

export function AsignarModal({ abierto, onCerrar, onListo, usuario }: Props & { usuario: Usuario | null }) {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [misRoles, setMisRoles] = useState<number[]>([]);
  const [misSucursales, setMisSucursales] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    if (!usuario) return;
    setCargando(true);
    try {
      const [rs, ss, mr, ms] = await Promise.all([
        obtenerRoles(),
        obtenerSucursales(),
        rolesDeUsuario(usuario.usuarioId),
        sucursalesDeUsuario(usuario.usuarioId).catch(() => []),
      ]);
      setRoles(rs);
      setSucursales(ss);
      setMisRoles(mr.map((r) => r.rolId));
      setMisSucursales((ms as Sucursal[]).map((s) => s.sucursalId));
    } catch {
      message.error("No se pudieron cargar las asignaciones");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { if (abierto) cargar(); }, [abierto, usuario]);

  // Cada cambio se guarda al instante (sin boton "Guardar")
  const cambiarRoles = async (nuevos: any[]) => {
    if (!usuario) return;
    const ids = nuevos.map(Number);
    const agregar = ids.filter((i) => !misRoles.includes(i));
    const quitar = misRoles.filter((i) => !ids.includes(i));
    try {
      for (const id of agregar) await asignarRol(usuario.usuarioId, id);
      for (const id of quitar) await quitarRol(usuario.usuarioId, id);
      setMisRoles(ids);
      message.success("Roles actualizados");
      onListo();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudieron actualizar los roles");
      cargar();
    }
  };

  const cambiarSucursales = async (nuevas: any[]) => {
    if (!usuario) return;
    const ids = nuevas.map(Number);
    const agregar = ids.filter((i) => !misSucursales.includes(i));
    const quitar = misSucursales.filter((i) => !ids.includes(i));
    try {
      for (const id of agregar) await asignarSucursal(usuario.usuarioId, id);
      for (const id of quitar) await quitarSucursal(usuario.usuarioId, id);
      setMisSucursales(ids);
      message.success("Sucursales actualizadas");
      onListo();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudieron actualizar las sucursales");
      cargar();
    }
  };

  return (
    <Modal title={"Asignaciones de " + (usuario?.nombre ?? "")} open={abierto}
           onCancel={onCerrar} onOk={onCerrar} okText="Listo" cancelButtonProps={{ style: { display: "none" } }}
           width={560}>
      {cargando ? (
        <div style={{ padding: 40, textAlign: "center" }}><Spin /></div>
      ) : (
        <>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Roles</label>
            <Select mode="multiple" style={{ width: "100%" }} value={misRoles}
              onChange={cambiarRoles} placeholder="Sin roles asignados"
              options={roles.map((r) => ({ value: r.rolId, label: r.nombre + " (" + r.codigo + ")" }))} />
            <small style={{ color: "var(--muted)" }}>
              Los permisos del usuario son la suma de los de todos sus roles.
            </small>
          </div>

          <div>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Sucursales</label>
            <Select mode="multiple" style={{ width: "100%" }} value={misSucursales}
              onChange={cambiarSucursales} placeholder="Sin sucursales asignadas"
              options={sucursales.filter((s) => s.activo === 1)
                .map((s) => ({ value: s.sucursalId, label: s.nombre }))} />
            <small style={{ color: "var(--muted)" }}>
              La primera sucursal se usa como la principal del usuario.
            </small>
          </div>
        </>
      )}
    </Modal>
  );
}


// ROL (crear / editar)

export function RolModal({ abierto, onCerrar, onListo, editar }: Props & { editar?: Rol | null }) {
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
      const v = await form.validateFields();
      setGuardando(true);
      if (esEdicion) await actualizarRol(editar!.rolId, v);
      else await crearRol(v);
      message.success(esEdicion ? "Rol actualizado" : "Rol creado");
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
    <Modal title={esEdicion ? "Editar rol" : "Nuevo rol"} open={abierto}
           onCancel={onCerrar} onOk={guardar} confirmLoading={guardando}
           okText="Guardar" cancelText="Cancelar" width={440}>
      <Form form={form} layout="vertical">
        <Form.Item name="codigo" label="Código"
                   rules={[{ required: true, message: "Escribe el código" }]}
                   extra="En mayúsculas, sin espacios. Ej. BODEGUERO">
          <Input placeholder="Ej. BODEGUERO" maxLength={30} />
        </Form.Item>
        <Form.Item name="nombre" label="Nombre"
                   rules={[{ required: true, message: "Escribe el nombre" }]}>
          <Input placeholder="Ej. Encargado de bodega" maxLength={80} />
        </Form.Item>
      </Form>
    </Modal>
  );
}


// PERMISOS DE UN ROL (con Transfer: disponibles / asignados)

export function PermisosRolModal({ abierto, onCerrar, onListo, rol }: Props & { rol: Rol | null }) {
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [asignados, setAsignados] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    if (!rol) return;
    setCargando(true);
    try {
      const [todos, mios] = await Promise.all([
        obtenerPermisos(),
        permisosDeRol(rol.rolId),
      ]);
      setPermisos(todos);
      setAsignados(mios.map((p) => String(p.permisoId)));
    } catch {
      message.error("No se pudieron cargar los permisos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { if (abierto) cargar(); }, [abierto, rol]);

  const cambiar = async (nuevos: any[]) => {
    if (!rol) return;
    const ids = nuevos.map(Number);
    const actuales = asignados.map(Number);
    const agregar = ids.filter((i) => !actuales.includes(i));
    const quitar = actuales.filter((i) => !ids.includes(i));
    try {
      for (const id of agregar) await asignarPermiso(rol.rolId, id);
      for (const id of quitar) await quitarPermiso(rol.rolId, id);
      setAsignados(nuevos.map(String));
      message.success("Permisos actualizados");
      onListo();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudieron actualizar");
      cargar();
    }
  };

  return (
    <Modal title={"Permisos de " + (rol?.nombre ?? "")} open={abierto}
           onCancel={onCerrar} onOk={onCerrar} okText="Listo"
           cancelButtonProps={{ style: { display: "none" } }} width={720}>
      {cargando ? (
        <div style={{ padding: 40, textAlign: "center" }}><Spin /></div>
      ) : (
        <Transfer
          dataSource={permisos.map((p) => ({
            key: String(p.permisoId),
            title: p.codigo,
            description: p.descripcion,
          }))}
          targetKeys={asignados}
          onChange={cambiar}
          render={(item) => (
            <span>
              <b>{item.title}</b>
              <br />
              <small style={{ color: "var(--muted)" }}>{item.description}</small>
            </span>
          )}
          titles={["Disponibles", "Asignados"]}
          listStyle={{ width: 310, height: 380 }}
          showSearch
        />
      )}
    </Modal>
  );
}


// PERMISO (crear uno nuevo)

export function PermisoModal({ abierto, onCerrar, onListo }: Props) {
  const [form] = Form.useForm();
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { if (abierto) form.resetFields(); }, [abierto]);

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setGuardando(true);
      await crearPermiso(v);
      message.success("Permiso creado");
      onListo();
      onCerrar();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message ?? "No se pudo crear");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title="Nuevo permiso" open={abierto} onCancel={onCerrar} onOk={guardar}
           confirmLoading={guardando} okText="Crear" cancelText="Cancelar" width={460}>
      <Form form={form} layout="vertical">
        <Form.Item name="codigo" label="Código"
                   rules={[{ required: true, message: "Escribe el código" }]}
                   extra="Formato MODULO_ACCION. Ej. TRASLADO_RECIBIR">
          <Input placeholder="Ej. TRASLADO_RECIBIR" maxLength={50} />
        </Form.Item>
        <Form.Item name="descripcion" label="Descripción"
                   rules={[{ required: true, message: "Describe el permiso" }]}>
          <Input placeholder="Ej. Recibir traslados en la sucursal destino" maxLength={200} />
        </Form.Item>
      </Form>
    </Modal>
  );
}