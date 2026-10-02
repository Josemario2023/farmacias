import { NavLink } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useSesion } from "../../hoocks/useSesion";
import {
  IconPanel, IconPos, IconFactura, IconCaja, IconInventario,
  IconTraslado, IconEntrega, IconAuditoria, IconActivos,
  IconPlanilla, IconUsuarios,
} from "./icons";

// Cada módulo declara qué permiso necesita. Sin "permiso" = visible para todos.
const GRUPOS = [
  {
    titulo: "Operación",
    items: [
      { ruta: "/panel",       label: "Panel",          icono: <IconPanel />,   permiso: "PANEL_VER" },
      { ruta: "/pos",         label: "Punto de venta", icono: <IconPos />,     permiso: "VENTA_CREAR" },
      { ruta: "/facturacion", label: "Facturación",    icono: <IconFactura />, permiso: "FACTURA_VER" },
      { ruta: "/caja",        label: "Caja y corte",   icono: <IconCaja />,    permiso: "CAJA_VER" },
    ],
  },
  {
    titulo: "Inventario",
    items: [
      { ruta: "/inventario", label: "Existencias", icono: <IconInventario />, permiso: "INVENTARIO_VER" },
      { ruta: "/kardex",     label: "Kardex",      icono: <IconInventario />, permiso: "INVENTARIO_VER" },
      { ruta: "/traslados",  label: "Traslados",   icono: <IconTraslado />,   permiso: "TRASLADO_VER" },
      { ruta: "/entregas",   label: "Entregas",    icono: <IconEntrega />,    permiso: "ENTREGA_VER" },
    ],
  },
  {
    titulo: "Administración",
    items: [
      { ruta: "/auditoria", label: "Auditoría central",   icono: <IconAuditoria />, permiso: "AUDITORIA_VER" },
      { ruta: "/activos",   label: "Activos fijos",       icono: <IconActivos />,   permiso: "ACTIVOS_GESTIONAR" },
      { ruta: "/planilla",  label: "Planilla",            icono: <IconPlanilla />,  permiso: "PLANILLA_GESTIONAR" },
      { ruta: "/usuarios",  label: "Usuarios y regiones", icono: <IconUsuarios />,  permiso: "USUARIOS_GESTIONAR" },
    ],
  },
];

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export function Sidebar({ abierto, onCerrar }: Props) {
  const { puede, usuario } = useSesion();

  // Filtrar: solo los módulos que el usuario puede usar
  const gruposVisibles = GRUPOS
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.permiso || puede(i.permiso)),
    }))
    .filter((g) => g.items.length > 0);   // ocultar grupos que quedan vacíos

  return (
    <aside className={"sidebar" + (abierto ? " open" : "")}>
      <div className="sb-brand">
        <img src={logo} alt="Logo" />
        <div>
          <b>FarmaRed</b>
          <small>{usuario?.sucursalNombre ?? "Operación central"}</small>
        </div>
      </div>

      <nav className="sb-nav">
        {gruposVisibles.map((grupo) => (
          <div key={grupo.titulo}>
            <div className="sb-group">{grupo.titulo}</div>
            {grupo.items.map((item) => (
              <NavLink
                key={item.ruta}
                to={item.ruta}
                onClick={onCerrar}
                className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
              >
                {item.icono}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sb-foot">
        {usuario?.roles.join(" · ")} · v1.0
      </div>
    </aside>
  );
}