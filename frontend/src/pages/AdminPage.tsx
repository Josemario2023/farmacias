import { useEffect, useState } from "react";
import { Tabs, Table, Button, Tag, Spin, message, Popconfirm, Space } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyOutlined, TeamOutlined } from "@ant-design/icons";
import {
  obtenerRegiones, obtenerSucursales, obtenerUsuarios, obtenerRoles, obtenerPermisos,
  eliminarRegion, eliminarSucursal, eliminarUsuario, eliminarRol,
  rolesDeUsuario,
} from "../api/users.api";
import type { Region, Sucursal, Usuario, Rol, Permiso } from "../api/users.api";
import { RegionModal, SucursalModal } from "../components/admin/RegionSucursalModales";
import {
  UsuarioModal, AsignarModal, RolModal, PermisosRolModal, PermisoModal,
} from "../components/admin/UsuarioRolModales";
import { useSesion } from "../hoocks/useSesion";
import { useCatalogos } from "../hoocks/useCatalogos";
import "../styles/components.css";

export function AdminPage() {
  const { puede } = useSesion();
  const cat = useCatalogos();
  const [cargando, setCargando] = useState(true);

  const [regiones, setRegiones] = useState<Region[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [rolesPorUsuario, setRolesPorUsuario] = useState<Record<number, string[]>>({});

  // Qué modal está abierto y con qué registro
  const [modal, setModal] = useState<string | null>(null);
  const [registro, setRegistro] = useState<any>(null);

  const abrir = (cual: string, reg: any = null) => { setRegistro(reg); setModal(cual); };
  const cerrar = () => { setModal(null); setRegistro(null); };

  const cargar = async () => {
    setCargando(true);
    const [rg, sc, us, rl, pm] = await Promise.allSettled([
      obtenerRegiones(), obtenerSucursales(), obtenerUsuarios(),
      obtenerRoles(), obtenerPermisos(),
    ]);
    if (rg.status === "fulfilled") setRegiones(rg.value);
    if (sc.status === "fulfilled") setSucursales(sc.value);
    if (rl.status === "fulfilled") setRoles(rl.value);
    if (pm.status === "fulfilled") setPermisos(pm.value);

    if (us.status === "fulfilled") {
      setUsuarios(us.value);
      // Traer los roles de cada usuario para mostrarlos en la tabla
      const mapa: Record<number, string[]> = {};
      await Promise.all(us.value.map(async (u) => {
        try {
          const rs = await rolesDeUsuario(u.usuarioId);
          mapa[u.usuarioId] = rs.map((r) => r.codigo);
        } catch { mapa[u.usuarioId] = []; }
      }));
      setRolesPorUsuario(mapa);
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const borrar = async (fn: (id: number) => Promise<any>, id: number, que: string) => {
    try {
      await fn(id);
      message.success(que + " eliminado");
      cargar();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudo eliminar");
    }
  };

  if (cargando) {
    return <div style={{ padding: 80, textAlign: "center" }}><Spin size="large" /></div>;
  }

  // Sin permiso, no se ve la pantalla
  if (!puede("USUARIOS_GESTIONAR") && !puede("SUCURSALES_GESTIONAR")) {
    return (
      <div className="empty" style={{ padding: 80 }}>
        <b>Acceso restringido</b>
        No tienes permisos para administrar usuarios ni sucursales.
      </div>
    );
  }

  //  USUARIOS 
  const tabUsuarios = (
    <div className="card">
      <div className="card-h">
        <h3>Usuarios del sistema</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => abrir("usuario")}>
          Nuevo usuario
        </Button>
      </div>
      <Table rowKey="usuarioId" dataSource={usuarios} pagination={{ pageSize: 10 }} size="middle"
        columns={[
          { title: "Usuario", dataIndex: "username", width: 140 },
          { title: "Nombre", dataIndex: "nombre" },
          { title: "Roles", width: 230,
            render: (_, u: Usuario) => {
              const rs = rolesPorUsuario[u.usuarioId] ?? [];
              return rs.length === 0
                ? <Tag>Sin rol</Tag>
                : rs.map((r) => (
                    <Tag key={r} color={r === "SUPERADMIN" ? "red" : "blue"}>{r}</Tag>
                  ));
            } },
          { title: "Estado", dataIndex: "activo", width: 100,
            render: (v) => v === 1
              ? <Tag color="green">Activo</Tag>
              : <Tag color="default">Inactivo</Tag> },
          { title: "Acciones", width: 230,
            render: (_, u: Usuario) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => abrir("usuario", u)}>
                  Editar
                </Button>
                <Button size="small" icon={<TeamOutlined />} onClick={() => abrir("asignar", u)}>
                  Asignar
                </Button>
                <Popconfirm title="¿Desactivar este usuario?"
                  onConfirm={() => borrar(eliminarUsuario, u.usuarioId, "Usuario")}
                  okText="Sí" cancelText="No">
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ) },
        ]} />
    </div>
  );

  //  ROLES Y PERMISOS 
  const tabRoles = (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
      <div className="card">
        <div className="card-h">
          <h3>Roles</h3>
          <Button size="small" icon={<PlusOutlined />} onClick={() => abrir("rol")}>
            Nuevo rol
          </Button>
        </div>
        <Table rowKey="rolId" dataSource={roles} pagination={false} size="small"
          columns={[
            { title: "Código", dataIndex: "codigo", width: 150,
              render: (v) => <Tag color={v === "SUPERADMIN" ? "red" : "blue"}>{v}</Tag> },
            { title: "Nombre", dataIndex: "nombre" },
            { title: "Acciones", width: 200,
              render: (_, r: Rol) => (
                <Space>
                  <Button size="small" icon={<SafetyOutlined />} onClick={() => abrir("permisosRol", r)}>
                    Permisos
                  </Button>
                  <Button size="small" icon={<EditOutlined />} onClick={() => abrir("rol", r)} />
                  <Popconfirm title="¿Eliminar este rol?"
                    onConfirm={() => borrar(eliminarRol, r.rolId, "Rol")}
                    okText="Sí" cancelText="No">
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ) },
          ]} />
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Permisos disponibles</h3>
          <Button size="small" icon={<PlusOutlined />} onClick={() => abrir("permiso")}>
            Nuevo
          </Button>
        </div>
        <Table rowKey="permisoId" dataSource={permisos} pagination={{ pageSize: 10 }} size="small"
          columns={[
            { title: "Código", dataIndex: "codigo", width: 190 },
            { title: "Descripción", dataIndex: "descripcion" },
          ]} />
      </div>
    </div>
  );

  //  REGIONES Y SUCURSALES 
  const tabUbicaciones = (
    <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 16 }}>
      <div className="card">
        <div className="card-h">
          <h3>Regiones</h3>
          <Button size="small" icon={<PlusOutlined />} onClick={() => abrir("region")}>
            Nueva
          </Button>
        </div>
        <Table rowKey="regionId" dataSource={regiones} pagination={false} size="small"
          columns={[
            { title: "Código", dataIndex: "codigo", width: 100 },
            { title: "Nombre", dataIndex: "nombre" },
            { title: "Estado", dataIndex: "activo", width: 90,
              render: (v) => v === 1 ? <Tag color="green">Activa</Tag> : <Tag>Inactiva</Tag> },
            { title: "", width: 90,
              render: (_, r: Region) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => abrir("region", r)} />
                  <Popconfirm title="¿Desactivar esta región?"
                    onConfirm={() => borrar(eliminarRegion, r.regionId, "Región")}
                    okText="Sí" cancelText="No">
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ) },
          ]} />
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Sucursales</h3>
          <Button size="small" icon={<PlusOutlined />} onClick={() => abrir("sucursal")}>
            Nueva sucursal
          </Button>
        </div>
        <Table rowKey="sucursalId" dataSource={sucursales} pagination={{ pageSize: 8 }} size="small"
          columns={[
            { title: "Código", dataIndex: "codigo", width: 100 },
            { title: "Nombre", dataIndex: "nombre" },
            { title: "Región", dataIndex: "regionId", width: 140,
              render: (v) => cat.region(v) },
            { title: "Tipo", dataIndex: "tipo", width: 100,
              render: (v) => <Tag color={v === "STAND" ? "orange" : "blue"}>{v}</Tag> },
            { title: "Estado", dataIndex: "activo", width: 90,
              render: (v) => v === 1 ? <Tag color="green">Activa</Tag> : <Tag>Inactiva</Tag> },
            { title: "", width: 90,
              render: (_, s: Sucursal) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => abrir("sucursal", s)} />
                  <Popconfirm title="¿Desactivar esta sucursal?"
                    onConfirm={() => borrar(eliminarSucursal, s.sucursalId, "Sucursal")}
                    okText="Sí" cancelText="No">
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ) },
          ]} />
      </div>
    </div>
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Administración</h2>
          <p>Usuarios, roles y permisos · regiones y sucursales de la cadena.</p>
        </div>
      </div>

      <Tabs defaultActiveKey="usuarios" items={[
        { key: "usuarios", label: "Usuarios (" + usuarios.length + ")", children: tabUsuarios },
        { key: "roles", label: "Roles y permisos", children: tabRoles },
        { key: "ubicaciones", label: "Regiones y sucursales", children: tabUbicaciones },
      ]} />

      {/* Modales */}
      <RegionModal abierto={modal === "region"} onCerrar={cerrar} onListo={cargar} editar={registro} />
      <SucursalModal abierto={modal === "sucursal"} onCerrar={cerrar} onListo={cargar} editar={registro} />
      <UsuarioModal abierto={modal === "usuario"} onCerrar={cerrar} onListo={cargar} editar={registro} />
      <AsignarModal abierto={modal === "asignar"} onCerrar={cerrar} onListo={cargar} usuario={registro} />
      <RolModal abierto={modal === "rol"} onCerrar={cerrar} onListo={cargar} editar={registro} />
      <PermisosRolModal abierto={modal === "permisosRol"} onCerrar={cerrar} onListo={cargar} rol={registro} />
      <PermisoModal abierto={modal === "permiso"} onCerrar={cerrar} onListo={cargar} />
    </>
  );
}