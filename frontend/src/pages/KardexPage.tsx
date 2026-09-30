import { useEffect, useState } from "react";
import { Select, DatePicker, Input, Button, Spin, message } from "antd";
import dayjs from "dayjs";
import { obtenerKardex, obtenerProductos } from "../api/inventory.api";
import type { Movimiento, Producto, FiltrosKardex } from "../api/inventory.api";
import { TipoMovimiento, LISTA_TIPOS, etiquetaTipo } from "../components/ui/TipoMovimiento";
import "../styles/components.css";

export function KardexPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(false);

  // Los 8 filtros del requisito
  const [filtros, setFiltros] = useState<FiltrosKardex>({});

  // Al abrir la pantalla: cargar el catálogo y el kardex completo
  useEffect(() => {
    obtenerProductos()
      .then(setProductos)
      .catch(() => message.error("No se pudo cargar el catálogo de productos"));
    consultar({});
  }, []);

  const consultar = async (f: FiltrosKardex) => {
    setCargando(true);
    try {
      const datos = await obtenerKardex(f);
      setMovimientos(datos);
    } catch {
      message.error("No se pudo consultar el kardex");
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => consultar(filtros);

  const limpiar = () => {
    setFiltros({});
    consultar({});
  };

  // Formatea la fecha para mostrar
  const fmtFecha = (iso: string) => dayjs(iso).format("DD/MM/YYYY HH:mm");

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Kardex</h2>
          <p>Historial completo de movimientos de inventario. Cada línea muestra el saldo resultante.</p>
        </div>
      </div>

      <div className="card">
        {/* ---------- FILTROS ---------- */}
        <div className="toolbar">
          <div className="f" style={{ minWidth: 220 }}>
            <label>Producto</label>
            <Select
              allowClear
              showSearch
              placeholder="Todos"
              optionFilterProp="label"
              style={{ width: "100%" }}
              value={filtros.productoId}
              onChange={(v) => setFiltros({ ...filtros, productoId: v })}
              options={productos.map((p) => ({
                value: p.productoId,
                label: p.codigo + " · " + p.nombre,
              }))}
            />
          </div>

          <div className="f" style={{ minWidth: 150 }}>
            <label>Número de lote</label>
            <Input
              allowClear
              placeholder="Ej. ACE-2026-A"
              value={filtros.numeroLote}
              onChange={(e) => setFiltros({ ...filtros, numeroLote: e.target.value })}
            />
          </div>

          <div className="f" style={{ minWidth: 190 }}>
            <label>Tipo de movimiento</label>
            <Select
              allowClear
              placeholder="Todos"
              style={{ width: "100%" }}
              value={filtros.tipoMovimiento}
              onChange={(v) => setFiltros({ ...filtros, tipoMovimiento: v })}
              options={LISTA_TIPOS.map((t) => ({ value: t, label: etiquetaTipo(t) }))}
            />
          </div>

          <div className="f" style={{ minWidth: 120 }}>
            <label>Sucursal</label>
            <Select
              allowClear
              placeholder="Todas"
              style={{ width: "100%" }}
              value={filtros.sucursalId}
              onChange={(v) => setFiltros({ ...filtros, sucursalId: v })}
              options={[
                { value: 1, label: "Sucursal 1" },
                { value: 2, label: "Sucursal 2" },
              ]}
            />
          </div>

          <div className="f" style={{ minWidth: 120 }}>
            <label>Usuario</label>
            <Input
              allowClear
              type="number"
              placeholder="ID"
              value={filtros.usuarioId}
              onChange={(e) =>
                setFiltros({ ...filtros, usuarioId: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>

          <div className="f">
            <label>Desde</label>
            <DatePicker
              format="DD/MM/YYYY"
              value={filtros.fechaInicio ? dayjs(filtros.fechaInicio) : null}
              onChange={(d) =>
                setFiltros({ ...filtros, fechaInicio: d ? d.format("YYYY-MM-DD") : undefined })
              }
            />
          </div>

          <div className="f">
            <label>Hasta</label>
            <DatePicker
              format="DD/MM/YYYY"
              value={filtros.fechaFin ? dayjs(filtros.fechaFin) : null}
              onChange={(d) =>
                setFiltros({ ...filtros, fechaFin: d ? d.format("YYYY-MM-DD") : undefined })
              }
            />
          </div>

          <div className="f">
            <label>&nbsp;</label>
            <div style={{ display: "flex", gap: 8 }}>
              <Button type="primary" onClick={aplicarFiltros}>Filtrar</Button>
              <Button onClick={limpiar}>Limpiar</Button>
            </div>
          </div>
        </div>

        {/* ---------- TABLA ---------- */}
        {cargando ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Spin />
          </div>
        ) : movimientos.length === 0 ? (
          <div className="empty">
            <b>Sin movimientos</b>
            No hay registros que coincidan con los filtros aplicados.
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Movimiento</th>
                  <th>Lote</th>
                  <th className="num">Stock anterior</th>
                  <th className="num">Entrada</th>
                  <th className="num">Salida</th>
                  <th className="num">Stock nuevo</th>
                  <th>Documento</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.movimientoId}>
                    <td>
                      {fmtFecha(m.fechaHora)}
                      <br />
                      <small className="muted">Suc. {m.sucursalId}</small>
                    </td>
                    <td>
                      <TipoMovimiento tipo={m.tipoMovimiento} />
                      {m.observaciones && (
                        <>
                          <br />
                          <small className="muted">{m.observaciones}</small>
                        </>
                      )}
                    </td>
                    <td>
                      {m.numeroLote}
                      <br />
                      <small className="muted">
                        Vence {dayjs(m.fechaVencimiento).format("DD/MM/YYYY")}
                      </small>
                    </td>
                    <td className="num">{Number(m.stockAnterior)}</td>
                    <td className="num">
                      {Number(m.entrada) > 0 ? (
                        <span className="delta-pos">+{Number(m.entrada)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="num">
                      {Number(m.salida) > 0 ? (
                        <span className="delta-neg">−{Number(m.salida)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="num">
                      <b>{Number(m.stockNuevo)}</b>
                    </td>
                    <td>{m.documentoRef ?? "—"}</td>
                    <td>{m.usuarioId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}