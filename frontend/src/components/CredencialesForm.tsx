import { Form, Input, Button } from "antd";

// "props": lo que este componente recibe de su padre.
// onSubmit = funcion que el padre nos pasa; la llamamos al enviar.
interface Props {
  onSubmit: (valores: { username: string; password: string }) => void;
  cargando: boolean;
}

export function CredencialesForm({ onSubmit, cargando }: Props) {
  return (
    <Form layout="vertical" onFinish={onSubmit}>
      <Form.Item label="Usuario" name="username" rules={[{ required: true, message: "Ingresa tu usuario" }]}>
        <Input placeholder="admin" />
      </Form.Item>
      <Form.Item label="Contraseña" name="password" rules={[{ required: true, message: "Ingresa tu contraseña" }]}>
        <Input.Password placeholder="••••••" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block loading={cargando}>
        Continuar
      </Button>
    </Form>
  );
}