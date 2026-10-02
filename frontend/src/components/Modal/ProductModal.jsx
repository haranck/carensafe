import React, { useState, useEffect } from 'react';
import { X, Save, Edit, Package, Image as ImageIcon } from 'lucide-react';
import { useUpdateProductStatus, useUpdateVariant } from '../../../src/hooks/Admin/AdminHooks';
import toast from 'react-hot-toast';

const ProductModal = ({ isOpen, onClose, product }) => {
    if (!isOpen || !product) return null;

    const [activeTab, setActiveTab] = useState('variants'); // 'variants' or 'status'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{product.name}</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage variants and status</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('variants')}
                        className={`px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'variants' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Variants
                    </button>
                    <button
                        onClick={() => setActiveTab('status')}
                        className={`px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'status' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Product Status
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    {activeTab === 'variants' && (
                        <div className="space-y-4">
                            {product.variants.map((variant) => (
                                <VariantItem key={variant._id} product={product} variant={variant} />
                            ))}
                        </div>
                    )}
                    {activeTab === 'status' && (
                        <ProductStatusTab product={product} />
                    )}
                </div>
            </div>
        </div>
    );
};

const VariantItem = ({ product, variant }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: variant.name || '',
        price: variant.price || '',
        stock: variant.stock || 0,
        size: variant.size || '',
        isActive: variant.isActive
    });
    const [existingImages, setExistingImages] = useState(variant.images || []);
    const [newImages, setNewImages] = useState([]);
    const [newPreviewUrls, setNewPreviewUrls] = useState([]);

    useEffect(() => {
        if (!isEditing) {
            setFormData({
                name: variant.name || '',
                price: variant.price || '',
                stock: variant.stock || 0,
                size: variant.size || '',
                isActive: variant.isActive
            });
            setExistingImages(variant.images || []);
            setNewImages([]);
            setNewPreviewUrls(prev => {
                prev.forEach(url => URL.revokeObjectURL(url));
                return [];
            });
        }
    }, [variant, isEditing]);

    const updateVariantMutation = useUpdateVariant();

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (existingImages.length + newImages.length + files.length > 3) {
            toast.error("You can have a maximum of 3 images.");
            return;
        }
        if (files.length > 0) {
            setNewImages(prev => [...prev, ...files]);
            setNewPreviewUrls(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
        }
    };

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setNewPreviewUrls(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSave = () => {
        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('price', formData.price);
        submitData.append('stock', formData.stock);
        submitData.append('size', formData.size);
        submitData.append('isActive', formData.isActive);
        
        submitData.append('existingImages', JSON.stringify(existingImages));
        
        newImages.forEach(img => {
            submitData.append('images', img);
        });

        updateVariantMutation.mutate({
            id: product._id,
            variantId: variant._id,
            formData: submitData
        }, {
            onSuccess: () => {
                toast.success('Variant updated successfully');
                setIsEditing(false);
                setNewImages([]);
                setNewPreviewUrls([]);
            },
            onError: (err) => {
                toast.error(err.response?.data?.message || 'Failed to update variant');
            }
        });
    };

    if (!isEditing) {
        return (
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        {existingImages.slice(0, 3).map((img, i) => (
                            <div key={i} className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                <img src={img.url} alt={`variant ${i}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                        {existingImages.length === 0 && (
                            <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center text-slate-400">
                                <Package size={24} />
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">{variant.name}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-slate-500">
                            <span className="font-medium">₹{variant.price}</span>
                            <span className="hidden md:inline w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>Size: {variant.size}</span>
                            <span className="hidden md:inline w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>Stock: {variant.stock}</span>
                            <span className="hidden md:inline w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className={variant.isActive ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                                {variant.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors self-end md:self-auto"
                    title="Edit Variant"
                >
                    <Edit size={18} />
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-800">Edit Variant</h4>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setFormData({
                                name: variant.name || '',
                                price: variant.price || '',
                                stock: variant.stock || 0,
                                size: variant.size || '',
                                isActive: variant.isActive
                            });
                            setExistingImages(variant.images || []);
                            setNewImages([]);
                            setNewPreviewUrls(prev => {
                                prev.forEach(url => URL.revokeObjectURL(url));
                                return [];
                            });
                        }}
                        className="px-3 py-1.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        disabled={updateVariantMutation.isPending}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                        disabled={updateVariantMutation.isPending}
                    >
                        <Save size={16} />
                        {updateVariantMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Variant Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
                            <input
                                type="number"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Size</label>
                            <input
                                type="text"
                                value={formData.size}
                                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                value={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Variant Images (Max 3)</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex gap-2 justify-center mb-3 flex-wrap">
                            {existingImages.map((img, i) => (
                                <div key={`existing-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-white group">
                                    <img src={img.url} alt={`existing ${i}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(i)}
                                            className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-rose-500 hover:scale-110 transition-transform shadow-sm"
                                        >
                                            <X size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {newPreviewUrls.map((url, i) => (
                                <div key={`new-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-white group">
                                    <img src={url} alt={`new ${i}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => removeNewImage(i)}
                                            className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-rose-500 hover:scale-110 transition-transform shadow-sm"
                                        >
                                            <X size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                    <div className="absolute top-1 left-1 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                        NEW
                                    </div>
                                </div>
                            ))}
                            {existingImages.length === 0 && newPreviewUrls.length === 0 && (
                                <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center text-slate-300">
                                    <ImageIcon size={32} />
                                </div>
                            )}
                        </div>
                        {existingImages.length + newImages.length < 3 && (
                            <label className="cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                <span>Upload extra images</span>
                                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                            </label>
                        )}
                        <p className="text-xs text-slate-500 mt-1">You can upload up to 3 images per variant.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProductStatusTab = ({ product }) => {
    const updateStatusMutation = useUpdateProductStatus();
    const [isActive, setIsActive] = useState(product.isActive);

    const handleToggle = () => {
        const newStatus = !isActive;
        setIsActive(newStatus);
        updateStatusMutation.mutate({ id: product._id, isActive: newStatus }, {
            onSuccess: () => {
                toast.success(`Product is now ${newStatus ? 'active' : 'inactive'}`);
            },
            onError: (err) => {
                setIsActive(!newStatus); // revert
                toast.error(err.response?.data?.message || 'Failed to update status');
            }
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Product Visibility</h3>
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 gap-4">
                <div>
                    <h4 className="font-semibold text-slate-700">Active Status</h4>
                    <p className="text-sm text-slate-500 mt-1">
                        When inactive, the product and all its variants will be hidden from customers.
                    </p>
                </div>
                <button
                    onClick={handleToggle}
                    disabled={updateStatusMutation.isPending}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 ${isActive ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                </button>
            </div>
        </div>
    );
};

export default ProductModal;
