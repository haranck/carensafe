import { useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    createAddress,
    deleteAddress,
    getAddresses,
    setDefaultAddress,
    updateAddress,
} from "../../services/Address/addressService";
import { getErrorMessage } from "../../utils/errorMessage";

// Key carries the user id; mutations invalidate the ["addresses"] prefix
const addressesKey = (userId) => ["addresses", userId];

const useSession = () => {
    const isLoggedIn = useSelector((s) => Boolean(s.token.accessToken));
    const userId = useSelector((s) => s.auth.user?.id);
    return { isLoggedIn, userId };
};

const errorMessage = (error) => getErrorMessage(error, "Couldn't update your addresses. Please try again.");

const withList = (cached, update) => cached && { ...cached, data: update(cached.data) };

// Default first, then the rest in their current order
const withDefault = (addresses, id) => {
    const marked = addresses.map((address) => ({ ...address, isDefault: address._id === id }));
    return [...marked.filter((address) => address.isDefault), ...marked.filter((address) => !address.isDefault)];
};

const useInvalidateAddresses = () => {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: ["addresses"] });
};

// Applies `update` to the cached list at once; puts the old list back (and toasts) if the server says no.
// The server's answer (the new list) replaces the guess.
const useOptimisticList = (update) => {
    const queryClient = useQueryClient();
    const { userId } = useSession();
    return {
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: addressesKey(userId) });
            const previous = queryClient.getQueryData(addressesKey(userId));
            queryClient.setQueryData(addressesKey(userId), (cached) => withList(cached, (list) => update(list, id)));
            return { previous };
        },
        onError: (error, id, context) => {
            if (context?.previous) queryClient.setQueryData(addressesKey(userId), context.previous);
            toast.error(errorMessage(error), { id: `address-error-${id}` });
        },
        onSuccess: (response) => queryClient.setQueryData(addressesKey(userId), response),
    };
};

export const useGetAddresses = () => {
    const { isLoggedIn, userId } = useSession();
    return useQuery({ queryKey: addressesKey(userId), queryFn: getAddresses, enabled: isLoggedIn });
};

// Errors are shown inside the address form
export const useCreateAddress = () => {
    const invalidate = useInvalidateAddresses();
    return useMutation({ mutationFn: createAddress, onSettled: invalidate });
};

// { id, data }
export const useUpdateAddress = () => {
    const invalidate = useInvalidateAddresses();
    return useMutation({ mutationFn: updateAddress, onSettled: invalidate });
};

// id: the card disappears at once (the server promotes a new default if needed)
export const useDeleteAddress = () => {
    const optimistic = useOptimisticList((list, id) => list.filter((address) => address._id !== id));
    const invalidate = useInvalidateAddresses();
    return useMutation({ mutationFn: deleteAddress, ...optimistic, onSettled: invalidate });
};

// id: the Default pill moves at once
export const useSetDefaultAddress = () => {
    const optimistic = useOptimisticList(withDefault);
    const invalidate = useInvalidateAddresses();
    return useMutation({ mutationFn: setDefaultAddress, ...optimistic, onSettled: invalidate });
};
