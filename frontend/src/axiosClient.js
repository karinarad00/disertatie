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

    if ((status === 401 || status === 403) && logoutHandler) {
      logoutHandler(); 
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
