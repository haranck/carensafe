const addressRepository = require('../../../repositories/user/address.repository');
const { MAX_ADDRESSES } = require('../../../config/addresses');

const ADDRESS_FIELDS = ['fullName', 'phone', 'line1', 'line2', 'landmark', 'city', 'district', 'state', 'pincode', 'type', 'formattedAddress'];

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// Known fields only, strings trimmed (Joi doesn't write its trimmed values back).
// The map pin is stored as a GeoJSON Point: coordinates [longitude, latitude].
const normalize = (data) => {
    const normalized = Object.fromEntries(
        ADDRESS_FIELDS.filter((field) => data[field] !== undefined).map((field) => [
            field,
            typeof data[field] === 'string' ? data[field].trim() : data[field]
        ])
    );
    if (data.location?.coordinates) {
        normalized.location = { type: 'Point', coordinates: data.location.coordinates };
    }
    return normalized;
};

const notFound = () => httpError('Address not found.', 404);

class AddressService {
    // Default first, then newest
    async getAddresses(userId) {
        return addressRepository.findByUser(userId);
    }

    // The first address is always the default; `isDefault: true` moves the default here
    async createAddress(userId, data) {
        const count = await addressRepository.countByUser(userId);
        if (count >= MAX_ADDRESSES) {
            throw httpError(`You can save up to ${MAX_ADDRESSES} addresses. Delete one to add a new one.`, 409);
        }

        const isDefault = count === 0 || data.isDefault === true;
        return addressRepository.runInTransaction(async (session) => {
            if (isDefault) await addressRepository.unsetDefault(userId, session);
            return addressRepository.create({ ...normalize(data), user: userId, isDefault }, session);
        });
    }

    // `isDefault: true` makes it the default; the default can't be switched off directly (choose another instead)
    async updateAddress(userId, addressId, data) {
        const existing = await addressRepository.findOwn(userId, addressId);
        if (!existing) throw notFound();

        const updateData = normalize(data);
        if (data.isDefault === true && !existing.isDefault) {
            return addressRepository.runInTransaction(async (session) => {
                await addressRepository.unsetDefault(userId, session);
                return addressRepository.updateOwn(userId, addressId, { ...updateData, isDefault: true }, session);
            });
        }
        return addressRepository.updateOwn(userId, addressId, updateData);
    }

    // Deleting the default promotes the most recently updated remaining address. Returns the new list.
    async deleteAddress(userId, addressId) {
        await addressRepository.runInTransaction(async (session) => {
            const deleted = await addressRepository.deleteOwn(userId, addressId, session);
            if (!deleted) throw notFound();

            if (deleted.isDefault) {
                const next = await addressRepository.findLatestUpdated(userId, session);
                if (next) await addressRepository.updateOwn(userId, next._id, { isDefault: true }, session);
            }
        });
        return addressRepository.findByUser(userId);
    }

    // Returns the new list
    async setDefaultAddress(userId, addressId) {
        const existing = await addressRepository.findOwn(userId, addressId);
        if (!existing) throw notFound();

        if (!existing.isDefault) {
            await addressRepository.runInTransaction(async (session) => {
                await addressRepository.unsetDefault(userId, session);
                await addressRepository.updateOwn(userId, addressId, { isDefault: true }, session);
            });
        }
        return addressRepository.findByUser(userId);
    }
}

module.exports = new AddressService();
