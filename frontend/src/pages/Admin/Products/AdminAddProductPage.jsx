import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Upload, X, Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateProduct } from "../../../hooks/Admin/AdminHooks";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { getErrorMessage } from "../../../utils/errorMessage";
import { usePageTitle } from "../../../hooks/common/usePageTitle";

const AdminAddProductPage = () => {
  usePageTitle("Admin · Add Product");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [variants, setVariants] = useState([
    {
      id: Date.now(), // for React keys
      variantName: "",
      size: "",
      price: "",
      stock: "",
      images: [],
      previewUrls: []
    }
  ]);

  const createProductMutation = useCreateProduct();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleImageChange = (index, e) => {
    const files = Array.from(e.target.files);
    const variant = variants[index];
    
    if (variant.images.length + files.length > 3) {
      toast.error("You can only upload a maximum of 3 images per variant.");
      return;
    }

    const newImages = [...variant.images, ...files];
    const newPreviewUrls = [
      ...variant.previewUrls,
      ...files.map(file => URL.createObjectURL(file))
    ];

    const newVariants = [...variants];
    newVariants[index].images = newImages;
    newVariants[index].previewUrls = newPreviewUrls;
    setVariants(newVariants);
  };

  const removeImage = (variantIndex, imageIndex) => {
    const newVariants = [...variants];
    const variant = newVariants[variantIndex];
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(variant.previewUrls[imageIndex]);
    
    variant.images = variant.images.filter((_, i) => i !== imageIndex);
    variant.previewUrls = variant.previewUrls.filter((_, i) => i !== imageIndex);
    
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        id: Date.now(),
        variantName: "",
        size: "",
        price: "",
        stock: "",
        images: [],
        previewUrls: []
      }
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length === 1) return;
    const newVariants = [...variants];
    // Clean up URLs
    newVariants[index].previewUrls.forEach(url => URL.revokeObjectURL(url));
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };

  // Variant waiting for "Remove" confirmation; `index` is kept after closing so the text doesn't change mid-animation
  const [removeConfirm, setRemoveConfirm] = useState({ open: false, index: 0 });
  const closeRemoveConfirm = () => setRemoveConfirm((current) => ({ ...current, open: false }));
  const handleConfirmRemove = () => {
    removeVariant(removeConfirm.index);
    closeRemoveConfirm();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      toast.error("Product name and description are required.");
      return;
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.variantName || !v.size || !v.price) {
        toast.error(`Variant #${i + 1} is missing required fields.`);
        return;
      }
      if (v.images.length === 0) {
        toast.error(`At least one image is required for Variant #${i + 1}.`);
        return;
      }
    }

    const submitData = new FormData();
    submitData.append("name", formData.name);
    submitData.append("description", formData.description);

    // Prepare JSON array for variants (excluding images and previewUrls)
    const variantsData = variants.map(v => ({
      variantName: v.variantName,
      size: v.size,
      price: v.price,
      stock: v.stock
    }));
    submitData.append("variants", JSON.stringify(variantsData));

    // Append images with index matching the variants array
    variants.forEach((v, index) => {
      v.images.forEach((image) => {
        submitData.append(`images_${index}`, image);
      });
    });

    createProductMutation.mutate(submitData, {
      onSuccess: () => {
        toast.success("Product created successfully!");
        navigate("/admin/products"); // Redirect back to products list
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, "Failed to create product"));
      }
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Package className="text-indigo-600" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Add New Product</h1>
          <p className="text-[13px] text-slate-500 font-medium">Create a new product with multiple variants.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl flex flex-col gap-8">

        {/* Basic Information */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-[15px] font-bold text-slate-800 mb-5 pb-4 border-b border-slate-100">Basic Information</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Organic Cotton Pads"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your product clearly..."
                rows="4"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Variants */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Variants</h2>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1.5 text-[13px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={16} strokeWidth={3} />
              Add Another Variant
            </button>
          </div>

          {variants.map((variant, index) => (
            <div key={variant.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative">
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRemoveConfirm({ open: true, index })}
                  aria-label={`Remove variant #${index + 1}`}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
              
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
                <h2 className="text-[15px] font-bold text-slate-800">Variant #{index + 1}</h2>
                {index === 0 && (
                  <span className="text-[11px] font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full uppercase tracking-wider mr-10">Initial</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-2">Variant Name *</label>
                  <input
                    type="text"
                    value={variant.variantName}
                    onChange={(e) => handleVariantChange(index, "variantName", e.target.value)}
                    placeholder="e.g. Pack of 30"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-2">Size *</label>
                  <input
                    type="text"
                    value={variant.size}
                    onChange={(e) => handleVariantChange(index, "size", e.target.value)}
                    placeholder="e.g. XL"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    value={variant.price}
                    onChange={(e) => handleVariantChange(index, "price", e.target.value)}
                    placeholder="0.00"
                    min="0"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-2">Stock Quantity *</label>
                  <input
                    type="number"
                    value={variant.stock}
                    onChange={(e) => handleVariantChange(index, "stock", e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Variant Images */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[13px] font-bold text-slate-700">Variant Images</h3>
                  <span className="text-[12px] font-semibold text-slate-500">{variant.images.length} / 3 Uploaded</span>
                </div>

                <div className="flex flex-wrap gap-4">
                  {variant.previewUrls.map((url, imgIndex) => (
                    <div key={imgIndex} className="relative w-[100px] h-[100px] rounded-xl border border-slate-200 overflow-hidden group shadow-sm bg-white">
                      <img src={url} alt={`Preview ${imgIndex}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(index, imgIndex)}
                          className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-rose-500 hover:scale-110 transition-transform shadow-sm"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                      {imgIndex === 0 && (
                        <div className="absolute top-1 left-1 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          COVER
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Upload Button */}
                  {variant.images.length < 3 && (
                    <label className="w-[100px] h-[100px] rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer">
                      <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center">
                        <Upload className="text-indigo-500" size={12} />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-indigo-900">Add Image</p>
                      </div>
                      <input
                        type="file"
                        onChange={(e) => handleImageChange(index, e)}
                        accept="image/png, image/jpeg, image/webp, image/jpg"
                        multiple
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={createProductMutation.isPending}
          className="w-full py-3.5 bg-indigo-600 text-white text-[14px] font-bold rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.25)] hover:bg-indigo-700 hover:shadow-[0_6px_16px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {createProductMutation.isPending ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Publishing Product...
            </>
          ) : (
            <>
              <Plus size={18} strokeWidth={2.5} />
              Publish Product
            </>
          )}
        </button>

      </form>

      <ConfirmDialog
        open={removeConfirm.open}
        icon={Trash2}
        title={`Remove variant #${removeConfirm.index + 1}?`}
        description="Everything entered for this variant, including its images, will be discarded."
        confirmLabel="Remove variant"
        onConfirm={handleConfirmRemove}
        onCancel={closeRemoveConfirm}
      />
    </div>
  );
};

export default AdminAddProductPage;
