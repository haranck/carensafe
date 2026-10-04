import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Plus, Edit, Eye, Loader2 } from 'lucide-react';
import { useGetAllProducts } from '../../../hooks/Admin/AdminHooks';
import Pagination from '../../../components/common/Pagination';
import ProductModal from '../../../components/Modal/ProductModal';

const AdminProductsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const navigate = useNavigate();

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // Reset to page 1 on new search
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: response, isLoading, isError } = useGetAllProducts(currentPage, itemsPerPage, debouncedSearch);
    
    const products = response?.data || [];
    const paginationInfo = response?.pagination || { total: 0, totalPages: 1 };

    const getPriceRange = (variants) => {
        if (!variants || variants.length === 0) return 'N/A';
        const prices = variants.map(v => v.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        
        if (min === max) return `₹${min}`;
        return `₹${min} - ₹${max}`;
    };

    const getTotalStock = (variants) => {
        if (!variants || variants.length === 0) return 0;
        return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <Package className="text-indigo-600" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Products Catalog</h1>
                        <p className="text-[14px] text-slate-500 font-medium mt-0.5">Manage your products and variants</p>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/admin/add-products')}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-[14px] hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 transition-all"
                >
                    <Plus size={18} strokeWidth={3} />
                    Add Product
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products by name or variant..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Product</th>
                                <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Variants</th>
                                <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Price Range</th>
                                <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Total Stock</th>
                                <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-500">
                                        <div className="flex justify-center">
                                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                                        </div>
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-rose-500 font-bold">
                                        Failed to load products.
                                    </td>
                                </tr>
                            ) : products.length > 0 ? (
                                products.map((product) => {
                                    const coverImage = product.variants[0]?.images[0]?.url;
                                    const totalStock = getTotalStock(product.variants);

                                    return (
                                        <tr key={product._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                                                        {coverImage ? (
                                                            <img src={coverImage} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                <Package size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[14px] font-bold text-slate-800">{product.name}</h3>
                                                        <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-1 max-w-[200px]">{product.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[12px] font-bold">
                                                    {product.variants.length} Variants
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-[14px] font-bold text-slate-700">
                                                    {getPriceRange(product.variants)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className={`text-[14px] font-bold ${totalStock === 0 ? 'text-rose-500' : 'text-slate-700'}`}>
                                                        {totalStock} in stock
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {product.isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[12px] font-bold border border-emerald-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[12px] font-bold border border-rose-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => openModal(product)}
                                                        className="px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[13px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                                                        title="View & Edit Details"
                                                    >
                                                        <Edit size={16} />
                                                        Manage
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                                <Search className="text-slate-400" size={24} />
                                            </div>
                                            <h3 className="text-[16px] font-bold text-slate-800 mb-1">No products found</h3>
                                            <p className="text-[14px] text-slate-500">We couldn't find any products matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {!isLoading && products.length > 0 && (
                <Pagination 
                    currentPage={currentPage}
                    totalPages={paginationInfo.totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={paginationInfo.total}
                    itemsPerPage={itemsPerPage}
                />
            )}

            <ProductModal 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedProduct(null);
                }} 
                product={selectedProduct} 
            />
        </div>
    );
};

export default AdminProductsPage;
