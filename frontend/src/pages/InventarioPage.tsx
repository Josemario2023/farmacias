import { useEffect, useState } from "react";
import { Tabs, Button, Table, Tag, Spin, message, Alert, Popconfirm, Space } from "antd";
import { PlusOutlined,EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  obtenerProductos, obtenerCategorias, obtenerLotes,
  obtenerExistencias, alertasBajoMinimo, alertasPorVencer,eliminarProducto,eliminarCategoria,eliminarLote
} from "../api/inventory.api";
import type { Producto, Categoria, Lote } from "../api/inventory.api";
import { MovimientoModal } from "../components/inventario/MovimientoModal";
import { CategoriaModal, ProductoModal, LoteModal } from "../components/inventario/CatalogoModales";
import "../styles/components.css";
import { SiPuede } from "../components/ui/Sipuede";
import { useCatalogos } from "../hoocks/useCatalogos";



export function InventarioPage() {
  const [cargando, setCargando] = useState(false);
  const cat = useCatalogos();


  // Datos
  const [existencias, setExistencias] = useState<any[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [prodEditar, setProdEditar] = useState<any>(null);
  const [catEditar, setCatEditar] = useState<any>(null);
  const [loteEditar, setLoteEditar] = useState<any>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [bajoMinimo, setBajoMinimo] = useState<any[]>([]);
  const [porVencer, setPorVencer] = useState<any[]>([]);

  // Modales
  const [modalMov, setModalMov] = useState(false);
  const [modalCat, setModalCat] = useState(false);
  const [modalProd, setModalProd] = useState(false);
  const [modalLote, setModalLote] = useState(false);

  const cargarTodo = async () => {
    setCargando(true);
    try {
      const [ex, pr, ca, lo, bm, pv] = await Promise.all([
        obtenerExistencias(),
        obtenerProductos(),
        obtenerCategorias(),
        obtenerLotes(),
        alertasBajoMinimo(),
        alertasPorVencer(90),
      ]);
      setExistencias(ex);
      setProductos(pr);
      setCategorias(ca);
      setLotes(lo);
      setBajoMinimo(bm);
      setPorVencer(pv);
    } catch {
      message.error("No se pudieron cargar los datos del inventario");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarTodo(); }, []);

  // Cruza la existencia con el nombre del producto y el lote
  const nombreProducto = (id: number) => {
    const p = productos.find((x) => x.productoId === id);
    return p ? p.codigo + " · " + p.nombre : "Producto " + id;
  };
  const nombreLote = (id: number) => {
    const l = lotes.find((x) => x.loteId === id);
    return l ? l.numeroLote : "Lote " + id;
  };

  //Pestaña EXISTENCIAS
  const tabExistencias = (
    <>
      {bajoMinimo.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 14 }}
          message={bajoMinimo.length + " producto(s) bajo el mínimo"}
          description={bajoMinimo
            .map((a) => a.nombre + " (hay " + a.stockActual + ", mínimo " + a.stockMinimo + ")")
            .join(" · ")}
        />
      )}
      {porVencer.length > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 14 }}
          message={porVencer.length + " lote(s) por vencer en los próximos 90 días"}
          description={porVencer
            .map((v) => v.nombre + " · lote " + v.numeroLote + " (" + v.diasRestantes + " días)")
            .join(" · ")}
        />
      )}

      <div className="card">
        <div className="card-h">
          <h3>Existencias actuales</h3>
          <span className="muted" style={{ fontSize: 13 }}>
            {existencias.length} registro(s)
          </span>
        </div>
        <Table
          rowKey="existenciaId"
          dataSource={existencias}
          pagination={{ pageSize: 12 }}
          size="middle"
          columns={[
            { title: "Sucursal", dataIndex: "sucursalId", width: 100,
              render: (v) => cat.sucursal(v) },
            { title: "Producto", dataIndex: "productoId",
              render: (v) => nombreProducto(v) },
            { title: "Lote", dataIndex: "loteId",
              render: (v) => nombreLote(v) },
            { title: "Cantidad", dataIndex: "cantidad", align: "right", width: 120,
              render: (v) => <b>{Number(v)}</b> },
          ]}
        />
      </div>
    </>
  );

  // Pestaña CATÁLOGO 
  const tabCatalogo = (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-h">
          <h3>Productos</h3>
          <SiPuede permiso="PRODUCTO_EDITAR">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalProd(true)}>
              Nuevo producto
            </Button>
          </SiPuede>
        </div>
        <Table
          rowKey="productoId"
          dataSource={productos}
          pagination={{ pageSize: 8 }}
          size="middle"
          columns={[
            { title: "Código", dataIndex: "codigo", width: 120 },
            { title: "Nombre", dataIndex: "nombre" },
            { title: "Categoría", dataIndex: "categoriaId", width: 150,
              render: (v) => categorias.find((c) => c.categoriaId === v)?.nombre ?? "—" },
            { title: "Precio", dataIndex: "precioBase", align: "right", width: 110,
              render: (v) => "Q " + Number(v).toFixed(2) },
            { title: "Receta", dataIndex: "requiereReceta", width: 90, align: "center",
              render: (v) => v === 1 ? <Tag color="orange">Sí</Tag> : <span className="muted">No</span> },
            { title: "Estado", dataIndex: "activo", width: 90,
              render: (v) => v === 1
                ? <Tag color="blue">Activo</Tag>
                : <Tag>Inactivo</Tag> },
                        { title: "Acciones", width: 120,
              render: (_, p: Producto) => (
                <SiPuede permiso="PRODUCTO_EDITAR">
                  <Space>
                    <Button size="small" icon={<EditOutlined />}
                      onClick={() => { setProdEditar(p); setModalProd(true); }} />
                    <Popconfirm title="¿Desactivar este producto?"
                      onConfirm={async () => {
                        try {
                          await eliminarProducto(p.productoId);
                          message.success("Producto desactivado");
                          cargarTodo();
                        } catch (e: any) {
                          message.error(e?.response?.data?.message ?? "No se pudo");
                        }
                      }}
                      okText="Sí" cancelText="No">
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                </SiPuede>
              ) },
            
          ]}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-h">
            <h3>Categorías</h3>
            <SiPuede permiso="PRODUCTO_EDITAR">
              <Button size="small" icon={<PlusOutlined />} onClick={() => setModalCat(true)}>
                Nueva
              </Button>
            </SiPuede>
          </div>
          <Table
            rowKey="categoriaId"
            dataSource={categorias}
            pagination={false}
            size="small"
            columns={[
              { title: "ID", dataIndex: "categoriaId", width: 60 },
              { title: "Nombre", dataIndex: "nombre" },
              { title: "", width: 90,
                render: (_, c: any) => (
                  <SiPuede permiso="PRODUCTO_EDITAR">
                    <Space>
                      <Button size="small" icon={<EditOutlined />}
                        onClick={() => { setCatEditar(c); setModalCat(true); }} />
                      <Popconfirm title="¿Eliminar esta categoría?"
                        onConfirm={async () => {
                          try {
                            await eliminarCategoria(c.categoriaId);
                            message.success("Categoría eliminada");
                            cargarTodo();
                          } catch (e: any) {
                            message.error(e?.response?.data?.message ?? "No se pudo eliminar");
                          }
                        }}
                        okText="Sí" cancelText="No">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </SiPuede>
                ) },
            ]}
          />
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Lotes</h3>
            <SiPuede permiso="PRODUCTO_EDITAR">
              <Button size="small" icon={<PlusOutlined />} onClick={() => setModalLote(true)}>
                Nuevo
              </Button>
            </SiPuede>
          </div>
          <Table
            rowKey="loteId"
            dataSource={lotes}
            pagination={{ pageSize: 6 }}
            size="small"
            columns={[
              { title: "Lote", dataIndex: "numeroLote" },
              { title: "Producto", dataIndex: "productoId",
                render: (v) => productos.find((p) => p.productoId === v)?.nombre ?? "—" },
              { title: "Vence", dataIndex: "fechaVencimiento", width: 110,
                render: (v) => dayjs(v).format("DD/MM/YYYY") },
              { title: "", width: 90,
                render: (_, l: any) => (
                  <SiPuede permiso="PRODUCTO_EDITAR">
                    <Space>
                      <Button size="small" icon={<EditOutlined />}
                        onClick={() => { setLoteEditar(l); setModalLote(true); }} />
                      <Popconfirm title="¿Eliminar este lote?"
                        description="Solo se puede si no tiene movimientos."
                        onConfirm={async () => {
                          try {
                            await eliminarLote(l.loteId);
                            message.success("Lote eliminado");
                            cargarTodo();
                          } catch (e: any) {
                            message.error(e?.response?.data?.message ?? "No se pudo eliminar");
                          }
                        }}
                        okText="Sí" cancelText="No">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </SiPuede>
                ) },
            ]}
          />
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Inventario</h2>
          <p>Catálogo, existencias y movimientos de stock por lote.</p>
        </div>
        <SiPuede permiso="INVENTARIO_MOVER">
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setModalMov(true)}>
            Registrar movimiento
          </Button>
        </SiPuede>
      </div>

      {cargando ? (
        <div style={{ padding: 60, textAlign: "center" }}><Spin /></div>
      ) : (
        <Tabs
          defaultActiveKey="existencias"
          items={[
            { key: "existencias", label: "Existencias", children: tabExistencias },
            { key: "catalogo", label: "Catálogo", children: tabCatalogo },
          ]}
        />
      )}

      {/* Modales */}
      <MovimientoModal abierto={modalMov} onCerrar={() => setModalMov(false)} onListo={cargarTodo} />
      <CategoriaModal abierto={modalCat}
        onCerrar={() => { setModalCat(false); setCatEditar(null); }}
        onListo={cargarTodo} editar={catEditar} />
      <ProductoModal abierto={modalProd}
        onCerrar={() => { setModalProd(false); setProdEditar(null); }}
        onListo={cargarTodo} editar={prodEditar} />
      <LoteModal abierto={modalLote}
        onCerrar={() => { setModalLote(false); setLoteEditar(null); }}
        onListo={cargarTodo} editar={loteEditar} />
    </>
  );
}