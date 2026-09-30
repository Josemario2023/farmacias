import { NavLink } from "react-router-dom";
import logo from "../../assets/logo.png";
import {
  IconPanel, IconPos, IconFactura, IconCaja, IconInventario,
  IconTraslado, IconEntrega, IconAuditoria, IconActivos,
  IconPlanilla, IconUsuarios,
} from "./icons";

// Los modulos agrupados como en el prototipo
const GRUPOS = [
  {
    titulo: "Operación",
    items: [
      { ruta: "/panel",        label: "Panel",             icono: <IconPanel /> },
      { ruta: "/pos",          label: "Punto de venta",    icono: <IconPos /> },
      { ruta: "/facturacion",  label: "Facturación",       icono: <IconFactura /> },
      { ruta: "/caja",         label: "Caja y corte",      icono: <IconCaja /> },
    ],
  },
  {
    titulo: "Inventario",
    items: [
      { ruta: "/inventario",   label: "Existencias",       icono: <IconInventario /> },
      { ruta: "/kardex",       label: "Kardex",            icono: <IconInventario /> },
      { ruta: "/traslados",    label: "Traslados",         icono: <IconTraslado /> },
      { ruta: "/entregas",     label: "Entregas",          icono: <IconEntrega /> },
    ],
  },
  {
    titulo: "Administración",
    items: [
      { ruta: "/auditoria",    label: "Auditoría central", icono: <IconAuditoria /> },
      { ruta: "/activos",      label: "Activos fijos",     icono: <IconActivos /> },
      { ruta: "/planilla",     label: "Planilla",          icono: <IconPlanilla /> },
      { ruta: "/usuarios",     label: "Usuarios y regiones", icono: <IconUsuarios /> },
    ],
  },
];

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export function Sidebar({ abierto, onCerrar }: Props) {
  return (
    <aside className={"sidebar" + (abierto ? " open" : "")}>
      <div className="sb-brand">
        <img src={logo} alt="Logo" />
        <div>
          <b>FarmaRed</b>
          <small>Operación central</small>
        </div>
      </div>

      <nav className="sb-nav">
        {GRUPOS.map((grupo) => (
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

      <div className="sb-foot">v1.0 conectado</div>
    </aside>
  );
}