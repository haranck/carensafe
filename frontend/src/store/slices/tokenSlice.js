import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accessToken: null,
};

const tokenSlice = createSlice({
  name: "token",
  initialState,
  reducers: {
    setAccessToken(state, action) {
      state.accessToken = action.payload;
    },

    clearAccessToken(state) {
      state.accessToken = null;
    },
  },
});

export const { setAccessToken, clearAccessToken } = tokenSlice.actions;
export default tokenSlice.reducer;
