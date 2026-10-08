import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Spin, Tag, message, Drawer,Button, Modal } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { obtenerFacturas, obtenerSeries, obtenerFactura, anularFactura } from "../api/billing.api";
import type { Factura, Serie, FacturaDetalle } from "../api/billing.api";
import { obtenerClientes } from "../api/pos.api";
import type { Cliente } from "../api/pos.api";
import { useCatalogos } from "../hoocks/useCatalogos";
import { useAlcance } from "../hoocks/useAlcance";
import "../styles/components.css";

const Q = (n: number) => "Q " + Number(n).toFixed(2);

export function FacturacionPage() {
  const cat = useCatalogos();
  const alc = useAlcance();
  const [params, setParams] = useSearchParams();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [cargando, setCargando] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [detalle, setDetalle] = useState<FacturaDetalle | null>(null);
  const [abriendo, setAbriendo] = useState(false);
  const visibles = facturas.filter((f) => alc.dentro(f.sucursalId));
  
  const cargar = async () => {
    setCargando(true);
    try {
      const [f, s] = await Promise.all([obtenerFacturas(), obtenerSeries()]);
      setFacturas(f);
      setSeries(s);
      obtenerClientes().then(setClientes).catch(() => setClientes([]));
    } catch {
      message.error("No se pudieron cargar las facturas");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => {
    const ventaId = Number(params.get("venta"));
    if (!ventaId) return;

    let cancelado = false;
    (async () => {
      for (let intento = 0; intento < 5 && !cancelado; intento++) {
        try {
          const lista = await obtenerFacturas();
          const f = lista.find((x) => x.ventaId === ventaId);
          if (f) {
            setFacturas(lista);
            setDetalle(await obtenerFactura(f.facturaId));
            setParams({}, { replace: true });   // limpia ?venta= para no reabrirla
            return;
          }
        } catch {
          // reintentamos
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      if (!cancelado) message.warning("La factura aún no está lista. Búscala en la lista en unos segundos.");
    })();

    return () => { cancelado = true; };
  }, [params]);

   const clienteDe = (f: Factura) =>
    f.clienteId == null ? null : clientes.find((c) => c.clienteId === f.clienteId) ?? null;

  const abrirDetalle = async (f: Factura) => {
    setAbriendo(true);
    try {
      setDetalle(await obtenerFactura(f.facturaId));
    } catch {
      message.error("No se pudo cargar el detalle de la factura");
    } finally {
      setAbriendo(false);
    }
  };

  const anular = () => {
    if (!detalle) return;
    Modal.confirm({
      title: "Anular factura " + numeroFactura(detalle),
      content: "La factura conserva su número pero queda ANULADA. No se puede deshacer.",
      okText: "Anular",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await anularFactura(detalle.facturaId);
          message.success("Factura anulada");
          setDetalle(null);
          cargar();
        } catch (e: any) {
          message.error(e?.response?.data?.message ?? "No se pudo anular la factura");
        }
      },
    });
  };

  // Muestra "A-000123": la serie + el número con ceros a la izquierda
  const numeroFactura = (f: Factura) => {
    const serie = series.find((s) => s.serieId === f.serieId)?.serie ?? "?";
    return serie + "-" + String(f.numero).padStart(6, "0");
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Facturación</h2>
          <p>Facturas emitidas. Las facturas no se borran: se anulan y conservan su número.</p>
        </div>
      </div>

      <div className="card">
        {cargando ? (
          <div style={{ padding: 60, textAlign: "center" }}><Spin /></div>
        ) : visibles.length === 0 ? (
          <div className="empty">
            <b>Sin facturas</b>
            Todavía no se ha emitido ninguna factura.
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Sucursal</th>
                  <th>Venta</th>
                  <th className="num">Subtotal</th>
                  <th className="num">IVA</th>
                  <th className="num">Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((f) => (
                   <tr key={f.facturaId} onClick={() => abrirDetalle(f)} style={{ cursor: "pointer" }}>
                    <td><b>{numeroFactura(f)}</b></td>
                    <td>{cat.sucursal(f.sucursalId)}</td>
                    <td>{f.ventaId ?? "—"}</td>
                    <td className="num">{Q(f.subtotal)}</td>
                    <td className="num">{Q(f.impuesto)}</td>
                    <td className="num"><b>{Q(f.total)}</b></td>
                    <td>
                      <Tag color={f.estado === "ANULADA" ? "red" : "green"}>{f.estado}</Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

        <Drawer
        open={detalle != null}
        onClose={() => setDetalle(null)}
        size={520}
        title={detalle ? "Factura " + numeroFactura(detalle) : ""}
        loading={abriendo}
        extra={
          <Button icon={<PrinterOutlined />} type="primary" onClick={() => window.print()}>
            Imprimir
          </Button>
        }
      >
        {detalle && (
          <>
            <p><b>Estado:</b> <Tag color={detalle.estado === "ANULADA" ? "red" : "green"}>{detalle.estado}</Tag></p>
            <p><b>Sucursal:</b> {cat.sucursal(detalle.sucursalId)}</p>
            <p>
              <b>Cliente:</b>{" "}
              {clienteDe(detalle)
                ? clienteDe(detalle)!.nombre + " · NIT " + clienteDe(detalle)!.identificacion
                : "Consumidor final"}
            </p>
            <table className="tbl" style={{ width: "100%" }}>
              <thead>
                <tr><th>Descripción</th><th className="num">Cant.</th><th className="num">P. unit.</th><th className="num">Total</th></tr>
              </thead>
              <tbody>
                {detalle.lineas.map((l) => (
                  <tr key={l.detalleId}>
                    <td>{l.descripcion}</td>
                    <td className="num">{l.cantidad}</td>
                    <td className="num">{Q(l.precioUnitario)}</td>
                    <td className="num">{Q(l.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ textAlign: "right", marginTop: 12 }}>
              Subtotal {Q(detalle.subtotal)}<br />
              IVA {Q(detalle.impuesto)}<br />
              <b>Total {Q(detalle.total)}</b>
            </p>
            {detalle.estado !== "ANULADA" && (
              <Button danger onClick={anular}>Anular factura</Button>
            )}
          </>
        )}
      </Drawer>
       {/* Hoja que sale en papel: oculta en pantalla, visible solo al imprimir */}
      {detalle && (
        <div className="factura-print">
          <h2 style={{ textAlign: "center", margin: 0 }}>Farmacias</h2>
          <p style={{ textAlign: "center" }}>{cat.sucursal(detalle.sucursalId)}</p>
          <h3>Factura {numeroFactura(detalle)} {detalle.estado === "ANULADA" ? "(ANULADA)" : ""}</h3>
          <p>
            Cliente:{" "}
            {clienteDe(detalle)
              ? clienteDe(detalle)!.nombre + " · NIT " + clienteDe(detalle)!.identificacion
              : "Consumidor final"}
            {clienteDe(detalle)?.direccion && <><br />Dirección: {clienteDe(detalle)!.direccion}</>}
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Descripción</th><th align="right">Cant.</th>
                <th align="right">P. unit.</th><th align="right">Total</th>
              </tr>
            </thead>
            <tbody>
              {detalle.lineas.map((l) => (
                <tr key={l.detalleId}>
                  <td>{l.descripcion}</td>
                  <td align="right">{l.cantidad}</td>
                  <td align="right">{Q(l.precioUnitario)}</td>
                  <td align="right">{Q(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ textAlign: "right" }}>
            Subtotal {Q(detalle.subtotal)}<br />
            IVA {Q(detalle.impuesto)}<br />
            <b>Total {Q(detalle.total)}</b>
          </p>
          <p style={{ textAlign: "center" }}>Gracias por su compra</p>
        </div>
      )}
    </>
  );
}