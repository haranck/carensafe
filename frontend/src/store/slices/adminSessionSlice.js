import { createSlice } from "@reduxjs/toolkit";

// The admin panel's own session, separate from the customer `auth` / `token` slices (logging in or out of one never
// touches the other). The refresh token is an httpOnly cookie (`adminRefreshToken`), never stored here.
const initialState = {
  accessToken: null,
  user: null,
};

const adminSessionSlice = createSlice({
  name: "adminSession",
  initialState,
  reducers: {
    // { accessToken, user } from POST /admin/auth/login or /admin/auth/refresh
    setAdminSession(state, action) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user || state.user;
    },
    clearAdminSession() {
      return initialState;
    },
  },
});

export const { setAdminSession, clearAdminSession } = adminSessionSlice.actions;
export default adminSessionSlice.reducer;
