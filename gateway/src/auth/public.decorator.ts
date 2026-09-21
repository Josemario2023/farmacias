import { SetMetadata } from "@nestjs/common";

// Marca una ruta como publica (sin necesidad de token).
// Uso: poner @Public() encima del metodo del controlador.
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
