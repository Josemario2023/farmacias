
export interface ColumnaCsv<T> {
  titulo: string;
  valor: (fila: T) => string | number | null | undefined;
}

function escapar(valor: any, separador: string): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  // Si contiene el separador, comillas o saltos de linea, va entre comillas
  if (texto.includes(separador) || /["\n\r]/.test(texto)) {
    return '"' + texto.replace(/"/g, '""') + '"';
  }
  return texto;
}

export function exportarCsv<T>(
  nombreArchivo: string,
  columnas: ColumnaCsv<T>[],
  filas: T[],
  separador: "," | ";" = ",",
) {
  const encabezado = columnas.map((c) => escapar(c.titulo, separador)).join(separador);

  const cuerpo = filas.map((fila) =>
    columnas.map((c) => escapar(c.valor(fila), separador)).join(separador),
  );

  // "sep=" en la primera linea: le dice a Excel cual separador usar.
  
  const instruccion = "sep=" + separador + "\r\n";

  // El BOM (\uFEFF) hace que Excel muestre bien los acentos
  const contenido = "\uFEFF" + instruccion + [encabezado, ...cuerpo].join("\r\n");

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo + "_" + new Date().toISOString().slice(0, 10) + ".csv";
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}