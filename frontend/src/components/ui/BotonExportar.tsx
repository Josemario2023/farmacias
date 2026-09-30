import { Button, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { exportarCsv } from "../../utils/exportar";
import type { ColumnaCsv } from "../../utils/exportar";

interface Props<T> {
  nombreArchivo: string;
  columnas: ColumnaCsv<T>[];
  filas: T[];
  texto?: string;
  size?: "small" | "middle" | "large";
}

export function BotonExportar<T>({
  nombreArchivo, columnas, filas, texto = "Exportar", size = "middle",
}: Props<T>) {
  const exportar = () => {
    if (filas.length === 0) {
      message.warning("No hay datos para exportar");
      return;
    }
    exportarCsv(nombreArchivo, columnas, filas);
    message.success(filas.length + " registro(s) exportados");
  };

  return (
    <Button icon={<DownloadOutlined />} onClick={exportar} size={size}>
      {texto}
    </Button>
  );
}