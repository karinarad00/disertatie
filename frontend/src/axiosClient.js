import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000",
});

// 🔥 Intercept responses globally
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401 || status === 403) {
      localStorage.removeItem("user");
      window.location.href = "/login"; // force logout
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
