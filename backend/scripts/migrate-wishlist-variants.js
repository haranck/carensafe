/**
 * One-off: makes the wishlist variant-level. Safe to run more than once.
 *
 *   node scripts/migrate-wishlist-variants.js --dry-run   # only prints what it would change
 *   node scripts/migrate-wishlist-variants.js             # applies it
 *
 * 1. Drops the old unique index { user, product } (it blocks saving a second size of the same product).
 * 2. Items without a variant get the product's default active variant (in stock first); items whose product is gone or
 *    has no active variant are deleted.
 * 3. Removes duplicates of the same user + product + variant (keeps the newest).
 * 4. Creates the unique index { user, product, variant }.
 * Uses MONGO_URI from the backend env (the same database as the server).
 */
const mongoose = require('mongoose');
const env = require('../src/config/envValidation');

const DRY_RUN = process.argv.includes('--dry-run');
const OLD_INDEX = 'user_1_product_1';
const NEW_INDEX_KEY = { user: 1, product: 1, variant: 1 };

const log = (message) => console.log(`${DRY_RUN ? '[dry-run] ' : ''}${message}`);

const defaultVariant = (product) => {
    const active = (product?.isActive ? product.variants : []).filter((variant) => variant.isActive);
    return active.find((variant) => variant.stock > 0) || active[0] || null;
};

const run = async () => {
    await mongoose.connect(env.MONGO_URI);
    const db = mongoose.connection.db;
    const wishlists = db.collection('wishlists');
    const products = db.collection('products');
    console.log(`Database: ${db.databaseName}${DRY_RUN ? ' (dry run: nothing is changed)' : ''}\n`);

    // 1. Old index
    const indexes = await wishlists.indexes();
    if (indexes.some((index) => index.name === OLD_INDEX)) {
        log(`Drop index ${OLD_INDEX}`);
        if (!DRY_RUN) await wishlists.dropIndex(OLD_INDEX);
    } else {
        console.log(`Index ${OLD_INDEX}: already gone`);
    }

    // 2. Items without a variant
    const missing = await wishlists.find({ $or: [{ variant: { $exists: false } }, { variant: null }] }).toArray();
    console.log(`Items without a variant: ${missing.length}`);
    for (const item of missing) {
        const product = await products.findOne({ _id: item.product });
        const variant = defaultVariant(product);
        if (variant) {
            log(`  ${item._id}: set variant ${variant._id} (${variant.name || variant.size}) of "${product.name}"`);
            if (!DRY_RUN) await wishlists.updateOne({ _id: item._id }, { $set: { variant: variant._id } });
        } else {
            log(`  ${item._id}: delete (product ${item.product} is gone or has no active variant)`);
            if (!DRY_RUN) await wishlists.deleteOne({ _id: item._id });
        }
    }

    // 3. Duplicates (in a dry run, items still missing a variant are grouped by the variant they would get)
    const all = await wishlists.find({}).sort({ createdAt: -1, _id: -1 }).toArray();
    const planned = new Map(DRY_RUN ? await Promise.all(
        missing.map(async (item) => [String(item._id), defaultVariant(await products.findOne({ _id: item.product }))?._id])
    ) : []);
    const seen = new Set();
    const duplicates = [];
    for (const item of all) {
        const variant = item.variant || planned.get(String(item._id));
        if (!variant) continue;
        const key = `${item.user}:${item.product}:${variant}`;
        if (seen.has(key)) duplicates.push(item);
        else seen.add(key);
    }
    console.log(`Duplicates to remove: ${duplicates.length}`);
    for (const item of duplicates) {
        log(`  delete duplicate ${item._id} (user ${item.user}, product ${item.product})`);
        if (!DRY_RUN) await wishlists.deleteOne({ _id: item._id });
    }

    // 4. New index
    const hasNewIndex = indexes.some((index) => JSON.stringify(index.key) === JSON.stringify(NEW_INDEX_KEY) && index.unique);
    if (hasNewIndex) {
        console.log('Unique index { user, product, variant }: already there');
    } else {
        log('Create unique index { user, product, variant }');
        if (!DRY_RUN) await wishlists.createIndex(NEW_INDEX_KEY, { unique: true });
    }

    console.log(`\nDone. ${await wishlists.countDocuments()} wishlist items.`);
};

run()
    .catch((error) => {
        console.error('Migration failed:', error.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
