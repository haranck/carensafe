const Wishlist = require('../../models/wishlist.model');

// Only what a product card needs
const PRODUCT_CARD_FIELDS =
    'name isActive createdAt variants._id variants.name variants.size variants.price variants.stock variants.images.url variants.isActive';

class WishlistRepository {
    create(wishlistData) {
        return Wishlist.create(wishlistData);
    }

    findOne(filter) {
        return Wishlist.findOne(filter).lean();
    }

    async findByUserPaginated(userId, page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const filter = { user: userId };
        const [data, total] = await Promise.all([
            Wishlist.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                // A product that no longer exists would populate as null and lose its id; keep the id instead
                .populate({ path: 'product', select: PRODUCT_CARD_FIELDS, transform: (doc, id) => doc || { _id: id } })
                .lean(),
            Wishlist.countDocuments(filter)
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    findProductIdsByUser(userId) {
        return Wishlist.distinct('product', { user: userId });
    }

    deleteOne(filter) {
        return Wishlist.deleteOne(filter);
    }

    countByUser(userId) {
        return Wishlist.countDocuments({ user: userId });
    }
}

module.exports = new WishlistRepository();
