// authThunks.js
import { loginStart, loginSuccess, loginFailure } from "./authSlice";
import axios from "../axiosClient";

export const loginUser = (email, password) => async (dispatch) => {
  dispatch(loginStart());

  try {
    const response = await axios.post("/api/users/login", {
      email,
      password,
    });

    dispatch(loginSuccess(response.data));
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Eroare la autentificare.";
    dispatch(loginFailure(message));
  }
};
