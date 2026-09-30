import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import "../../styles/layout.css";

export function AppLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <>
      {/* Capa oscura detrás del menú en móvil */}
      <div
        className={"scrim" + (menuAbierto ? " show" : "")}
        onClick={() => setMenuAbierto(false)}
      />

      <div className="shell">
        <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />

        <div className="main">
          <Topbar
            onAbrirMenu={() => setMenuAbierto(true)}
            usuario="admin"
            rol="Administrador central"
          />

          <main className="content">
            {/* Aquí React Router inyecta la pantalla de la ruta actual */}
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}