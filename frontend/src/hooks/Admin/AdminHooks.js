import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, blockUser, unblockUser } from "../../services/AdminService";

export const useGetAllUsers = () => {
    return useQuery({
        queryKey: ["admin_users"],
        queryFn: getAllUsers,
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
