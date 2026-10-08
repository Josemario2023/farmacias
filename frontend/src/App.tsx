import { ConfigProvider, App as AntApp } from "antd";
import esES from "antd/locale/es_ES";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { antdTheme } from "./styles/antdTheme";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { PosPage } from "./pages/PosPage";
import { KardexPage } from "./pages/KardexPage";
import { InventarioPage } from "./pages/InventarioPage";
import { PanelPage } from "./pages/PanelPage";
import { CajaPage } from "./pages/CajaPage";
import { AuditoriaPage } from "./pages/AuditoriaPage";
import { CatalogosProvider } from "../src/hoocks/useCatalogos";
import { SesionProvider } from "./hoocks/useSesion";
import { AdminPage } from "./pages/AdminPage";
import { FacturacionPage } from "./pages/FacturacionPage";
import { TrasladosPage } from "./pages/TrasladosPage";
import { EntregasPage } from "./pages/EntregasPage";
import { ActivosPage } from "./pages/ActivosPage";

function App() {
  return (
    <ConfigProvider theme={antdTheme} locale={esES}>
  <AntApp>
    <BrowserRouter>
      <SesionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <CatalogosProvider>
                <AppLayout />
              </CatalogosProvider>
            }
          >
            <Route path="/pos" element={<PosPage />} />
            <Route path="/kardex" element={<KardexPage />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/panel" element={<PanelPage />} />
            <Route path="/caja" element={<CajaPage />} />
            <Route path="/auditoria" element={<AuditoriaPage />} />
            <Route path="/usuarios" element={<AdminPage />} />
            <Route path="/facturacion" element={<FacturacionPage />} />
            <Route path="/traslados" element={<TrasladosPage />} />
            <Route path="/entregas" element={<EntregasPage />} />
            <Route path="/activos" element={<ActivosPage />} />

          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </SesionProvider>
    </BrowserRouter>
  </AntApp>
</ConfigProvider>
  );
}

export default App;