import { Form, Input, Button } from "antd";

interface Props {
  onSubmit: (valores: { codigo: string }) => void;
  onVolver: () => void;
  cargando: boolean;
}

export function OtpForm({ onSubmit, onVolver, cargando }: Props) {
  return (
    <Form layout="vertical" onFinish={onSubmit}>
      <p>Ingresa el código de 6 dígitos que enviamos a tu correo.</p>
      <Form.Item label="Código" name="codigo" rules={[{ required: true, message: "Ingresa el código" }]}>
        <Input placeholder="123456" maxLength={6} />
      </Form.Item>
      <Button type="primary" htmlType="submit" block loading={cargando}>
        Verificar
      </Button>
      <Button type="link" block onClick={onVolver}>
        Volver
      </Button>
    </Form>
  );
}