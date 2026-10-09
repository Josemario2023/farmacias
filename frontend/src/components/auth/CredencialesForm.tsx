import { useState } from "react";

interface Props {
  onSubmit: (username: string, password: string) => void;
  cargando: boolean;
}

export function CredencialesForm({ onSubmit, cargando }: Props) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [verPwd, setVerPwd] = useState(false);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(username, password);
  };

  return (
    <form className="loginbox" onSubmit={enviar}>
      <h2>Inicia sesión</h2>
      <p className="sub">
        Ingresa con tu cuenta al sistema de Farmacias Batres. 
      </p>

      <div className="field">
        <label htmlFor="usuario">Usuario</label>
        <input
          id="usuario"
          type="text"
          required
          placeholder="user"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
      </div>

      <div className="field">
        <label htmlFor="pass">Contraseña</label>
        <div className="pwd">
          <input
            id="pass"
            type={verPwd ? "text" : "password"}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="pwd-toggle"
            onClick={() => setVerPwd(!verPwd)}
            aria-label="Mostrar contraseña"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="login-row">
        <label className="check">
          <input type="checkbox" defaultChecked />
          <span>Recordarme</span>
        </label>
        <a className="link" onClick={(e) => e.preventDefault()}>
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <button className="btn primary block" type="submit" disabled={cargando}>
        {cargando ? "Verificando…" : "Entrar"}
      </button>

      <p className="login-foot">
        Se enviará un código de verificación a tu correo.
      </p>
    </form>
  );
}