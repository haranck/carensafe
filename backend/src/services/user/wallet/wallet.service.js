const walletRepository = require('../../../repositories/user/wallet.repository');

const DUPLICATE_KEY_ERROR = 11000;

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isWholePaise = (amount) => Number.isInteger(amount) && amount > 0;

/**
 * Wallet money is integer PAISE. Only server code (order refunds) changes a balance: no customer endpoint can.
 * credit / debit run in a transaction (the caller's `session`, or their own) and are idempotent: the same
 * `idempotencyKey` twice returns the first transaction and changes nothing.
 */
class WalletService {
    async getWallet(userId) {
        const wallet = await walletRepository.findOrCreate(userId);
        return { balance: wallet.balance, currency: 'INR' };
    }

    // type: 'credit' | 'debit' | '' (all)
    getTransactions(userId, { page, limit, type }) {
        const filter = { user: userId };
        if (type) filter.type = type;
        return walletRepository.findTransactionsPaginated(filter, page, limit);
    }

    credit(params, session) {
        return this.applyChange({ ...params, type: 'credit' }, session);
    }

    // Ready for paying with the wallet later: refuses to go below zero (400)
    debit(params, session) {
        return this.applyChange({ ...params, type: 'debit' }, session);
    }

    // Returns { transaction, alreadyApplied }
    async applyChange({ type, userId, amountPaise, source, orderId, itemId, description, idempotencyKey }, session) {
        if (!isWholePaise(amountPaise)) throw httpError('Wallet amounts must be a positive number of paise.', 400);
        if (!idempotencyKey) throw httpError('An idempotency key is required.', 400);

        const work = async (activeSession) => {
            // Already applied → hand back the first one (never twice)
            const existing = await walletRepository.findTransactionByKey(idempotencyKey, activeSession);
            if (existing) return { transaction: existing, alreadyApplied: true };

            const wallet =
                type === 'credit'
                    ? await walletRepository.incrementBalance(userId, amountPaise, activeSession)
                    : await walletRepository.decrementBalance(userId, amountPaise, activeSession);
            if (!wallet) throw httpError('Not enough balance in your wallet.', 400);

            const transaction = await walletRepository.createTransaction(
                {
                    user: userId,
                    type,
                    amount: amountPaise,
                    source,
                    order: orderId,
                    orderItem: itemId,
                    description,
                    balanceAfter: wallet.balance,
                    status: 'completed',
                    idempotencyKey
                },
                activeSession
            );
            return { transaction, alreadyApplied: false };
        };

        try {
            return session ? await work(session) : await walletRepository.runInTransaction(work);
        } catch (error) {
            // Two requests raced past the lookup: the unique key stopped the second one (its transaction is aborted,
            // so its balance change never happened). Outside a caller's transaction we can return the winner.
            if (error.code === DUPLICATE_KEY_ERROR && !session) {
                const existing = await walletRepository.findTransactionByKey(idempotencyKey);
                if (existing) return { transaction: existing, alreadyApplied: true };
            }
            throw error;
        }
    }
}

module.exports = new WalletService();
