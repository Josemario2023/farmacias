import axios from "axios";

// Cliente HTTP que apunta al Gateway.
// withCredentials: true -> el navegador envia/recibe las cookies httpOnly solo.
// No manejamos el token a mano: vive en una cookie que el JS no puede ver.
export const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});


api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;

    if (status === 403) {
      error.mensajeAmigable =
        error?.response?.data?.message ?? "No tienes permiso para esta operación";
    } else if (status === 401) {
      error.mensajeAmigable = "Tu sesión expiró. Vuelve a iniciar sesión.";
    }
    return Promise.reject(error);
  },
);