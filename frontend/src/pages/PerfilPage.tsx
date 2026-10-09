import { useState } from "react";
import { Form, Input, Button, Tag, message } from "antd";
import { useSesion } from "../hoocks/useSesion";
import { useCatalogos } from "../hoocks/useCatalogos";
import { cambiarPassword } from "../api/auth.api";
import "../styles/components.css";

export function PerfilPage() {
  const { usuario, esSuperAdmin } = useSesion();
  const cat = useCatalogos();
  const [form] = Form.useForm();
  const [guardando, setGuardando] = useState(false);

  const guardar = async (v: { actual: string; nueva: string }) => {
    setGuardando(true);
    try {
      await cambiarPassword(v.actual, v.nueva);
      message.success("Contraseña actualizada");
      form.resetFields();
    } catch (e: any) {
      const m = e?.response?.data?.message;
      message.error(Array.isArray(m) ? m.join(", ") : m ?? "No se pudo cambiar la contraseña");
    } finally {
      setGuardando(false);
    }
  };

  if (!usuario) return null;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Mi perfil</h2>
          <p>Tus datos de acceso y tu contraseña.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-h"><h3>Mis datos</h3></div>
          <div style={{ padding: 18, lineHeight: 2 }}>
            <p><b>Nombre:</b> {usuario.nombre}</p>
            <p><b>Usuario:</b> {usuario.username}</p>
            <p>
              <b>Roles:</b>{" "}
              {usuario.roles.map((r) => <Tag key={r} color="blue">{r}</Tag>)}
            </p>
            <p>
              <b>Sucursales:</b>{" "}
              {esSuperAdmin ? (
                <Tag color="green">Todas</Tag>
              ) : usuario.sucursales.length === 0 ? (
                "—"
              ) : (
                usuario.sucursales.map((s) => (
                  <Tag key={s.sucursalId}>{s.nombre} · {cat.region(s.regionId)}</Tag>
                ))
              )}
            </p>
            <p style={{ marginBottom: 6 }}><b>Permisos:</b></p>
            {esSuperAdmin ? (
              <Tag color="green">Acceso total</Tag>
            ) : (
              [...usuario.permisos].sort().map((p) => <Tag key={p} style={{ marginBottom: 4 }}>{p}</Tag>)
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>Cambiar contraseña</h3></div>
          <div style={{ padding: 18 }}>
            <Form form={form} layout="vertical" onFinish={guardar} requiredMark={false}>
              <Form.Item name="actual" label="Contraseña actual"
                rules={[{ required: true, message: "Escribe tu contraseña actual" }]}>
                <Input.Password autoComplete="current-password" />
              </Form.Item>

              <Form.Item name="nueva" label="Contraseña nueva"
                extra="Mínimo 8 caracteres, con letras y números."
                rules={[
                  { required: true, message: "Escribe la contraseña nueva" },
                  { min: 8, message: "Debe tener al menos 8 caracteres" },
                  { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: "Debe incluir letras y números" },
                ]}>
                <Input.Password autoComplete="new-password" />
              </Form.Item>

              <Form.Item name="confirmar" label="Repite la contraseña nueva" dependencies={["nueva"]}
                rules={[
                  { required: true, message: "Repite la contraseña nueva" },
                  ({ getFieldValue }) => ({
                    validator(_, valor) {
                      return !valor || getFieldValue("nueva") === valor
                        ? Promise.resolve()
                        : Promise.reject(new Error("Las contraseñas no coinciden"));
                    },
                  }),
                ]}>
                <Input.Password autoComplete="new-password" />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={guardando}>Guardar contraseña</Button>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}