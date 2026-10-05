// "Flat 4, Rose Apartments, MG Road, Near temple, Kochi, Kerala 682001"
export const formatAddress = (address) =>
    [address.line1, address.line2, address.landmark, address.city, `${address.state} ${address.pincode}`]
        .filter(Boolean)
        .join(", ");
