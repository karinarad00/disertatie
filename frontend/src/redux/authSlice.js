import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null, // persisted by redux-persist
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.user = action.payload;
      state.error = null;
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.error = null;
      state.loading = false;
    },
    resetAuth(state) {
      return initialState;
    },
    updateProfile(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateProfile,
  resetAuth,
} = authSlice.actions;

export default authSlice.reducer;
