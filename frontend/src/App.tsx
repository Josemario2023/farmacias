import { ConfigProvider } from "antd";
import esES from "antd/locale/es_ES";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { antdTheme } from "./styles/antdTheme";
import { LoginPage } from "./pages/LoginPage";
import { PosPage } from "./pages/PosPage";

function App() {
  return (
    // ConfigProvider inyecta el tema y el idioma a TODA la app
    <ConfigProvider theme={antdTheme} locale={esES}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pos" element={<PosPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;