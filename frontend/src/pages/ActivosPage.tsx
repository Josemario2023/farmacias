import { useEffect, useState } from "react";
import { Spin, Tag, message, Button, Modal, Input, InputNumber, Select, Drawer } from "antd";
import {
  obtenerActivos, obtenerActivo, crearActivo, darDeBajaActivo,
  obtenerCategoriasActivo, crearCategoriaActivo, calcularDepreciacion,
} from "../api/assets.api";
import type { Activo, ActivoDetalle, CategoriaActivo, ResultadoDepreciacion } from "../api/assets.api";
import { useCatalogos } from "../hoocks/useCatalogos";
import "../styles/components.css";
import { useAlcance } from "../hoocks/useAlcance";

const Q = (n: number) => "Q " + Number(n).toFixed(2);

export function ActivosPage() {
  const cat = useCatalogos();
  const alc = useAlcance();
  const [activos, setActivos] = useState<Activo[]>([]);
  const visibles = activos.filter((a) => alc.dentro(a.sucursalId));
  const [categorias, setCategorias] = useState<CategoriaActivo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string | undefined>(undefined);

  // detalle
  const [detalle, setDetalle] = useState<ActivoDetalle | null>(null);
  const [abriendo, setAbriendo] = useState(false);

  // modal activo nuevo
  const [modalActivo, setModalActivo] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [valor, setValor] = useState<number | null>(null);
  const [fecha, setFecha] = useState("");
  const [guardando, setGuardando] = useState(false);

  // modal categoria nueva
  const [modalCat, setModalCat] = useState(false);
  const [catNombre, setCatNombre] = useState("");
  const [catVida, setCatVida] = useState<number | null>(null);
  const [catMetodo, setCatMetodo] = useState("LINEA_RECTA");
  const [catTasa, setCatTasa] = useState<number | null>(null);

  // modal depreciacion
  const [modalDep, setModalDep] = useState(false);
  const [periodo, setPeriodo] = useState("");
  const [calculando, setCalculando] = useState(false);
  const [resultadoDep, setResultadoDep] = useState<ResultadoDepreciacion | null>(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const [a, c] = await Promise.all([obtenerActivos(undefined, filtroEstado), obtenerCategoriasActivo()]);
      setActivos(a);
      setCategorias(c);
    } catch {
      message.error("No se pudieron cargar los activos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [filtroEstado]);

  const nombreCategoria = (id: number) =>
    categorias.find((c) => c.categoriaActivoId === id)?.nombre ?? "Categoría " + id;

  //  detalle 
  const abrirDetalle = async (a: Activo) => {
    setAbriendo(true);
    setDetalle({ ...a, valorActual: a.valorAdquisicion, depreciaciones: [] });
    try {
      setDetalle(await obtenerActivo(a.activoId));
    } catch {
      message.error("No se pudo cargar el detalle del activo");
      setDetalle(null);
    } finally {
      setAbriendo(false);
    }
  };

  const darDeBaja = () => {
    if (!detalle) return;
    Modal.confirm({
      title: "Dar de baja " + detalle.codigo,
      content: "El activo no se borra: queda en BAJA, conserva su historial y deja de depreciarse.",
      okText: "Dar de baja",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await darDeBajaActivo(detalle.activoId);
          message.success("Activo dado de baja");
          setDetalle(null);
          cargar();
        } catch (e: any) {
          message.error(e?.response?.data?.message ?? "No se pudo dar de baja");
        }
      },
    });
  };

  //  activo nuevo 
  const abrirModalActivo = () => {
    setCodigo(""); setNombre(""); setCategoriaId(null);
    setSucursalId(null); setValor(null); setFecha("");
    setModalActivo(true);
  };

  const guardarActivo = async () => {
    if (!codigo.trim() || !nombre.trim() || categoriaId == null || sucursalId == null || valor == null || !fecha) {
      message.warning("Completa todos los campos");
      return;
    }
    setGuardando(true);
    try {
      await crearActivo({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        categoriaActivoId: categoriaId,
        sucursalId,
        valorAdquisicion: valor,
        fechaAdquisicion: fecha,
      });
      message.success("Activo registrado");
      setModalActivo(false);
      cargar();
    } catch (e: any) {
      const m = e?.response?.data?.message;
      message.error(Array.isArray(m) ? m.join(", ") : m ?? "No se pudo registrar el activo");
    } finally {
      setGuardando(false);
    }
  };

  //  categoria nueva
  const abrirModalCat = () => {
    setCatNombre(""); setCatVida(null); setCatMetodo("LINEA_RECTA"); setCatTasa(null);
    setModalCat(true);
  };

  const guardarCategoria = async () => {
    if (!catNombre.trim() || catVida == null) {
      message.warning("Nombre y vida útil son obligatorios");
      return;
    }
    if (catMetodo === "SALDO_DECRECIENTE" && !catTasa) {
      message.warning("El saldo decreciente requiere la tasa anual");
      return;
    }
    try {
      await crearCategoriaActivo({
        nombre: catNombre.trim(),
        vidaUtilMeses: catVida,
        metodoDepreciacion: catMetodo,
        tasaAnual: catMetodo === "SALDO_DECRECIENTE" ? catTasa! : undefined,
      });
      message.success("Categoría creada");
      setModalCat(false);
      cargar();
    } catch (e: any) {
      const m = e?.response?.data?.message;
      message.error(Array.isArray(m) ? m.join(", ") : m ?? "No se pudo crear la categoría");
    }
  };

  //  depreciacion 
  const abrirModalDep = () => {
    setPeriodo("");
    setResultadoDep(null);
    setModalDep(true);
  };

  const calcular = async () => {
    if (!periodo) {
      message.warning("Elige el periodo");
      return;
    }
    setCalculando(true);
    try {
      setResultadoDep(await calcularDepreciacion({ periodo }));
      cargar();
    } catch (e: any) {
      const m = e?.response?.data?.message;
      message.error(Array.isArray(m) ? m.join(", ") : m ?? "No se pudo calcular la depreciación");
    } finally {
      setCalculando(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Activos fijos</h2>
          <p>Equipo y mobiliario de las sucursales. No se borran: se dan de baja y conservan su historial.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={abrirModalCat}>Nueva categoría</Button>
          <Button onClick={abrirModalDep}>Calcular depreciación</Button>
          <Button type="primary" onClick={abrirModalActivo}>Registrar activo</Button>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Select
          allowClear
          placeholder="Todos los estados"
          style={{ width: 200 }}
          value={filtroEstado}
          onChange={(v) => setFiltroEstado(v)}
          options={[
            { value: "ACTIVO", label: "Activos" },
            { value: "BAJA", label: "De baja" },
          ]}
        />
      </div>

      <div className="card">
        {cargando ? (
          <div style={{ padding: 60, textAlign: "center" }}><Spin /></div>
        ) : visibles.length === 0 ? (
          <div className="empty">
            <b>Sin activos</b>
            Registra el primero con el botón "Registrar activo".
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Sucursal</th>
                  <th>Adquirido</th>
                  <th className="num">Valor</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                 {visibles.map((a) => (
                  <tr key={a.activoId} onClick={() => abrirDetalle(a)} style={{ cursor: "pointer" }}>
                    <td><b>{a.codigo}</b></td>
                    <td>{a.nombre}</td>
                    <td>{nombreCategoria(a.categoriaActivoId)}</td>
                    <td>{cat.sucursal(a.sucursalId)}</td>
                    <td>{String(a.fechaAdquisicion).slice(0, 10)}</td>
                    <td className="num">{Q(a.valorAdquisicion)}</td>
                    <td><Tag color={a.estado === "BAJA" ? "red" : "green"}>{a.estado}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/*  Detalle  */}
      <Drawer
        open={detalle != null}
        onClose={() => setDetalle(null)}
        size={520}
        title={detalle ? detalle.codigo + " · " + detalle.nombre : ""}
        loading={abriendo}
      >
        {detalle && (
          <>
            <p><b>Estado:</b> <Tag color={detalle.estado === "BAJA" ? "red" : "green"}>{detalle.estado}</Tag></p>
            <p><b>Categoría:</b> {nombreCategoria(detalle.categoriaActivoId)}</p>
            <p><b>Sucursal:</b> {cat.sucursal(detalle.sucursalId)}</p>
            <p><b>Valor de adquisición:</b> {Q(detalle.valorAdquisicion)}</p>
            <p><b>Valor actual en libros:</b> {Q(detalle.valorActual)}</p>

            <p style={{ marginTop: 16 }}><b>Historial de depreciación</b></p>
            {detalle.depreciaciones.length === 0 ? (
              <p style={{ color: "#888" }}>Todavía no se ha calculado ningún periodo.</p>
            ) : (
              <table className="tbl" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th className="num">Monto</th>
                    <th className="num">Acumulada</th>
                    <th className="num">En libros</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.depreciaciones.map((d) => (
                    <tr key={d.depreciacionId}>
                      <td>{d.periodo}</td>
                      <td className="num">{Q(d.monto)}</td>
                      <td className="num">{Q(d.depreciacionAcumulada)}</td>
                      <td className="num">{Q(d.valorLibros)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {detalle.estado !== "BAJA" && (
              <Button danger style={{ marginTop: 16 }} onClick={darDeBaja}>Dar de baja</Button>
            )}
          </>
        )}
      </Drawer>

      {/*  Modal activo  */}
      <Modal
        open={modalActivo}
        title="Registrar activo"
        onCancel={() => setModalActivo(false)}
        onOk={guardarActivo}
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={guardando}
      >
        <p>Código</p>
        <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} maxLength={30} />
        <p style={{ marginTop: 12 }}>Nombre</p>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={150} />
        <p style={{ marginTop: 12 }}>Categoría</p>
        <Select
          style={{ width: "100%" }}
          value={categoriaId}
          onChange={setCategoriaId}
          placeholder="Elige una categoría"
          options={categorias.map((c) => ({ value: c.categoriaActivoId, label: c.nombre }))}
        />
        <p style={{ marginTop: 12 }}>Sucursal</p>
        <Select
          style={{ width: "100%" }}
          value={sucursalId}
          onChange={setSucursalId}
          placeholder="Elige una sucursal"
          options={cat.listaSucursales}
        />
        <p style={{ marginTop: 12 }}>Valor de adquisición (Q)</p>
        <InputNumber min={0} value={valor} onChange={setValor} style={{ width: "100%" }} />
        <p style={{ marginTop: 12 }}>Fecha de adquisición</p>
        <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </Modal>

      {/*  Modal categoria  */}
      <Modal
        open={modalCat}
        title="Nueva categoría de activo"
        onCancel={() => setModalCat(false)}
        onOk={guardarCategoria}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <p>Nombre</p>
        <Input value={catNombre} onChange={(e) => setCatNombre(e.target.value)} maxLength={100} />
        <p style={{ marginTop: 12 }}>Vida útil (meses)</p>
        <InputNumber min={1} value={catVida} onChange={setCatVida} style={{ width: "100%" }} />
        <p style={{ marginTop: 12 }}>Método de depreciación</p>
        <Select
          style={{ width: "100%" }}
          value={catMetodo}
          onChange={setCatMetodo}
          options={[
            { value: "LINEA_RECTA", label: "Línea recta (mismo monto cada mes)" },
            { value: "SALDO_DECRECIENTE", label: "Saldo decreciente (% del valor restante)" },
          ]}
        />
        {catMetodo === "SALDO_DECRECIENTE" && (
          <>
            <p style={{ marginTop: 12 }}>Tasa anual (%)</p>
            <InputNumber min={0} value={catTasa} onChange={setCatTasa} style={{ width: "100%" }} />
          </>
        )}
      </Modal>

      {/*  Modal depreciacion  */}
      <Modal
        open={modalDep}
        title="Calcular depreciación"
        onCancel={() => setModalDep(false)}
        footer={
          resultadoDep ? (
            <Button type="primary" onClick={() => setModalDep(false)}>Cerrar</Button>
          ) : (
            <>
              <Button onClick={() => setModalDep(false)}>Cancelar</Button>
              <Button type="primary" loading={calculando} onClick={calcular}>Calcular</Button>
            </>
          )
        }
      >
        {!resultadoDep ? (
          <>
            <p>Periodo</p>
            <Input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
            <p style={{ color: "#888", marginTop: 8 }}>
              Se calcula para todos los activos vigentes. Si un activo ya tiene ese periodo, se omite.
            </p>
          </>
        ) : (
          <>
            <p><b>Periodo:</b> {resultadoDep.periodo}</p>
            <p><b>Activos procesados:</b> {resultadoDep.activosProcesados}</p>
            <p><b>Total depreciado:</b> {Q(resultadoDep.totalDepreciado)}</p>
            {resultadoDep.detalle.length > 0 && (
              <ul>
                {resultadoDep.detalle.map((d, i) => (
                  <li key={i}>{d.activo} · {Q(d.monto)} · en libros {Q(d.valorLibros)}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </Modal>
    </>
  );
}