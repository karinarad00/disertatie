import axios from "axios";
import { store } from "./redux/store";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000",
});

let logoutHandler = null;

export const setAxiosLogoutHandler = (handler) => {
  logoutHandler = handler;
};

// Request Interceptor: Automate Token Injection
axiosClient.interceptors.request.use(
  (config) => {
    // Access the state directly from the store
    const state = store.getState();
    const token = state.auth?.user?.token;

    console.log("Axios Interceptor - Token from state:", token ? "Found" : "Missing");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Global Errors (401/403)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if ((status === 401 || status === 403) && logoutHandler) {
      console.warn("Auth error detected → logging out");
      const handler = logoutHandler;
      handler();
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
