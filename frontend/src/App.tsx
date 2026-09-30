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

function App() {
  return (
    <ConfigProvider theme={antdTheme} locale={esES}>
      <AntApp>
        <BrowserRouter>
        <Routes>
          {/* El login NO lleva layout: es pantalla completa */}
          <Route path="/login" element={<LoginPage />} />

          {/* Todo lo demás va DENTRO del layout */}
          <Route element={<AppLayout />}>
            <Route path="/pos" element={<PosPage />} />
            <Route path="/kardex" element={<KardexPage />} />
            
            <Route path="/inventario" element={<InventarioPage />} />
            
            <Route path="/panel" element={<PanelPage />} />  
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
      </AntApp>
      
    </ConfigProvider>
  );
}

export default App;