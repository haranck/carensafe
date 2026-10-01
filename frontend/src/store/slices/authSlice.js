import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser(state, action) {
      const payload = action.payload || {};
      
      // Explicitly map all fields from backend user.model.js
      state.user = {
        id: payload._id || payload.id, // Mongoose usually returns _id
        firstName: payload.firstName || "",
        lastName: payload.lastName || "",
        email: payload.email || "",
        phone: payload.phone || "",
        isBlocked: payload.isBlocked || false,
        avatarUrl: payload.avatarUrl || null,
        role: payload.role || "USER",
        isAdmin: payload.isAdmin || false,
        distributorId: payload.distributorId || null,
        areaManagerId: payload.areaManagerId || null,
        
        // Also keep extra frontend-specific fields like hasWorkspace
        hasWorkspace: payload.hasWorkspace || false,
        
        // Keep anything else just in case
        ...payload
      };
      
      state.isAuthenticated = true;
    },
    clearAuth(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
    updateAvatar(state, action) {
      if (state.user) {
        state.user.avatarUrl = action.payload;
      }
    },
  },
});

export const { setAuthUser, clearAuth, updateAvatar } = authSlice.actions;
export default authSlice.reducer;
