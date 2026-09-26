import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Typography, message } from "antd";
import { CredencialesForm } from "../components/CredencialesForm";
import { OtpForm } from "../components/OtpForm";
import { login, verifyOtp } from "../api/auth.api";

const { Title } = Typography;

export function LoginPage() {
  const [paso, setPaso] = useState<"credenciales" | "otp">("credenciales");
  const [username, setUsername] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const manejarCredenciales = async (valores: { username: string; password: string }) => {
    setCargando(true);
    try {
      await login(valores.username, valores.password);
      setUsername(valores.username);
      setPaso("otp");
      message.success("Código enviado. Revisa Mailhog.");
    } catch {
      message.error("Credenciales inválidas");
    } finally {
      setCargando(false);
    }
  };

  const manejarOtp = async (valores: { codigo: string }) => {
    setCargando(true);
    try {
      await verifyOtp(username, valores.codigo);
      message.success("¡Login exitoso!");
      navigate("/pos");
    } catch {
      message.error("Código inválido o expirado");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f0f2f5" }}>
      <Card style={{ width: 380 }}>
        <Title level={3} style={{ textAlign: "center" }}>Farmacias — Ingreso</Title>
        {paso === "credenciales" ? (
          <CredencialesForm onSubmit={manejarCredenciales} cargando={cargando} />
        ) : (
          <OtpForm onSubmit={manejarOtp} onVolver={() => setPaso("credenciales")} cargando={cargando} />
        )}
      </Card>
    </div>
  );
}