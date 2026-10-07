import { Spin } from "antd";
import { useState } from "react";
import { Outlet,Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import "../../styles/layout.css";
import { useSesion } from "../../hoocks/useSesion";

export function AppLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { cargando, usuario } = useSesion();

  if (cargando) {
  return (
    <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
      <Spin size="large" />
    </div>
  );
}
  if (!usuario) return <Navigate to="/login" replace />;

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