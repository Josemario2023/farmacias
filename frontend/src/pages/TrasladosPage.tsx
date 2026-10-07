import { useEffect, useState } from "react";
import { Spin, Tag, message, Drawer, Button, Modal, InputNumber } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  obtenerTraslados, obtenerTraslado, autorizarTraslado,
  enviarTraslado, recibirTraslado, anularTraslado,
} from "../api/traslados.api";
import type { Traslado, TrasladoDetalle, EstadoTraslado } from "../api/traslados.api";
import { SolicitarTrasladoModal } from "../components/traslados/SolicitarTrasladoModal";
import { useCatalogos } from "../hoocks/useCatalogos";
import { useSesion } from "../hoocks/useSesion";
import "../styles/components.css";

const COLOR: Record<EstadoTraslado, string> = {
  SOLICITADO: "blue",
  AUTORIZADO: "cyan",
  ENVIADO: "orange",
  RECIBIDO: "green",
  ANULADO: "red",
};

export function TrasladosPage() {
  const cat = useCatalogos();
  const { usuario, puede } = useSesion();
  const puedeGestionar = puede("TRASLADO_AUTORIZAR");

  const [traslados, setTraslados] = useState<Traslado[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modalSolicitar, setModalSolicitar] = useState(false);

  const [detalle, setDetalle] = useState<TrasladoDetalle | null>(null);
  const [abriendo, setAbriendo] = useState(false);
  // Cantidades que el usuario escribe al enviar o recibir: { trasladoDetalleId: cantidad }
  const [cantidades, setCantidades] = useState<Record<number, number>>({});

  const cargar = async () => {
    setCargando(true);
    try {
      setTraslados(await obtenerTraslados());
    } catch {
      message.error("No se pudieron cargar los traslados");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirDetalle = async (t: Traslado) => {
    setAbriendo(true);
    try {
      const d = await obtenerTraslado(t.trasladoId);
      // Valores por defecto: al enviar, lo solicitado; al recibir, lo enviado
      const inicial: Record<number, number> = {};
      d.lineas.forEach((l) => {
        if (d.estado === "AUTORIZADO") inicial[l.trasladoDetalleId] = Number(l.cantSolicitada);
        if (d.estado === "ENVIADO") inicial[l.trasladoDetalleId] = Number(l.cantEnviada ?? 0);
      });
      setCantidades(inicial);
      setDetalle(d);
    } catch {
      message.error("No se pudo cargar el traslado");
    } finally {
      setAbriendo(false);
    }
  };

  // Ejecuta una acción, avisa el resultado y refresca todo
  const ejecutar = async (accion: () => Promise<any>, textoOk: string) => {
    try {
      const r = await accion();
      if (r && Array.isArray(r.diferencias)) {
        message.warning("Recibido con diferencias entre lo enviado y lo recibido");
      } else {
        message.success(textoOk);
      }
      setDetalle(null);
      cargar();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "No se pudo completar la acción");
    }
  };

  const autorizar = () => {
    if (!detalle) return;
    Modal.confirm({
      title: "Autorizar traslado " + detalle.numero,
      content: "Después de autorizarlo, el origen podrá enviarlo.",
      okText: "Autorizar",
      cancelText: "Cancelar",
      onOk: () => ejecutar(() => autorizarTraslado(detalle.trasladoId, usuario!.usuarioId), "Traslado autorizado"),
    });
  };

  const enviar = () => {
    if (!detalle) return;
    Modal.confirm({
      title: "Enviar traslado " + detalle.numero,
      content: "El stock saldrá de " + cat.sucursal(detalle.sucursalOrigenId) + " ahora mismo.",
      okText: "Enviar",
      cancelText: "Cancelar",
      onOk: () =>
        ejecutar(
          () =>
            enviarTraslado(detalle.trasladoId, {
              usuarioId: usuario!.usuarioId,
              lineas: detalle.lineas.map((l) => ({
                trasladoDetalleId: l.trasladoDetalleId,
                cantEnviada: cantidades[l.trasladoDetalleId] ?? 0,
              })),
            }),
          "Traslado enviado. Stock descontado del origen.",
        ),
    });
  };

  const recibir = () => {
    if (!detalle) return;
    Modal.confirm({
      title: "Recibir traslado " + detalle.numero,
      content: "El stock entrará a " + cat.sucursal(detalle.sucursalDestinoId) + " con las cantidades que indicaste.",
      okText: "Recibir",
      cancelText: "Cancelar",
      onOk: () =>
        ejecutar(
          () =>
            recibirTraslado(detalle.trasladoId, {
              usuarioId: usuario!.usuarioId,
              lineas: detalle.lineas.map((l) => ({
                trasladoDetalleId: l.trasladoDetalleId,
                cantRecibida: cantidades[l.trasladoDetalleId] ?? 0,
              })),
            }),
          "Traslado recibido. Stock ingresado al destino.",
        ),
    });
  };

  const anular = () => {
    if (!detalle) return;
    Modal.confirm({
      title: "Anular traslado " + detalle.numero,
      content: "Queda ANULADO y no se mueve stock. No se puede deshacer.",
      okText: "Anular",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: () => ejecutar(() => anularTraslado(detalle.trasladoId), "Traslado anulado"),
    });
  };

  const editandoEnvio = detalle?.estado === "AUTORIZADO";
  const editandoRecepcion = detalle?.estado === "ENVIADO";

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Traslados</h2>
          <p>Movimiento de mercadería entre sucursales: solicitud, autorización, envío y recepción.</p>
        </div>
        {puedeGestionar && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalSolicitar(true)}>
            Solicitar traslado
          </Button>
        )}
      </div>

      <div className="card">
        {cargando ? (
          <div style={{ padding: 60, textAlign: "center" }}><Spin /></div>
        ) : traslados.length === 0 ? (
          <div className="empty">
            <b>Sin traslados</b>
            Todavía no se ha solicitado ningún traslado.
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Solicitó</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {traslados.map((t) => (
                  <tr key={t.trasladoId} onClick={() => abrirDetalle(t)} style={{ cursor: "pointer" }}>
                    <td><b>{t.numero}</b></td>
                    <td>{cat.sucursal(t.sucursalOrigenId)}</td>
                    <td>{cat.sucursal(t.sucursalDestinoId)}</td>
                    <td>{cat.usuario(t.solicitadoPor)}</td>
                    <td>{dayjs(t.fecha).format("DD/MM/YYYY HH:mm")}</td>
                    <td><Tag color={COLOR[t.estado]}>{t.estado}</Tag></td>
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
        size={640}
        title={detalle ? "Traslado " + detalle.numero : ""}
        loading={abriendo}
      >
        {detalle && (
          <>
            <p><b>Estado:</b> <Tag color={COLOR[detalle.estado]}>{detalle.estado}</Tag></p>
            <p><b>Origen:</b> {cat.sucursal(detalle.sucursalOrigenId)}</p>
            <p><b>Destino:</b> {cat.sucursal(detalle.sucursalDestinoId)}</p>
            <p><b>Solicitó:</b> {cat.usuario(detalle.solicitadoPor)}</p>
            {detalle.autorizadoPor != null && <p><b>Autorizó:</b> {cat.usuario(detalle.autorizadoPor)}</p>}
            {detalle.recibidoPor != null && <p><b>Recibió:</b> {cat.usuario(detalle.recibidoPor)}</p>}

            <table className="tbl" style={{ width: "100%", marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Lote</th>
                  <th className="num">Solicitada</th>
                  <th className="num">Enviada</th>
                  <th className="num">Recibida</th>
                </tr>
              </thead>
              <tbody>
                {detalle.lineas.map((l) => (
                  <tr key={l.trasladoDetalleId}>
                    <td>{cat.producto(l.productoId)}</td>
                    <td>{cat.lote(l.loteId)}</td>
                    <td className="num">{Number(l.cantSolicitada)}</td>
                    <td className="num">
                      {editandoEnvio && puedeGestionar ? (
                        <InputNumber
                          size="small"
                          min={0}
                          max={Number(l.cantSolicitada)}
                          value={cantidades[l.trasladoDetalleId]}
                          onChange={(v) => setCantidades({ ...cantidades, [l.trasladoDetalleId]: v ?? 0 })}
                          style={{ width: 80 }}
                        />
                      ) : (
                        l.cantEnviada ?? "—"
                      )}
                    </td>
                    <td className="num">
                      {editandoRecepcion && puedeGestionar ? (
                        <InputNumber
                          size="small"
                          min={0}
                          value={cantidades[l.trasladoDetalleId]}
                          onChange={(v) => setCantidades({ ...cantidades, [l.trasladoDetalleId]: v ?? 0 })}
                          style={{ width: 80 }}
                        />
                      ) : (
                        l.cantRecibida ?? "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {puedeGestionar && (
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                {detalle.estado === "SOLICITADO" && (
                  <Button type="primary" onClick={autorizar}>Autorizar</Button>
                )}
                {detalle.estado === "AUTORIZADO" && (
                  <Button type="primary" onClick={enviar}>Enviar</Button>
                )}
                {detalle.estado === "ENVIADO" && (
                  <Button type="primary" onClick={recibir}>Recibir</Button>
                )}
                {(detalle.estado === "SOLICITADO" || detalle.estado === "AUTORIZADO") && (
                  <Button danger onClick={anular}>Anular</Button>
                )}
              </div>
            )}
          </>
        )}
      </Drawer>

      <SolicitarTrasladoModal
        abierto={modalSolicitar}
        onCerrar={() => setModalSolicitar(false)}
        onListo={cargar}
      />
    </>
  );
}