import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { exportSalesReport, getAdminDashboard, getSalesReport } from "../../services/Admin/reportService";

export const useGetAdminDashboard = () =>
    useQuery({ queryKey: ["admin_dashboard"], queryFn: getAdminDashboard, staleTime: 60 * 1000 });

// filters: { period, from?, to?, page, limit }
export const useGetSalesReport = (filters, { enabled = true } = {}) =>
    useQuery({
        queryKey: ["admin_sales_report", filters],
        queryFn: () => getSalesReport(filters),
        placeholderData: keepPreviousData,
        enabled,
    });

// Fetched on demand (PDF download), never cached
export const useExportSalesReport = () => useMutation({ mutationFn: exportSalesReport });
