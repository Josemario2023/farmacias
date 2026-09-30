import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CredencialesForm } from "../components/auth/CredencialesForm";
import { OtpForm } from "../components/auth/OtpForm";
import { login, verifyOtp } from "../api/auth.api";
import "../styles/login.css";
import logo from "../assets/logo.png";

export function LoginPage() {
  // "paso" decide qué formulario se muestra en el panel derecho
  const [paso, setPaso] = useState<"credenciales" | "otp">("credenciales");
  const [username, setUsername] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // PASO 1: enviar usuario y contraseña
  const manejarCredenciales = async (user: string, password: string) => {
    setCargando(true);
    setError("");  
    try {
      await login(user, password);
      setUsername(user);
      setPaso("otp");            // cambia el formulario, la marca se queda
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Credenciales inválidas");
    } finally {
      setCargando(false);
    }
  };

  // PASO 2: enviar el código; el navegador recibe la cookie httpOnly
  const manejarOtp = async (codigo: string) => {
    setCargando(true);
    setError("");
    try {
      await verifyOtp(username, codigo);
      navigate("/panel");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Código inválido o expirado");
    } finally {
      setCargando(false);
    }
  };

  const volver = () => {
    setPaso("credenciales");
    setError("");
  };

  return (
    <div className="login-shell">
      {/* ---------- IZQUIERDA: panel de marca (fijo en ambos pasos) ---------- */}
      <div className="login-brandside">
        <div className="login-logo">
          <img src={logo} alt="Logo" className="login-logo-img" />
          <div>
            <b>FarmaRed</b>
            <small>Sistema integral de farmacias</small>
          </div>
        </div>

        <div>
          
          <div className="login-pills">
            <span className="login-pill">Kardex y lotes</span>
            <span className="login-pill">POS + Facturación</span>
            <span className="login-pill">Corte de caja</span>
            <span className="login-pill">Traslados</span>
            <span className="login-pill">Auditoría por región</span>
          </div>
        </div>

        <small className="login-foot-brand">
          Sistema en desarrollo · Derechos Reservados jmluc 2026
        </small>
      </div>

      {/* ---------- DERECHA: el formulario cambia según el paso ---------- */}
      <div className="login-formside">
        <div style={{ width: "min(380px, 100%)" }}>
          {error && <div className="login-error">{error}</div>}

          {paso === "credenciales" ? (
            <CredencialesForm onSubmit={manejarCredenciales} cargando={cargando} />
          ) : (
            <OtpForm
              username={username}
              onSubmit={manejarOtp}
              onVolver={volver}
              cargando={cargando}
            />
          )}
        </div>
      </div>
    </div>
  );
}