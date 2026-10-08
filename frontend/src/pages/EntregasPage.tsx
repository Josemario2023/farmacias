import { useEffect, useRef, useState } from "react";
import { Spin, Tag, message, Button, Modal, Input, InputNumber, Select } from "antd";
import { PrinterOutlined, PictureOutlined } from "@ant-design/icons";
import html2canvas from "html2canvas";
import {
  buscarDisponibilidad, cotizar, obtenerCotizaciones, verCotizacion,
  cambiarEstadoCotizacion, obtenerFormasPago,
} from "../api/delivery.api";
import type { Disponible, Cotizacion, CotizacionDetalle } from "../api/delivery.api";
import { useCatalogos } from "../hoocks/useCatalogos";
import "../styles/components.css";
import { useAlcance } from "../hoocks/useAlcance";

const Q = (n: number | null | undefined) => "Q " + Number(n ?? 0).toFixed(2);

const COLOR: Record<string, string> = {
  PENDIENTE: "gold",
  CONFIRMADA: "green",
  CANCELADA: "red",
};

interface ItemCarrito {
  productoId: number;
  nombre: string;
  cantidad: number;
  precioRef: number;
}

// Hoja de la cotizacion: la usan el modal (imagen) y la hoja de impresion
function Comprobante(props: {
  v: CotizacionDetalle;
  sucursal: string;
  forma: string | null;
  producto: (id: number) => string;
}) {
  const { v, sucursal, forma, producto } = props;
  const lineas =
    v.lineas.length > 0
      ? v.lineas.map((l) => ({
          id: l.detalleId,
          nombre: l.nombreProducto ?? producto(l.productoId),
          cantidad: l.cantidad,
          precio: l.precioUnitario,
          total: l.total,
        }))
      : v.productoId != null
        ? [{ id: 0, nombre: producto(v.productoId), cantidad: 1, precio: Number(v.precio), total: Number(v.precio) }]
        : [];
  const total = v.total ?? v.precio;

  return (
    <div style={{ background: "#fff", color: "#000", padding: 20, fontSize: 14 }}>
      <h2 style={{ textAlign: "center", margin: 0 }}>Farmacias</h2>
      <h3 style={{ textAlign: "center", margin: "4px 0 12px" }}>
        Cotización de entrega No. {v.cotizacionId}
      </h3>
      <p style={{ margin: "2px 0" }}><b>Fecha:</b> {String(v.creadoEn).slice(0, 16).replace("T", " ")}</p>
      <p style={{ margin: "2px 0" }}><b>Estado:</b> {v.estado}</p>
      <p style={{ margin: "2px 0" }}><b>Cliente:</b> {v.clienteNombre ?? v.clienteRef ?? "—"}</p>
      {v.clienteDireccion && <p style={{ margin: "2px 0" }}><b>Dirección:</b> {v.clienteDireccion}</p>}
      {v.clienteTelefono && <p style={{ margin: "2px 0" }}><b>Teléfono:</b> {v.clienteTelefono}</p>}
      <p style={{ margin: "2px 0" }}><b>Sucursal que entrega:</b> {sucursal}</p>
      <p style={{ margin: "2px 0" }}>
        <b>Tiempo estimado:</b> {v.tiempoEstimadoMin != null ? v.tiempoEstimadoMin + " min" : "—"}
      </p>
      <p style={{ margin: "2px 0 10px" }}><b>Forma de pago:</b> {forma ?? "Por definir"}</p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #000" }}>
            <th align="left">Producto</th>
            <th align="right">Cant.</th>
            <th align="right">P. unit.</th>
            <th align="right">Total</th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((l, i) => (
            <tr key={l.id + "-" + i}>
              <td>{l.nombre}</td>
              <td align="right">{l.cantidad}</td>
              <td align="right">{Q(l.precio)}</td>
              <td align="right">{Q(l.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ textAlign: "right", marginTop: 10, fontSize: 16 }}><b>Total {Q(total)}</b></p>
    </div>
  );
}

export function EntregasPage() {
  const cat = useCatalogos();
  const alc = useAlcance();
  // buscador
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Disponible[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  // carrito y cliente
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cotizando, setCotizando] = useState(false);

  // lista
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const visibles = cotizaciones.filter((c) => alc.dentro(c.sucursalAsignadaId));

  // cotizacion abierta
  const [vista, setVista] = useState<CotizacionDetalle | null>(null);
  const [formas, setFormas] = useState<string[]>([]);
  const [formaSel, setFormaSel] = useState<string | null>(null);
  const [accionando, setAccionando] = useState(false);
  const hojaRef = useRef<HTMLDivElement>(null);

  const cargar = async () => {
    setCargando(true);
    try {
      setCotizaciones(await obtenerCotizaciones());
    } catch {
      message.error("No se pudieron cargar las cotizaciones");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // ---------- buscador y carrito ----------
  const buscar = async () => {
    if (!texto.trim()) return;
    setBuscando(true);
    try {
      setResultados(await buscarDisponibilidad(texto.trim()));
    } catch {
      message.error("No se pudo buscar el producto");
    } finally {
      setBuscando(false);
    }
  };

  const agregar = (d: Disponible) => {
    setCarrito((prev) => {
      const ya = prev.find((i) => i.productoId === d.productoId);
      if (ya) {
        return prev.map((i) =>
          i.productoId === d.productoId ? { ...i, cantidad: i.cantidad + 1 } : i,
        );
      }
      return [...prev, { productoId: d.productoId, nombre: d.nombreProducto, cantidad: 1, precioRef: d.precio }];
    });
  };

  const cambiarCantidad = (productoId: number, cantidad: number) =>
    setCarrito((prev) => prev.map((i) => (i.productoId === productoId ? { ...i, cantidad } : i)));

  const quitar = (productoId: number) =>
    setCarrito((prev) => prev.filter((i) => i.productoId !== productoId));

  //  cotizar 
  const hacerCotizacion = async () => {
    if (carrito.length === 0) {
      message.warning("Agrega al menos un producto");
      return;
    }
    if (!nombre.trim()) {
      message.warning("El nombre del cliente es obligatorio");
      return;
    }
    setCotizando(true);
    try {
      const r = await cotizar({
        items: carrito.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
        clienteNombre: nombre.trim(),
        clienteDireccion: direccion.trim() || undefined,
        clienteTelefono: telefono.trim() || undefined,
      });
      setCarrito([]);
      setNombre(""); setDireccion(""); setTelefono("");
      cargar();
      await abrirVista(r.cotizacionId);
    } catch (e: any) {
      const m = e?.response?.data?.message;
      message.error(Array.isArray(m) ? m.join(", ") : m ?? "No se pudo cotizar");
    } finally {
      setCotizando(false);
    }
  };

  // cotizacion abierta -
  const abrirVista = async (id: number) => {
    try {
      const v = await verCotizacion(id);
      let nombres: string[] = [];
      try {
        nombres = (await obtenerFormasPago(v.sucursalAsignadaId)).map((f) => f.formaPago);
      } catch { /* usamos el respaldo */ }
      setFormas(nombres.length > 0 ? nombres : ["EFECTIVO"]);
      setFormaSel(v.formaPago);
      setVista(v);
    } catch {
      message.error("No se pudo abrir la cotización");
    }
  };

  // Las cotizaciones nuevas (varios productos) no traen productoId y exigen forma de pago
  const esNueva = vista != null && vista.productoId == null;

  const confirmar = async () => {
    if (!vista) return;
    if (esNueva && !formaSel) {
      message.warning("Elige la forma de pago");
      return;
    }
    setAccionando(true);
    try {
      await cambiarEstadoCotizacion(vista.cotizacionId, "CONFIRMADA", formaSel ?? undefined);
      message.success("Cotización confirmada");
      cargar();
      await abrirVista(vista.cotizacionId);
    } catch (e: any) {
      const m = e?.response?.data?.message;
      message.error(Array.isArray(m) ? m.join(", ") : m ?? "No se pudo confirmar");
    } finally {
      setAccionando(false);
    }
  };

  const cancelar = () => {
    if (!vista) return;
    Modal.confirm({
      title: "Cancelar cotización " + vista.cotizacionId,
      content: "La cotización quedará CANCELADA.",
      okText: "Cancelar cotización",
      okButtonProps: { danger: true },
      cancelText: "Volver",
      onOk: async () => {
        try {
          await cambiarEstadoCotizacion(vista.cotizacionId, "CANCELADA");
          message.success("Cotización cancelada");
          setVista(null);
          cargar();
        } catch (e: any) {
          message.error(e?.response?.data?.message ?? "No se pudo cancelar");
        }
      },
    });
  };

  const guardarImagen = async () => {
    if (!hojaRef.current || !vista) return;
    try {
      const canvas = await html2canvas(hojaRef.current, { backgroundColor: "#ffffff", scale: 2 });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "cotizacion-" + vista.cotizacionId + ".png";
      a.click();
    } catch {
      message.error("No se pudo generar la imagen");
    }
  };

  const formaMostrada = vista ? (vista.formaPago ?? formaSel) : null;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Entregas</h2>
          <p>Arma el pedido del cliente, cotiza la mejor sucursal para entregarlo y dale seguimiento.</p>
        </div>
      </div>

      {/* ---------- Buscador ---------- */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            placeholder="Nombre del producto (ej. acetaminofén)"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onPressEnter={buscar}
          />
          <Button type="primary" loading={buscando} onClick={buscar}>Buscar</Button>
        </div>

        {resultados != null && (
          resultados.length === 0 ? (
            <div className="empty">
              <b>Sin resultados</b>
              Ninguna sucursal tiene ese producto disponible.
            </div>
          ) : (
            <div className="tbl-wrap" style={{ marginTop: 12 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Sucursal</th>
                    <th className="num">Disponible</th>
                    <th className="num">Precio</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((d) => (
                    <tr key={d.productoId + "-" + d.sucursalId}>
                      <td>{d.nombreProducto}</td>
                      <td>{cat.sucursal(d.sucursalId)}</td>
                      <td className="num">{d.cantidad}</td>
                      <td className="num">{Q(d.precio)}</td>
                      <td><Button size="small" onClick={() => agregar(d)}>Agregar</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/*  Pedido del cliente */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <b>Pedido del cliente</b>
        {carrito.length === 0 ? (
          <p style={{ color: "#888" }}>Busca un producto y pulsa "Agregar".</p>
        ) : (
          <div className="tbl-wrap" style={{ margin: "8px 0 12px" }}>
            <table className="tbl">
              <thead>
                <tr><th>Producto</th><th className="num">Precio ref.</th><th>Cantidad</th><th></th></tr>
              </thead>
              <tbody>
                {carrito.map((i) => (
                  <tr key={i.productoId}>
                    <td>{i.nombre}</td>
                    <td className="num">{Q(i.precioRef)}</td>
                    <td>
                      <InputNumber
                        min={1}
                        value={i.cantidad}
                        onChange={(v) => cambiarCantidad(i.productoId, v ?? 1)}
                      />
                    </td>
                    <td><Button size="small" danger onClick={() => quitar(i.productoId)}>Quitar</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
          <Input placeholder="Nombre del cliente *" value={nombre} maxLength={150}
                 onChange={(e) => setNombre(e.target.value)} />
          <Input placeholder="Dirección de entrega" value={direccion} maxLength={250}
                 onChange={(e) => setDireccion(e.target.value)} />
          <Input placeholder="Teléfono" value={telefono} maxLength={30}
                 onChange={(e) => setTelefono(e.target.value)} />
        </div>
        <Button type="primary" style={{ marginTop: 12 }} loading={cotizando} onClick={hacerCotizacion}>
          Cotizar pedido
        </Button>
      </div>

      {/* Cotizaciones  */}
      <div className="card">
        {cargando ? (
          <div style={{ padding: 60, textAlign: "center" }}><Spin /></div>
        ) : visibles.length === 0 ? (
          <div className="empty">
            <b>Sin cotizaciones</b>
            Todavía no se ha cotizado ninguna entrega.
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Sucursal</th>
                  <th className="num">Total</th>
                  <th>Pago</th>
                  <th className="num">Tiempo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                 {visibles.map((c) => ( 
                  <tr key={c.cotizacionId} onClick={() => abrirVista(c.cotizacionId)} style={{ cursor: "pointer" }}>
                    <td>{c.cotizacionId}</td>
                    <td>{c.clienteNombre ?? c.clienteRef ?? "—"}</td>
                    <td>{cat.sucursal(c.sucursalAsignadaId)}</td>
                    <td className="num">{Q(c.total ?? c.precio)}</td>
                    <td>{c.formaPago ?? "—"}</td>
                    <td className="num">{c.tiempoEstimadoMin != null ? c.tiempoEstimadoMin + " min" : "—"}</td>
                    <td><Tag color={COLOR[c.estado] ?? "default"}>{c.estado}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/*  Modal de la cotizacion */}
      <Modal
        open={vista != null}
        onCancel={() => setVista(null)}
        width={640}
        title={vista ? "Cotización " + vista.cotizacionId : ""}
        footer={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button icon={<PictureOutlined />} onClick={guardarImagen}>Guardar imagen</Button>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>Imprimir</Button>
            {vista?.estado === "PENDIENTE" && (
              <>
                <Button danger onClick={cancelar}>Cancelar cotización</Button>
                <Button type="primary" loading={accionando} onClick={confirmar}>Confirmar</Button>
              </>
            )}
            {vista?.estado !== "PENDIENTE" && <Button onClick={() => setVista(null)}>Cerrar</Button>}
          </div>
        }
      >
        {vista && (
          <>
            {vista.estado === "PENDIENTE" && esNueva && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ margin: "0 0 4px" }}><b>Forma de pago</b></p>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Elige cómo pagará el cliente"
                  value={formaSel}
                  onChange={setFormaSel}
                  options={formas.map((f) => ({ value: f, label: f }))}
                />
              </div>
            )}
            <div ref={hojaRef} style={{ border: "1px solid #ddd" }}>
              <Comprobante
                v={vista}
                sucursal={cat.sucursal(vista.sucursalAsignadaId)}
                forma={formaMostrada}
                producto={cat.producto}
              />
            </div>
          </>
        )}
      </Modal>

      {/* Hoja que sale en papel: oculta en pantalla, visible solo al imprimir */}
      {vista && (
        <div className="factura-print">
          <Comprobante
            v={vista}
            sucursal={cat.sucursal(vista.sucursalAsignadaId)}
            forma={formaMostrada}
            producto={cat.producto}
          />
        </div>
      )}
    </>
  );
}