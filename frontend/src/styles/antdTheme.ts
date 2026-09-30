import type { ThemeConfig } from "antd";

export const antdTheme: ThemeConfig = {
  // Sin darkAlgorithm: volvemos al tema claro
  token: {
    colorPrimary: "#1B5FA8",
    colorLink: "#1B5FA8",
    colorSuccess: "#1E8E5A",
    colorWarning: "#B8791A",
    colorError: "#C0392B",
    colorInfo: "#1B5FA8",

    colorBgBase: "#FFFFFF",
    colorBgContainer: "#FFFFFF",
    colorTextBase: "#14202E",
    colorBorder: "#DDE5EF",
    colorBorderSecondary: "#EBF0F6",

    borderRadius: 8,
    borderRadiusLG: 12,
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
  },
  components: {
    Table: {
      headerBg: "#F4F7FB",
      headerColor: "#5A6B80",
      rowHoverBg: "#EBF0F6",
      borderColor: "#DDE5EF",
    },
    Button: { fontWeight: 500, primaryShadow: "none" },
    Select: { optionSelectedBg: "#E8F0FA" },
  },
};