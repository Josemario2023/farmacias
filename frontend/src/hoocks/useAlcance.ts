import { useCatalogos } from "./useCatalogos";
import { useSesion } from "./useSesion";

export function useAlcance() {
  const cat = useCatalogos();
  const { usuario, esSuperAdmin, sucursalActiva, regionActiva } = useSesion();

  // Sucursales que esta persona puede ver: el superadmin todas; los demás, las asignadas
  const permitidas = esSuperAdmin
    ? cat.listaSucursales
    : cat.listaSucursales.filter((s) =>
        (usuario?.sucursales ?? []).some((u) => u.sucursalId === s.value),
      );

   const regionesPermitidas = cat.listaRegiones.filter((r) =>
    permitidas.some((s) => s.regionId === r.value),
  );
   const regionEfectiva = esSuperAdmin ? regionActiva : null;

  const sucursalesDeRegion =
    regionEfectiva == null ? permitidas : permitidas.filter((s) => s.regionId === regionEfectiva);
  
  // Sucursales que entran en lo que se está viendo ahora
  const enAlcance: number[] =
    sucursalActiva != null ? [sucursalActiva] : sucursalesDeRegion.map((s) => s.value);

  return {
    permitidas,
    regionesPermitidas,
    sucursalesDeRegion,
    enAlcance,
     dentro: (sucursalId: number) => !cat.listo || enAlcance.includes(sucursalId),
  };
}