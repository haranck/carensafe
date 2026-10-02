import { useState } from "react";
import { useGetAllUsers, useBlockUser, useUnblockUser } from "../../../hooks/Admin/AdminHooks";
import { Search, Lock, Unlock, User as UserIcon } from "lucide-react";

const AdminUsersPage = () => {
  const { data: response, isLoading, isError } = useGetAllUsers();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  
  const [searchTerm, setSearchTerm] = useState("");

  const users = response?.data || [];
  
  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      (user.firstName || "").toLowerCase().includes(search) ||
      (user.lastName || "").toLowerCase().includes(search) ||
      (user.email || "").toLowerCase().includes(search) ||
      (user.role || "").toLowerCase().includes(search)
    );
  });

  const handleBlock = (userId) => {
    blockMutation.mutate(userId);
  };

  const handleUnblock = (userId) => {
    unblockMutation.mutate(userId);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        
        {/* Search Bar */}
        <div className="relative w-[320px]">
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-rose-500">
                    Failed to load users.
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No users found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover bg-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold border border-blue-100">
                            {user.firstName?.[0]?.toUpperCase() || <UserIcon size={16} />}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">
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
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-600 tracking-wider">
                          BLOCKED
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-600 tracking-wider">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[13px]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.isBlocked ? (
                        <button
                          onClick={() => handleUnblock(user._id)}
                          disabled={unblockMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50 cursor-pointer border border-emerald-200/50 shadow-sm"
                        >
                          <Unlock size={14} /> Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlock(user._id)}
                          disabled={blockMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50 cursor-pointer border border-rose-200/50 shadow-sm"
                        >
                          <Lock size={14} /> Block
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
    </div>
  );
};

export default AdminUsersPage;
