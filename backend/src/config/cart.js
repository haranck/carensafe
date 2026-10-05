// Cart limits shared by the cart model, Joi validation and the cart service
module.exports = {
    MAX_ITEM_QUANTITY: 10, // per product variant
    MAX_CART_ITEMS: 50 // distinct lines per cart
};
