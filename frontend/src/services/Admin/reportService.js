import { AxiosInstance } from "../../api/axios";
import { API_ROUTES } from "../../constants/apiRoutes";

// Last 30 days: KPIs, daily series, status / payment breakdowns, top products, recent orders, low stock
export const getAdminDashboard = async () => {
    const response = await AxiosInstance.get(API_ROUTES.ADMIN_REPORTS.DASHBOARD);
    return response.data;
};

// filters: { period: "daily" | "weekly" | "monthly" | "yearly" | "custom", from?, to?, page, limit }
export const getSalesReport = async (filters) => {
    const response = await AxiosInstance.get(API_ROUTES.ADMIN_REPORTS.SALES, { params: filters });
    return response.data;
};

// Every row of the period, for the PDF: { period, from?, to? }
export const exportSalesReport = async (filters) => {
    const response = await AxiosInstance.get(API_ROUTES.ADMIN_REPORTS.SALES_EXPORT, { params: filters });
    return response.data;
};
