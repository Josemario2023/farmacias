import { useEffect, useState } from "react";
import { Modal, Select, InputNumber, Button, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { obtenerExistencias } from "../../api/inventory.api";
import { solicitarTraslado } from "../../api/traslados.api";
import { useCatalogos } from "../../hoocks/useCatalogos";
import { useSesion } from "../../hoocks/useSesion";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onListo: () => void;
}

interface Linea {
  productoId: number;
  loteId: number;
  cantidad: number;
  disponible: number;
}

export function SolicitarTrasladoModal({ abierto, onCerrar, onListo }: Props) {
  const cat = useCatalogos();
  const { usuario, sucursalActiva } = useSesion();

  const [origen, setOrigen] = useState<number | null>(null);
  const [destino, setDestino] = useState<number | null>(null);
  const [existencias, setExistencias] = useState<any[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [eleccion, setEleccion] = useState<string | null>(null);   // "productoId-loteId"
  const [guardando, setGuardando] = useState(false);

  // Al abrir: empezar de cero, con la sucursal activa como origen
  useEffect(() => {
    if (abierto) {
      setOrigen(sucursalActiva);
      setDestino(null);
      setLineas([]);
      setEleccion(null);
    }
  }, [abierto]);

  // Al cambiar el origen: traer SU stock y vaciar las líneas (eran de otro origen)
  useEffect(() => {
    if (!abierto || origen == null) return;
    setLineas([]);
    setEleccion(null);
    obtenerExistencias(origen)
      .then((e) => setExistencias(e.filter((x: any) => Number(x.cantidad) > 0)))
      .catch(() => message.error("No se pudo cargar el stock del origen"));
  }, [abierto, origen]);

  const agregar = () => {
    if (!eleccion) return;
    const e = existencias.find((x) => x.productoId + "-" + x.loteId === eleccion);
    if (!e) return;
    if (lineas.some((l) => l.productoId === e.productoId && l.loteId === e.loteId)) {
      message.warning("Ese lote ya está en el traslado");
      return;
    }
    setLineas([
      ...lineas,
      { productoId: e.productoId, loteId: e.loteId, cantidad: 1, disponible: Number(e.cantidad) },
    ]);
    setEleccion(null);
  };

  const cambiarCantidad = (idx: number, valor: number | null) =>
    setLineas(lineas.map((l, i) => (i === idx ? { ...l, cantidad: valor ?? 1 } : l)));

  const quitar = (idx: number) => setLineas(lineas.filter((_, i) => i !== idx));

  const guardar = async () => {
    if (origen == null || destino == null) {
      message.warning("Elige el origen y el destino");
      return;
    }
    if (origen === destino) {
      message.warning("El origen y el destino no pueden ser la misma sucursal");
      return;
    }
    if (lineas.length === 0) {
      message.warning("Agrega al menos un producto");
      return;
    }
    setGuardando(true);
    try {
      await solicitarTraslado({
        numero: "TR-" + Date.now().toString().slice(-8),
        sucursalOrigenId: origen,
        sucursalDestinoId: destino,
        solicitadoPor: usuario!.usuarioId,
        lineas: lineas.map((l) => ({
          productoId: l.productoId,
          loteId: l.loteId,
          cantSolicitada: l.cantidad,
        })),
      });
      message.success("Traslado solicitado");
      onListo();
      onCerrar();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudo solicitar el traslado");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      title="Solicitar traslado"
      open={abierto}
      onCancel={onCerrar}
      onOk={guardar}
      confirmLoading={guardando}
      okText="Solicitar"
      cancelText="Cancelar"
      width={620}
    >
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div>Origen (sale la mercadería)</div>
          <Select
            style={{ width: "100%" }}
            value={origen}
            onChange={setOrigen}
            options={cat.listaSucursales}
            placeholder="Sucursal origen"
          />
        </div>
        <div style={{ flex: 1 }}>
          <div>Destino (recibe)</div>
          <Select
            style={{ width: "100%" }}
            value={destino}
            onChange={setDestino}
            options={cat.listaSucursales.filter((s) => s.value !== origen)}
            placeholder="Sucursal destino"
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Select
          style={{ flex: 1 }}
          showSearch
          optionFilterProp="label"
          value={eleccion}
          onChange={setEleccion}
          placeholder="Busca un producto y lote del origen"
          options={existencias.map((e) => ({
            value: e.productoId + "-" + e.loteId,
            label:
              cat.producto(e.productoId) + " · Lote " + cat.lote(e.loteId) +
              " (disp. " + Number(e.cantidad) + ")",
          }))}
        />
        <Button onClick={agregar} disabled={!eleccion}>Agregar</Button>
      </div>

      {lineas.length === 0 ? (
        <div className="empty">
          <b>Sin productos</b>
          Agrega los productos que se van a trasladar.
        </div>
      ) : (
        <table className="tbl" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Lote</th>
              <th className="num">Disponible</th>
              <th className="num">Cantidad</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => (
              <tr key={l.productoId + "-" + l.loteId}>
                <td>{cat.producto(l.productoId)}</td>
                <td>{cat.lote(l.loteId)}</td>
                <td className="num">{l.disponible}</td>
                <td className="num">
                  <InputNumber
                    size="small"
                    min={1}
                    max={l.disponible}
                    value={l.cantidad}
                    onChange={(v) => cambiarCantidad(i, v)}
                    style={{ width: 80 }}
                  />
                </td>
                <td>
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => quitar(i)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}