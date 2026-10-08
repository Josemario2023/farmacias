
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { IconUbicacion, IconSucursal, IconBuscar, IconTema, IconCampana } from "./icons";
import { logout } from "../../api/auth.api";

import { useSesion } from "../../hoocks/useSesion";
import { useAlcance } from "../../hoocks/useAlcance";

interface Props {
  onAbrirMenu: () => void;
}

export function Topbar({ onAbrirMenu }: Props) {

  

  const { usuario,esSuperAdmin, sucursalActiva, regionActiva, cambiarSucursal, cambiarRegion, cerrarSesion } = useSesion();
  const alc = useAlcance();

  const elegirRegion = (valor: string) => {
    const r = valor ? Number(valor) : null;
    cambiarRegion(r);
    // si la región tiene una sola sucursal, la dejamos elegida (POS y Caja la necesitan)
    const deRegion = alc.permitidas.filter((s) => r == null || s.regionId === r);
    if (deRegion.length === 1) cambiarSucursal(deRegion[0].value);
  };

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
        {esSuperAdmin && (
          <>
            <div className="sel">
              <IconUbicacion />
              <select value={regionActiva ?? ""} onChange={(e) => elegirRegion(e.target.value)}>
                <option value="">Todas las regiones</option>
                {alc.regionesPermitidas.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <span className="sep">/</span>
          </>
        )}
        <div className="sel">
          <IconSucursal />
          {alc.sucursalesDeRegion.length > 1 ? (
            <select
              value={sucursalActiva ?? ""}
              onChange={(e) => cambiarSucursal(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Todas las sucursales</option>
              {alc.sucursalesDeRegion.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          ) : (
            <span>{alc.sucursalesDeRegion[0]?.label ?? usuario?.sucursalNombre ?? "—"}</span>
          )}
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