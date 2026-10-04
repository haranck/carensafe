const addressService = require('../../../services/user/address/address.service');

const ADDRESS_FIELDS = ['fullName', 'phone', 'line1', 'line2', 'landmark', 'city', 'district', 'state', 'pincode', 'type', 'isDefault', 'location', 'formattedAddress'];

// Only the address fields from the body (never user, country or ids)
const pickAddress = (body = {}) =>
    Object.fromEntries(ADDRESS_FIELDS.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));

class AddressController {
    async getAddresses(req, res) {
        try {
            const addresses = await addressService.getAddresses(req.user.userId);
            return res.status(200).json({
                success: true,
                message: 'Addresses retrieved successfully',
                data: addresses
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async createAddress(req, res) {
        try {
            const address = await addressService.createAddress(req.user.userId, pickAddress(req.body));
            return res.status(201).json({
                success: true,
                message: 'Address added',
                data: address
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async updateAddress(req, res) {
        try {
            const address = await addressService.updateAddress(req.user.userId, req.params.id, pickAddress(req.body));
            return res.status(200).json({
                success: true,
                message: 'Address updated',
                data: address
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async deleteAddress(req, res) {
        try {
            const addresses = await addressService.deleteAddress(req.user.userId, req.params.id);
            return res.status(200).json({
                success: true,
                message: 'Address deleted',
                data: addresses
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async setDefaultAddress(req, res) {
        try {
            const addresses = await addressService.setDefaultAddress(req.user.userId, req.params.id);
            return res.status(200).json({
                success: true,
                message: 'Default address updated',
                data: addresses
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }
}

module.exports = new AddressController();
