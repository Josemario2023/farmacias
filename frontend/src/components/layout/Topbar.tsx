
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { IconUbicacion, IconSucursal, IconBuscar, IconTema, IconCampana } from "./icons";
import { logout } from "../../api/auth.api";
import { useCatalogos } from "../../hoocks/useCatalogos";
import { useSesion } from "../../hoocks/useSesion";

interface Props {
  onAbrirMenu: () => void;
}

export function Topbar({ onAbrirMenu }: Props) {

  const cat = useCatalogos();

  const { usuario, sucursalActiva,cambiarSucursal, cerrarSesion } = useSesion();

  const nombre = usuario?.nombre ?? "Usuario";
  const rolTexto = usuario?.roles?.join(" · ") ?? "";
  const inicial = nombre.charAt(0).toUpperCase();

  const cambiarTema = () => {
    const html = document.documentElement;
    const actual = html.getAttribute("data-theme");
    html.setAttribute("data-theme", actual === "dark" ? "light" : "dark");
  };

    const salir = async () => {
    try {
      await logout();   // borra la cookie httpOnly en el servidor
    } catch {
      // aunque falle en el servidor, sacamos al usuario igual
    }
    cerrarSesion();     // limpia el estado en memoria + replace al login
  };

  // Menú que se abre al hacer clic en el usuario
  const menuUsuario: MenuProps["items"] = [
    { key: "perfil", label: "Mi perfil", disabled: true },
    { type: "divider" },
   { key: "salir", label: "Cerrar sesión", danger: true, onClick: salir },
  ];

  return (
    <header className="topbar">
      <button className="hamb" onClick={onAbrirMenu} aria-label="Menú">☰</button>

      <div className="scope">
        <div className="sel">
          <IconUbicacion />
          <select defaultValue="">
            <option value="">Todas las regiones</option>
            {cat.listaRegiones.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <span className="sep">/</span>
        <div className="sel">
          <IconSucursal />
          <select
            value={sucursalActiva ?? ""}
            onChange={(e) => cambiarSucursal(Number(e.target.value))}
          >
              {(usuario?.sucursales ?? []).map((s) => (
              <option key={s.sucursalId} value={s.sucursalId}>{s.nombre}</option>
            ))}
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

        <Dropdown menu={{ items: menuUsuario }} placement="bottomRight" trigger={["click"]}>
          <div className="user" style={{ cursor: "pointer" }}>
            <div className="avatar">{inicial}</div>
            <div className="u-meta">
              <b>{nombre}</b>
              <br />
              <small>{rolTexto}</small>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}