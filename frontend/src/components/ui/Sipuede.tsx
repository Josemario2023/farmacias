import type { ReactNode } from "react";
import { useSesion } from "../../hoocks/useSesion";

interface Props {
  permiso: string;
  children: ReactNode;
  alternativa?: ReactNode;
}

// Muestra sus hijos solo si el usuario tiene el permiso indicado.
// Uso: <SiPuede permiso="PRODUCTO_EDITAR"><Button>Nuevo</Button></SiPuede>
export function SiPuede({ permiso, children, alternativa = null }: Props) {
  const { puede } = useSesion();
  return <>{puede(permiso) ? children : alternativa}</>;
}