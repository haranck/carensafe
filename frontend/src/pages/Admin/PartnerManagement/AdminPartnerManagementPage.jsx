import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, Lock, Image, Briefcase, Users, Building, ShieldCheck, CheckCircle2, AlertCircle, Loader2, X, ChevronLeft, ChevronRight, Search, Edit2 } from 'lucide-react';
import { createPartner, updatePartner, getUsersByRole, getPartners } from '../../../services/AdminService';

const AdminPartnerManagementPage = () => {
  // Main Page State
  const [partners, setPartners] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isFetchingPartners, setIsFetchingPartners] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'AREA_MANAGER',
    areaManagerId: '',
    distributorId: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [areaManagers, setAreaManagers] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [fetchingRoles, setFetchingRoles] = useState(false);

  // Fetch Partners List
  const fetchPartnersList = async (page = 1, search = '') => {
    setIsFetchingPartners(true);
    try {
      const res = await getPartners(page, pagination.limit, search);
      if (res.success) {
        setPartners(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch partners:", error);
    } finally {
      setIsFetchingPartners(false);
    }
  };

  useEffect(() => {
    fetchPartnersList(pagination.page, searchTerm);
  }, [pagination.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchPartnersList(1, searchTerm);
  };

  // Fetch roles for form dropdowns
  useEffect(() => {
    if (!isModalOpen) return;

    const fetchRoles = async () => {
      setFetchingRoles(true);
      try {
        if (formData.role === 'DISTRIBUTOR' || formData.role === 'PROMOTER') {
          const amData = await getUsersByRole('AREA_MANAGER');
          setAreaManagers(amData.data || []);
        }
        if (formData.role === 'PROMOTER') {
          const distData = await getUsersByRole('DISTRIBUTOR');
          setDistributors(distData.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch roles", error);
      } finally {
        setFetchingRoles(false);
      }
    };
    
    fetchRoles();
  }, [formData.role, isModalOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset sub-selections if role changes
      ...(name === 'role' ? { areaManagerId: '', distributorId: '' } : {})
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        // Exclude empty fields when editing (like empty password)
        if (formData[key] !== '' && formData[key] !== null) {
          submitData.append(key, formData[key]);
        }
      });
      if (avatarFile) submitData.append('avatar', avatarFile);

      if (editingPartnerId) {
        await updatePartner(editingPartnerId, submitData);
        setMessage({ type: 'success', text: 'Partner updated successfully!' });
      } else {
        await createPartner(submitData);
        setMessage({ type: 'success', text: 'Partner created successfully!' });
      }
      
      // Refresh list
      fetchPartnersList(1, searchTerm);
      
      // Close modal after success
      setTimeout(() => {
        closeModal();
      }, 1500);

    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || `Failed to ${editingPartnerId ? 'update' : 'create'} partner.` });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPartnerId(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'AREA_MANAGER',
      areaManagerId: '',
      distributorId: ''
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (partner) => {
    setEditingPartnerId(partner._id);
    setFormData({
      firstName: partner.firstName || '',
      lastName: partner.lastName || '',
      email: partner.email || '',
      phone: partner.phone || '',
      password: '', // blank intentionally
      role: partner.role || 'AREA_MANAGER',
      areaManagerId: partner.areaManagerId?._id || partner.areaManagerId || '',
      distributorId: partner.distributorId?._id || partner.distributorId || ''
    });
    setAvatarFile(null);
    setAvatarPreview(partner.avatarUrl || null);
    setMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setMessage({ type: '', text: '' });
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'AREA_MANAGER': return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold shadow-sm">Area Manager</span>;
      case 'DISTRIBUTOR': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold shadow-sm">Distributor</span>;
      case 'PROMOTER': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold shadow-sm">Promoter</span>;
      default: return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold shadow-sm">{role}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="text-indigo-600" size={32} />
            Partner Management
          </h1>
          <p className="text-slate-500 mt-2">Manage Area Managers, Distributors, and Promoters.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm flex items-center gap-2"
        >
          <UserPlus size={20} />
          Create Partner
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10 w-full rounded-xl border border-slate-300 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            placeholder="Search partners by name or email..." 
          />
          <button type="submit" className="hidden">Search</button>
        </form>
      </div>

      {/* Partners List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Partner Info</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isFetchingPartners ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                  </td>
                </tr>
              ) : partners.length > 0 ? (
                partners.map(partner => (
                  <tr key={partner._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center">
                          {partner.avatarUrl ? (
                            <img src={partner.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-500 font-bold uppercase">{partner.firstName.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{partner.firstName} {partner.lastName}</p>
                          <p className="text-sm text-slate-500">{partner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(partner.role)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {partner.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${partner.isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {partner.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openEditModal(partner)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1 font-medium text-sm"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-lg font-medium text-slate-600">No partners found</p>
                      <p className="text-sm">Click the 'Create Partner' button to add your first partner.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isFetchingPartners && partners.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50">
            <p className="text-sm text-slate-600 font-medium">
              Showing <span className="font-bold text-slate-800">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-bold text-slate-800">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-bold text-slate-800">{pagination.total}</span> entries
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center px-4 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 shadow-sm">
                Page {pagination.page} of {pagination.totalPages}
              </div>

              <button 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                className="p-2 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Partner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col my-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/80 backdrop-blur-md rounded-t-2xl sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                {editingPartnerId ? <Edit2 className="text-indigo-600" /> : <UserPlus className="text-indigo-600" />}
                {editingPartnerId ? 'Edit Partner' : 'Create New Partner'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors bg-white rounded-full p-1.5 shadow-sm border border-slate-200">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto flex-1 p-8">
              {message.text && (
                <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message.type === 'success' ? <CheckCircle2 className="text-emerald-500" /> : <AlertCircle className="text-red-500" />}
                  <p className="font-medium">{message.text}</p>
                </div>
              )}

              <form id="partner-form" onSubmit={handleSubmit} className="space-y-8">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload').click()}>
                    <div className={`w-32 h-32 rounded-full overflow-hidden border-4 flex items-center justify-center transition-all shadow-md ${avatarPreview ? 'border-indigo-500' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300'}`}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        <UserPlus className="w-12 h-12 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Image className="w-8 h-8 text-white mb-1" />
                      <span className="text-white text-xs font-semibold tracking-wider uppercase">{avatarPreview ? 'Change' : 'Upload'}</span>
                    </div>
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                  <p className="text-sm font-medium text-slate-500 mt-3">Profile Photo (Optional)</p>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <ShieldCheck className="text-slate-400" size={20} />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">First Name <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserPlus className="h-5 w-5 text-slate-400" />
                        </div>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="pl-10 w-full rounded-xl border border-slate-300 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm" placeholder="John" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Last Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserPlus className="h-5 w-5 text-slate-400" />
                        </div>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="pl-10 w-full rounded-xl border border-slate-300 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm" placeholder="Doe" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Email Address <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="pl-10 w-full rounded-xl border border-slate-300 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm" placeholder="john@example.com" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-slate-400" />
                        </div>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="pl-10 w-full rounded-xl border border-slate-300 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm" placeholder="+1 (555) 000-0000" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Password {!editingPartnerId && <span className="text-red-500">*</span>}
                        {editingPartnerId && <span className="text-slate-400 text-xs ml-1">(Leave blank to keep current)</span>}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required={!editingPartnerId} className="pl-10 w-full rounded-xl border border-slate-300 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm" placeholder="••••••••" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role & Hierarchy */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <Briefcase className="text-slate-400" size={20} />
                    Role & Hierarchy Assignment
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Partner Role <span className="text-red-500">*</span></label>
                      <div className="flex flex-col sm:flex-row gap-4">
                        {['AREA_MANAGER', 'DISTRIBUTOR', 'PROMOTER'].map((roleType) => (
                          <label key={roleType} className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${formData.role === roleType ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-600'}`}>
                            <input type="radio" name="role" value={roleType} checked={formData.role === roleType} onChange={handleChange} className="sr-only" />
                            {roleType === 'AREA_MANAGER' && <Building size={20} />}
                            {roleType === 'DISTRIBUTOR' && <Users size={20} />}
                            {roleType === 'PROMOTER' && <UserPlus size={20} />}
                            <span className="font-semibold text-sm sm:text-base">{roleType.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {(formData.role === 'DISTRIBUTOR' || formData.role === 'PROMOTER') && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                          <span>Assign Area Manager <span className="text-red-500">*</span></span>
                          {fetchingRoles && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                        </label>
                        <select name="areaManagerId" value={formData.areaManagerId} onChange={handleChange} required className="w-full rounded-xl border border-slate-300 py-2.5 px-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm">
                          <option value="">Select Area Manager</option>
                          {areaManagers.map(am => (
                            <option key={am._id} value={am._id}>{am.firstName} {am.lastName} ({am.email})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {formData.role === 'PROMOTER' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                          <span>Assign Distributor <span className="text-red-500">*</span></span>
                          {fetchingRoles && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                        </label>
                        <select name="distributorId" value={formData.distributorId} onChange={handleChange} required className="w-full rounded-xl border border-slate-300 py-2.5 px-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm">
                          <option value="">Select Distributor</option>
                          {distributors.map(dist => (
                            <option key={dist._id} value={dist._id}>{dist.firstName} {dist.lastName} ({dist.email})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button 
                type="button" 
                onClick={closeModal} 
                className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="partner-form"
                disabled={loading || fetchingRoles} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                {loading ? (editingPartnerId ? 'Updating...' : 'Creating...') : (editingPartnerId ? 'Update Partner' : 'Create Partner')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPartnerManagementPage;
