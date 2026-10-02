import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, blockUser, unblockUser, getAllProducts, createProduct, updateProductStatus, updateVariant } from "../../services/AdminService";

export const useGetAllUsers = (page = 1, limit = 10, search = '') => {
    return useQuery({
        queryKey: ["admin_users", page, limit, search],
        queryFn: () => getAllUsers(page, limit, search),
        keepPreviousData: true,
    });
};

export const useBlockUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: blockUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_users"] });
        },
    });
};

export const useUnblockUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: unblockUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_users"] });
        },
    });
};

// --- Products ---

export const useGetAllProducts = (page = 1, limit = 10, search = '') => {
    return useQuery({
        queryKey: ["admin_products", page, limit, search],
        queryFn: () => getAllProducts(page, limit, search),
        keepPreviousData: true,
    });
};

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_products"] });
        },
    });
};

export const useUpdateProductStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, isActive }) => updateProductStatus(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_products"] });
        },
    });
};

export const useUpdateVariant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, variantId, formData }) => updateVariant(id, variantId, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_products"] });
        },
    });
};
