import { loginStart, loginSuccess, loginFailure } from "./authSlice";

export const loginUser = (username, password) => async (dispatch) => {
  dispatch(loginStart());

  try {
    const response = await fetch("http://localhost:5000/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Eroare la autentificare.");
    }

    const userData = await response.json();
    localStorage.setItem("user", JSON.stringify(userData));
    dispatch(loginSuccess(userData));
  } catch (error) {
    dispatch(loginFailure(error.message));
  }
};
