import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerPerfil } from "../api/auth.api";
import type { PerfilUsuario } from "../api/auth.api";

interface Sesion {
  usuario: PerfilUsuario | null;
  cargando: boolean;
  puede: (permiso: string) => boolean;
  esSuperAdmin: boolean;
  recargar: () => void;
}

const SesionContext = createContext<Sesion>({
  usuario: null,
  cargando: true,
  puede: () => false,
  esSuperAdmin: false,
  recargar: () => {},
});

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

    const cargar = async () => {
    setCargando(true);
    try {
      const perfil = await obtenerPerfil();
      setUsuario(perfil);
    } catch (e: any) {
      // Solo sacar al usuario si de verdad no esta autenticado
      if (e?.response?.status === 401) {
        setUsuario(null);
        navigate("/login");
      }
      // Otros errores (red, servicio caido): mantener la sesion
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const esSuperAdmin = usuario?.roles.includes("SUPERADMIN") ?? false;

  const valor: Sesion = {
    usuario,
    cargando,
    // El super admin puede todo, sin revisar permisos uno por uno
    puede: (permiso) => esSuperAdmin || (usuario?.permisos.includes(permiso) ?? false),
    esSuperAdmin,
    recargar: cargar,
  };

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export const useSesion = () => useContext(SesionContext);