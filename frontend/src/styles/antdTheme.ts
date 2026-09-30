import { theme } from "antd";
import type { ThemeConfig } from "antd";


export const antdTheme: ThemeConfig = {
  
  algorithm: theme.darkAlgorithm,

  token: {
    colorPrimary: "#2FB488",
    colorLink: "#2FB488",
    colorSuccess: "#2FB488",
    colorWarning: "#C7841A",
    colorError: "#B42318",
    colorInfo: "#1E6FB8",

    colorBgBase: "#0C1512",
    colorBgContainer: "#12201C",
    colorTextBase: "#E7F0EC",
    colorBorder: "#22332E",
    colorBorderSecondary: "#1A2925",

    borderRadius: 8,
    borderRadiusLG: 12,
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
  },
  components: {
    Table: {
      headerBg: "#0C1512",
      headerColor: "#9FB3AB",
      rowHoverBg: "#1A2925",
      borderColor: "#22332E",
    },
    Button: { fontWeight: 500, primaryShadow: "none" },
  },
};