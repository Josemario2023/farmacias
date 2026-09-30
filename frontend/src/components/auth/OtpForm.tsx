import { useState } from "react";

interface Props {
  username: string;
  onSubmit: (codigo: string) => void;
  onVolver: () => void;
  cargando: boolean;
}

export function OtpForm({ username, onSubmit, onVolver, cargando }: Props) {
  const [codigo, setCodigo] = useState("");

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(codigo);
  };

  return (
    <form className="loginbox" onSubmit={enviar}>
      <h2>Verificación en dos pasos</h2>
      <p className="sub">
        Enviamos un código de 6 dígitos al correo de <b>{username}</b>.
        Expira en 5 minutos.
      </p>

      <div className="field">
        <label htmlFor="codigo">Código de verificación</label>
        <input
          id="codigo"
          className="otp-input"
          type="text"
          inputMode="numeric"
          maxLength={6}
          required
          placeholder="000000"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
          autoFocus
        />
      </div>

      <button
        className="btn primary block"
        type="submit"
        disabled={cargando || codigo.length !== 6}
      >
        {cargando ? "Verificando…" : "Verificar e ingresar"}
      </button>

      <button
        className="btn ghost block"
        type="button"
        onClick={onVolver}
        style={{ marginTop: 10 }}
      >
        Volver
      </button>

      <p className="login-foot">
        ¿No te llegó? Vuelve atrás e inténtalo de nuevo.
      </p>
    </form>
  );
}
