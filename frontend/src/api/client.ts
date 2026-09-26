import axios from "axios";

// Cliente HTTP que apunta al Gateway.
// withCredentials: true -> el navegador envia/recibe las cookies httpOnly solo.
// No manejamos el token a mano: vive en una cookie que el JS no puede ver.
export const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});