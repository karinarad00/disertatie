import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000",
});

let logoutHandler = null;

export const setAxiosLogoutHandler = (handler) => {
  logoutHandler = handler;
};

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // 🔥 Only act if we actually have a response from server
    if ((status === 401 || status === 403) && logoutHandler) {
      console.warn("Auth error detected → logging out");

      // Prevent multiple triggers (important!)
      const handler = logoutHandler;
      logoutHandler = null;

      handler();
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
