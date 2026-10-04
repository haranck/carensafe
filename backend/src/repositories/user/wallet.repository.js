const Wallet = require('../../models/wallet.model');
const WalletTransaction = require('../../models/walletTransaction.model');

// Wallets and their transactions (amounts in paise). Every method can join the caller's transaction (`session`).
class WalletRepository {
    findByUser(userId, session) {
        return Wallet.findOne({ user: userId }).session(session || null).lean();
    }

    // Creates the wallet on first use (balance 0)
    findOrCreate(userId, session) {
        return Wallet.findOneAndUpdate(
            { user: userId },
            { $setOnInsert: { user: userId, balance: 0 } },
            { upsert: true, returnDocument: 'after', session }
        ).lean();
    }

    // Upserts, so the first credit creates the wallet
    incrementBalance(userId, amount, session) {
        return Wallet.findOneAndUpdate(
            { user: userId },
            { $inc: { balance: amount } },
            { upsert: true, returnDocument: 'after', runValidators: true, session }
        ).lean();
    }

    // Only while the balance covers it; null otherwise
    decrementBalance(userId, amount, session) {
        return Wallet.findOneAndUpdate(
            { user: userId, balance: { $gte: amount } },
            { $inc: { balance: -amount } },
            { returnDocument: 'after', session }
        ).lean();
    }

    findTransactionByKey(idempotencyKey, session) {
        return WalletTransaction.findOne({ idempotencyKey }).session(session || null).lean();
    }

    async createTransaction(data, session) {
        const [transaction] = await WalletTransaction.create([data], { session });
        return transaction.toObject();
    }

    async findTransactionsPaginated(filter = {}, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            WalletTransaction.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .populate('order', 'orderNumber')
                .lean(),
            WalletTransaction.countDocuments(filter)
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
}

module.exports = new WalletRepository();
