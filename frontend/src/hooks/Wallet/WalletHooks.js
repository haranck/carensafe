import { useSelector } from "react-redux";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getWallet, getWalletTransactions } from "../../services/Wallet/walletService";

// Keys carry the user id; order cancel / return mutations invalidate the ["wallet"] and ["wallet_transactions"] prefixes
const useSession = () => {
    const isLoggedIn = useSelector((s) => Boolean(s.token.accessToken));
    const userId = useSelector((s) => s.auth.user?.id);
    return { isLoggedIn, userId };
};

const useWalletQuery = (select) => {
    const { isLoggedIn, userId } = useSession();
    return useQuery({ queryKey: ["wallet", userId], queryFn: getWallet, enabled: isLoggedIn, select });
};

// { balance (paise), currency }
export const useWallet = () => useWalletQuery();

// Just the balance in paise (header, dashboard); undefined while logged out / loading
export const useWalletBalance = () => useWalletQuery((response) => response.data.balance);

export const useWalletTransactions = ({ page = 1, limit = 10, type = "" } = {}) => {
    const { isLoggedIn, userId } = useSession();
    return useQuery({
        queryKey: ["wallet_transactions", userId, page, limit, type],
        queryFn: () => getWalletTransactions({ page, limit, type }),
        enabled: isLoggedIn,
        placeholderData: keepPreviousData,
    });
};
