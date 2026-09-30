import { useNavigate } from "react-router-dom";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { IconUbicacion, IconSucursal, IconBuscar, IconTema, IconCampana } from "./icons";
import { logout } from "../../api/auth.api";

interface Props {
  onAbrirMenu: () => void;
  usuario?: string;
  rol?: string;
}

export function Topbar({ onAbrirMenu, usuario = "Usuario", rol = "Operador" }: Props) {
  const inicial = usuario.charAt(0).toUpperCase();
  const navigate = useNavigate();

  const cambiarTema = () => {
    const html = document.documentElement;
    const actual = html.getAttribute("data-theme");
    html.setAttribute("data-theme", actual === "dark" ? "light" : "dark");
  };

  const cerrarSesion = async () => {
    try {
      await logout();
    } catch {
      // Aunque falle en el servidor, igual sacamos al usuario
    }
    navigate("/login");
  };

  // Menú que se abre al hacer clic en el usuario
  const menuUsuario: MenuProps["items"] = [
    { key: "perfil", label: "Mi perfil", disabled: true },
    { type: "divider" },
    { key: "salir", label: "Cerrar sesión", danger: true, onClick: cerrarSesion },
  ];

  return (
    <header className="topbar">
      <button className="hamb" onClick={onAbrirMenu} aria-label="Menú">☰</button>

      <div className="scope">
        <div className="sel">
          <IconUbicacion />
          <select defaultValue="todas">
            <option value="todas">Todas las regiones</option>
            <option value="1">Región Central</option>
          </select>
        </div>
        <span className="sep">/</span>
        <div className="sel">
          <IconSucursal />
          <select defaultValue="1">
            <option value="1">Sucursal 1</option>
            <option value="2">Sucursal 2</option>
          </select>
        </div>
      </div>

      <div className="tb-search">
        <IconBuscar />
        <input placeholder="Buscar producto, factura, traslado…" />
      </div>

      <div className="tb-right">
        <button className="icon-btn" onClick={cambiarTema} title="Tema claro/oscuro">
          <IconTema />
        </button>
        <button className="icon-btn" title="Alertas">
          <span className="dot" />
          <IconCampana />
        </button>

        {/* El usuario ahora abre un menú con "Cerrar sesión" */}
        <Dropdown menu={{ items: menuUsuario }} placement="bottomRight" trigger={["click"]}>
          <div className="user" style={{ cursor: "pointer" }}>
            <div className="avatar">{inicial}</div>
            <div className="u-meta">
              <b>{usuario}</b>
              <br />
              <small>{rol}</small>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}