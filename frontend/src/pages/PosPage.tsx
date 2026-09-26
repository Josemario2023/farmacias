import { Card, Typography } from "antd";

const { Title } = Typography;

export function PosPage() {
  return (
    <div style={{ padding: 40 }}>
      <Card>
        <Title level={2}>POS — Punto de Venta</Title>
        <p>¡Login exitoso! Aquí construiremos el registro de ventas.</p>
      </Card>
    </div>
  );
}