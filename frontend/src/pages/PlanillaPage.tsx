import { useEffect, useState } from "react";
import { Spin, Tag, message, Button, Modal, Input, Select, Tabs } from "antd";
import { obtenerEmpleados, crearEmpleado, desactivarEmpleado } from "../api/payroll.api";
import type { Empleado } from "../api/payroll.api";
import { useCatalogos } from "../hoocks/useCatalogos";
import { useSesion } from "../hoocks/useSesion";
import { useAlcance } from "../hoocks/useAlcance";
import { PlanillasTab } from "../components/planilla/PlanillasTab";
import "../styles/components.css";

export function PlanillaPage() {
  const cat = useCatalogos();
  const alc = useAlcance();
  const { sucursalActiva } = useSesion();

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [pestana, setPestana] = useState("empleados");
  const visibles = empleados.filter((e) => alc.dentro(e.sucursalId));
  const [cargando, setCargando] = useState(false);

  // modal empleado nuevo
  const [modalEmp, setModalEmp] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [puesto, setPuesto] = useState("");
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      setEmpleados(await obtenerEmpleados());
    } catch {
      message.error("No se pudieron cargar los empleados");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirModalEmp = () => {
    setCodigo(""); setNombre(""); setPuesto("");
    setSucursalId(sucursalActiva);
    setModalEmp(true);
  };

  const guardarEmpleado = async () => {
    if (!codigo.trim() || !nombre.trim() || sucursalId == null) {
      message.warning("Código, nombre y sucursal son obligatorios");
      return;
    }
    setGuardando(true);
    try {
      await crearEmpleado({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        puesto: puesto.trim() || undefined,
        sucursalId,
      });
      message.success("Empleado registrado");
      setModalEmp(false);
      cargar();
    } catch (e: any) {
      const m = e?.response?.data?.message;
      message.error(Array.isArray(m) ? m.join(", ") : m ?? "No se pudo registrar el empleado");
    } finally {
      setGuardando(false);
    }
  };

  const darDeBaja = (e: Empleado) => {
    Modal.confirm({
      title: "Dar de baja a " + e.nombre,
      content: "No se borra: queda inactivo y conserva su historial de pagos.",
      okText: "Dar de baja",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await desactivarEmpleado(e.empleadoId);
          message.success("Empleado dado de baja");
          cargar();
        } catch (err: any) {
          message.error(err?.response?.data?.message ?? "No se pudo dar de baja");
        }
      },
    });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Planilla</h2>
          <p>Empleados de las sucursales. No se borran: se dan de baja y conservan su historial de pagos.</p>
        </div>
         {pestana === "empleados" && (
          <Button type="primary" onClick={abrirModalEmp}>Registrar empleado</Button>
        )}
      </div>
     <Tabs
        activeKey={pestana}
        onChange={setPestana}
        items={[
          { key: "empleados", label: "Empleados" },
          { key: "planillas", label: "Planillas" },
        ]}
      />

      {pestana === "empleados" ? (
      <div className="card">
        {cargando ? (
          <div style={{ padding: 60, textAlign: "center" }}><Spin /></div>
        ) : visibles.length === 0 ? (
          <div className="empty">
            <b>Sin empleados</b>
            Registra el primero con el botón "Registrar empleado".
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Puesto</th>
                  <th>Sucursal</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((e) => (
                  <tr key={e.empleadoId}>
                    <td><b>{e.codigo}</b></td>
                    <td>{e.nombre}</td>
                    <td>{e.puesto ?? "—"}</td>
                    <td>{cat.sucursal(e.sucursalId)}</td>
                    <td>
                      <Tag color={e.activo === 1 ? "green" : "red"}>
                        {e.activo === 1 ? "ACTIVO" : "BAJA"}
                      </Tag>
                    </td>
                    <td>
                      {e.activo === 1 && (
                        <Button size="small" danger onClick={() => darDeBaja(e)}>Dar de baja</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      ) : (
        <PlanillasTab empleados={empleados} />
      )}

      <Modal
        open={modalEmp}
        title="Registrar empleado"
        onCancel={() => setModalEmp(false)}
        onOk={guardarEmpleado}
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={guardando}
      >
        <p>Código</p>
        <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} maxLength={30} />
        <p style={{ marginTop: 12 }}>Nombre</p>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={150} />
        <p style={{ marginTop: 12 }}>Puesto (opcional)</p>
        <Input value={puesto} onChange={(e) => setPuesto(e.target.value)} maxLength={80} />
        <p style={{ marginTop: 12 }}>Sucursal</p>
        <Select
          style={{ width: "100%" }}
          value={sucursalId}
          onChange={setSucursalId}
          placeholder="Elige una sucursal"
          options={alc.permitidas}
        />
      </Modal>
    </>
  );
}