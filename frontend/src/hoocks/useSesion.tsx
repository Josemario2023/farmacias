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
  recargar: () => Promise<boolean>; 
  sucursalActiva: number | null;
  cambiarSucursal: (id: number) => void;
  cerrarSesion: () => void;
}

const SesionContext = createContext<Sesion>({
  usuario: null,
  cargando: true,
  puede: () => false,
  esSuperAdmin: false,
  recargar: async () => false, 
  sucursalActiva: null,
  cambiarSucursal: () => {},
  cerrarSesion: () => {},
});

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [sucursalActiva, setSucursalActiva] = useState<number | null>(null);
  const navigate = useNavigate();

 const cargar = async (): Promise<boolean> => {
  setCargando(true);
  try {
    const perfil: any = await obtenerPerfil();

    // Solo es un usuario válido si trae identidad y roles.
    // Cualquier otra cosa (null, { autenticado: false }, etc.) = sin sesión.
    if (!perfil || perfil.autenticado === false || !Array.isArray(perfil.roles)) {
      setUsuario(null);
      navigate("/login");
      return false;
    }
    setUsuario(perfil);
    setSucursalActiva(perfil.sucursalId ?? null);
    return true;
  } catch (e: any) {
    if (e?.response?.status === 401) {
      setUsuario(null);
      navigate("/login");
    }
    // Otros errores (red, servicio caído): no sacar al usuario, pero tampoco hay sesión
    return false;
  } finally {
    setCargando(false);
  }

  
};

const cerrarSesion = () => {
    setUsuario(null);
    setSucursalActiva(null);
    
    // asi "regresar" no vuelve a la sesion
    navigate("/login", { replace: true });
  };

  useEffect(() => { cargar(); }, []);

  // El "?." tambien protege a roles y permisos, no solo a usuario
  const esSuperAdmin = usuario?.roles?.includes("SUPERADMIN") ?? false;

  const valor: Sesion = {
    usuario,
    cargando,
    puede: (permiso) => esSuperAdmin || (usuario?.permisos?.includes(permiso) ?? false),
    esSuperAdmin,
    recargar: cargar,
    sucursalActiva,
    cambiarSucursal: setSucursalActiva,
    cerrarSesion,
  }; 
  

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export const useSesion = () => useContext(SesionContext);