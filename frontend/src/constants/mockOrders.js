// TEMP: replace with orders API. Demo orders for the profile area until the orders backend exists;
// read only through useGetMyOrders (hooks/Profile/ProfileHooks.js), which returns them in the API's { data } shape.

const PRODUCT_IMAGE = "/product.webp";

export const MOCK_ORDERS = [
  {
    _id: "CNS-240931",
    createdAt: "2026-09-28T10:24:00.000Z",
    status: "Delivered",
    paymentMethod: "UPI",
    items: [
      { name: "CareNSafe Premium Cotton XL Sanitary Pads", size: "XL", quantity: 2, price: 220, image: PRODUCT_IMAGE },
      { name: "CareNSafe Premium Cotton XXL Sanitary Pads", size: "XXL", quantity: 1, price: 230, image: PRODUCT_IMAGE },
      { name: "CareNSafe Combo Pack Normal Flow", size: "XL/XXL", quantity: 1, price: 450, image: PRODUCT_IMAGE },
    ],
    total: 1120,
  },
  {
    _id: "CNS-241187",
    createdAt: "2026-10-02T16:05:00.000Z",
    status: "Shipped",
    paymentMethod: "Card",
    items: [{ name: "CareNSafe Combo Pack Normal Flow", size: "XL/XXL", quantity: 2, price: 450, image: PRODUCT_IMAGE }],
    total: 900,
  },
  {
    _id: "CNS-241302",
    createdAt: "2026-10-03T09:40:00.000Z",
    status: "Placed",
    paymentMethod: "Cash on Delivery",
    items: [
      { name: "CareNSafe Premium Cotton XXL Sanitary Pads", size: "XXL", quantity: 3, price: 230, image: PRODUCT_IMAGE },
    ],
    total: 690,
  },
  {
    _id: "CNS-239854",
    createdAt: "2026-09-12T13:15:00.000Z",
    status: "Cancelled",
    paymentMethod: "UPI",
    items: [{ name: "CareNSafe Premium Cotton XL Sanitary Pads", size: "XL", quantity: 1, price: 220, image: PRODUCT_IMAGE }],
    total: 220,
  },
];
