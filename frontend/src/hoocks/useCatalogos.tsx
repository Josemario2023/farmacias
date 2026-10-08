import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../api/client";

interface Catalogos {
  usuario: (id: number | string) => string;
  sucursal: (id: number | string) => string;
  region: (id: number | string) => string;
  producto: (id: number | string) => string;
  lote: (id: number | string) => string;

   listaSucursales: { value: number; label: string; regionId: number }[];
  listaRegiones: { value: number; label: string }[];
  listaUsuarios: { value: number; label: string }[];
  listo: boolean;
}

const CatalogosContext = createContext<Catalogos>({
  usuario: (id) => "Usuario " + id,
  sucursal: (id) => "Sucursal " + id,
  region: (id) => "Región " + id,
  producto: (id) => "Producto " + id,
  lote: (id) => "Lote " + id,
  listaSucursales: [],
  listaRegiones: [],
  listaUsuarios: [],
  listo: false,
});

export function CatalogosProvider({ children }: { children: ReactNode }) {
  const [usuarios, setUsuarios] = useState<Record<string, string>>({});
  const [sucursales, setSucursales] = useState<Record<string, string>>({});
  const [regiones, setRegiones] = useState<Record<string, string>>({});
  const [productos, setProductos] = useState<Record<string, string>>({});
  const [lotes, setLotes] = useState<Record<string, string>>({});
  const [listaSucursales, setListaSucursales] = useState<{ value: number; label: string; regionId: number }[]>([]);
  const [listaRegiones, setListaRegiones] = useState<{ value: number; label: string }[]>([]);
  const [listaUsuarios, setListaUsuarios] = useState<{ value: number; label: string }[]>([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      // allSettled: si un servicio esta caido, los demas igual cargan
      const [u, s, r, p, l] = await Promise.allSettled([
        api.get("/usuarios"),
        api.get("/sucursales"),
        api.get("/regiones"),
        api.get("/productos"),
        api.get("/lotes"),
      ]);

       if (u.status === "fulfilled") {
        const mapa: Record<string, string> = {};
        const lista: { value: number; label: string }[] = [];
        u.value.data.forEach((x: any) => {
          const nombre = x.nombre || x.username;
          mapa[x.usuarioId] = nombre;
          if (x.activo === 1) lista.push({ value: x.usuarioId, label: nombre });
        });
        setUsuarios(mapa);
        setListaUsuarios(lista);
      }


       if (s.status === "fulfilled") {
        const mapa: Record<string, string> = {};
        const lista: { value: number; label: string; regionId: number }[] = [];
        s.value.data.forEach((x: any) => {
          mapa[x.sucursalId] = x.nombre;
          if (x.activo === 1) lista.push({ value: x.sucursalId, label: x.nombre, regionId: x.regionId });
        });
        setSucursales(mapa);
        setListaSucursales(lista);
      }
      
      if (r.status === "fulfilled") {
        const mapa: Record<string, string> = {};
        const lista: { value: number; label: string }[] = [];
        r.value.data.forEach((x: any) => {
          mapa[x.regionId] = x.nombre;
          if (x.activo === 1) lista.push({ value: x.regionId, label: x.nombre });
        });
        setRegiones(mapa);
        setListaRegiones(lista);
      }
      if (p.status === "fulfilled") {
        const mapa: Record<string, string> = {};
        p.value.data.forEach((x: any) => {
          mapa[x.productoId] = x.codigo + " · " + x.nombre;
        });
        setProductos(mapa);
      }
      if (l.status === "fulfilled") {
        const mapa: Record<string, string> = {};
        l.value.data.forEach((x: any) => { mapa[x.loteId] = x.numeroLote; });
        setLotes(mapa);
      }

      setListo(true);
    };
    cargar();
  }, []);

  // Cada funcion devuelve el nombre, o un texto con el id si no lo encuentra
   const valor: Catalogos = {
    usuario: (id) => usuarios[String(id)] ?? "Usuario " + id,
    sucursal: (id) => sucursales[String(id)] ?? "Sucursal " + id,
    region: (id) => regiones[String(id)] ?? "Región " + id,
    producto: (id) => productos[String(id)] ?? "Producto " + id,
    lote: (id) => lotes[String(id)] ?? "Lote " + id,
    listaSucursales,
    listaRegiones,
    listaUsuarios,
    listo,
  };

  return (
    <CatalogosContext.Provider value={valor}>{children}</CatalogosContext.Provider>
  );
}

// Hook para usarlo en cualquier pantalla
export const useCatalogos = () => useContext(CatalogosContext);