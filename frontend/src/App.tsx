import { Button, Result } from "antd";

function App() {
  return (
    <Result
      status="success"
      title="Frontend de Farmacias listo"
      subTitle="Ant Design funcionando. Ahora construimos el login."
      extra={<Button type="primary">Boton de prueba</Button>}
    />
  );
}

export default App;