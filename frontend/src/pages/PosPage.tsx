import { useEffect, useState } from "react";
import { Input, Button, Select, InputNumber, message, Empty, Tag, Modal } from "antd";
import { SearchOutlined, DeleteOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { obtenerProductos, obtenerLotes, obtenerExistencias } from "../api/inventory.api";
import type { Producto, Lote } from "../api/inventory.api";
import { crearVenta } from "../api/pos.api";
import type { LineaVenta } from "../api/pos.api";
import "../styles/components.css";

interface ItemCarrito extends LineaVenta {
  numeroLote: string;
  disponible: number;
  requiereReceta: boolean;
}

export function PosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [existencias, setExistencias] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [formaPago, setFormaPago] = useState<"EFECTIVO" | "TARJETA" | "TRANSFERENCIA">("EFECTIVO");
  const [cobrando, setCobrando] = useState(false);

  const SUCURSAL = 1;   // TODO: tomarla del selector del topbar

  const cargar = async () => {
    try {
      const [p, l, e] = await Promise.all([
        obtenerProductos(),
        obtenerLotes(),
        obtenerExistencias(SUCURSAL),
      ]);
      setProductos(p.filter((x) => x.activo === 1));
      setLotes(l);
      setExistencias(e);
    } catch {
      message.error("No se pudo cargar el catálogo");
    }
  };

  useEffect(() => { cargar(); }, []);

  // Stock disponible de un producto en esta sucursal (suma de sus lotes)
  const stockDe = (productoId: number) =>
    existencias
      .filter((e) => e.productoId === productoId)
      .reduce((acc, e) => acc + Number(e.cantidad), 0);

  // El lote con más stock (para sugerirlo por defecto)
  const mejorLote = (productoId: number) => {
    const conStock = existencias
      .filter((e) => e.productoId === productoId && Number(e.cantidad) > 0)
      .sort((a, b) => Number(b.cantidad) - Number(a.cantidad));
    return conStock[0];
  };

  const resultados = busqueda.trim()
    ? productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.codigo.toLowerCase().includes(busqueda.toLowerCase()),
      )
    : [];

  const agregar = (p: Producto) => {
    const existencia = mejorLote(p.productoId);
    if (!existencia) {
      message.warning("Sin stock de " + p.nombre + " en esta sucursal");
      return;
    }

    // Si ya está en el carrito, sumar una unidad
    const yaEsta = carrito.find((c) => c.productoId === p.productoId && c.loteId === existencia.loteId);
    if (yaEsta) {
      if (yaEsta.cantidad + 1 > yaEsta.disponible) {
        message.warning("No hay más stock disponible de ese lote");
        return;
      }
      setCarrito(carrito.map((c) =>
        c === yaEsta ? { ...c, cantidad: c.cantidad + 1 } : c
      ));
    } else {
      const lote = lotes.find((l) => l.loteId === existencia.loteId);
      setCarrito([...carrito, {
        productoId: p.productoId,
        loteId: existencia.loteId,
        descripcion: p.nombre,
        cantidad: 1,
        precioUnitario: Number(p.precioBase),
        numeroLote: lote?.numeroLote ?? "—",
        disponible: Number(existencia.cantidad),
        requiereReceta: p.requiereReceta === 1,
      }]);
    }

    if (p.requiereReceta === 1) {
      message.warning(p.nombre + " requiere receta médica. Solicítala al cliente.");
    }
    setBusqueda("");
  };

  const cambiarCantidad = (idx: number, valor: number | null) => {
    const cant = valor ?? 1;
    const item = carrito[idx];
    if (cant > item.disponible) {
      message.warning("Solo hay " + item.disponible + " unidades de ese lote");
      return;
    }
    setCarrito(carrito.map((c, i) => (i === idx ? { ...c, cantidad: cant } : c)));
  };

  const quitar = (idx: number) => setCarrito(carrito.filter((_, i) => i !== idx));

  const total = carrito.reduce((acc, c) => acc + c.cantidad * c.precioUnitario, 0);

  const cobrar = async () => {
    if (carrito.length === 0) return;

    Modal.confirm({
      title: "Confirmar venta",
      content: "Total a cobrar: Q " + total.toFixed(2) + " · " + formaPago,
      okText: "Cobrar",
      cancelText: "Cancelar",
      onOk: async () => {
        setCobrando(true);
        try {
          const numero = "V-" + Date.now().toString().slice(-8);
          const venta = await crearVenta({
            numero,
            sucursalId: SUCURSAL,
            usuarioId: 1,
            regionId: 1,
            lineas: carrito.map((c) => ({
              productoId: c.productoId,
              loteId: c.loteId,
              descripcion: c.descripcion,
              cantidad: c.cantidad,
              precioUnitario: c.precioUnitario,
            })),
            pagos: [{ formaPago, monto: total }],
          });

          message.success("Venta " + venta.numero + " registrada. Stock descontado y factura emitida.");
          setCarrito([]);
          cargar();   // refrescar el stock
        } catch (e: any) {
          message.error(e?.response?.data?.message ?? "No se pudo registrar la venta");
        } finally {
          setCobrando(false);
        }
      },
    });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Punto de venta</h2>
          <p>Busca productos, arma el carrito y cobra. El stock se descuenta al confirmar.</p>
        </div>
      </div>

      <div className="pos-grid">
        {/* ---------- IZQUIERDA: búsqueda ---------- */}
        <div className="card">
          <div className="card-h">
            <h3>Buscar producto</h3>
          </div>

          <div style={{ padding: 14 }}>
            <Input
              size="large"
              prefix={<SearchOutlined />}
              placeholder="Nombre o código del producto…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              allowClear
              autoFocus
            />
          </div>

          {busqueda.trim() === "" ? (
            <div className="empty">
              <b>Escribe para buscar</b>
              Los productos con stock aparecerán aquí.
            </div>
          ) : resultados.length === 0 ? (
            <div className="empty">
              <b>Sin resultados</b>
              No hay productos que coincidan con "{busqueda}".
            </div>
          ) : (
            <div>
              {resultados.map((p) => {
                const stock = stockDe(p.productoId);
                return (
                  <div key={p.productoId} className="pos-result" onClick={() => agregar(p)}>
                    <div className="info">
                      <b>{p.nombre}</b>
                      <small>
                        {p.codigo} · Stock: {stock}
                        {p.requiereReceta === 1 && (
                          <Tag color="orange" style={{ marginLeft: 8 }}>Receta</Tag>
                        )}
                      </small>
                    </div>
                    <div className="precio">Q {Number(p.precioBase).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ---------- DERECHA: carrito ---------- */}
        <div className="card">
          <div className="card-h">
            <h3><ShoppingCartOutlined /> Carrito</h3>
            {carrito.length > 0 && (
              <a className="link" onClick={() => setCarrito([])}>Vaciar</a>
            )}
          </div>

          {carrito.length === 0 ? (
            <Empty
              description="El carrito está vacío"
              style={{ padding: 30 }}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <>
              <div>
                {carrito.map((c, i) => (
                  <div key={i} className="cart-item">
                    <div className="ci-info">
                      <b>{c.descripcion}</b>
                      <small>Lote {c.numeroLote} · Q {c.precioUnitario.toFixed(2)} c/u</small>
                      <div style={{ marginTop: 6 }}>
                        <InputNumber
                          size="small"
                          min={1}
                          max={c.disponible}
                          value={c.cantidad}
                          onChange={(v) => cambiarCantidad(i, v)}
                          style={{ width: 70 }}
                        />
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => quitar(i)}
                        />
                      </div>
                    </div>
                    <div className="ci-total">
                      Q {(c.cantidad * c.precioUnitario).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pos-total">
                <div className="row">
                  <span>Artículos</span>
                  <span>{carrito.reduce((a, c) => a + c.cantidad, 0)}</span>
                </div>
                <div className="row big">
                  <span>Total</span>
                  <span>Q {total.toFixed(2)}</span>
                </div>

                <Select
                  style={{ width: "100%", marginBottom: 12 }}
                  value={formaPago}
                  onChange={setFormaPago}
                  options={[
                    { value: "EFECTIVO", label: "Efectivo" },
                    { value: "TARJETA", label: "Tarjeta" },
                    { value: "TRANSFERENCIA", label: "Transferencia" },
                  ]}
                />

                <Button
                  type="primary"
                  size="large"
                  block
                  loading={cobrando}
                  onClick={cobrar}
                >
                  Cobrar Q {total.toFixed(2)}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}