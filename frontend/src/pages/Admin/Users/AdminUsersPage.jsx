import React, { useState, useEffect } from "react";
import { useGetAllUsers, useBlockUser, useUnblockUser } from "../../../hooks/Admin/AdminHooks";
import { Search, Lock, Unlock, User as UserIcon } from "lucide-react";
import Pagination from "../../../components/common/Pagination";

const AdminUsersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: response, isLoading, isError } = useGetAllUsers(currentPage, itemsPerPage, debouncedSearch);
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();

  const users = response?.data || [];
  const paginationInfo = response?.pagination || { total: 0, totalPages: 1 };

  const handleBlock = (userId) => {
    blockMutation.mutate(userId);
  };

  const handleUnblock = (userId) => {
    unblockMutation.mutate(userId);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User Management</h1>

        {/* Search Bar */}
        <div className="relative w-[320px]">
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800 text-[14px] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[12px]">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center">
                      <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-rose-500 font-bold">
                    Failed to load users.
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No users found matching "{debouncedSearch}".
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                            {user.firstName?.[0]?.toUpperCase() || <UserIcon size={18} />}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800 text-[14px]">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-[12px] text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 tracking-wider">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[12px] font-bold border border-rose-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          BLOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[12px] font-bold border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.isBlocked ? (
                        <button
                          onClick={() => handleUnblock(user._id)}
                          disabled={unblockMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                          <Unlock size={14} strokeWidth={2.5} /> Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlock(user._id)}
                          disabled={blockMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                          <Lock size={14} strokeWidth={2.5} /> Block
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {!isLoading && users.length > 0 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={paginationInfo.totalPages}
          onPageChange={setCurrentPage}
          totalItems={paginationInfo.total}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
