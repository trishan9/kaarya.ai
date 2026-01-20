import axios from "axios";
import { API_URLS } from "./endpoints";
import { verifySession } from "../session";

export const api = axios.create({
  baseURL: API_URLS.BASE,
  withCredentials: true,
});

api.interceptors.request.use(
  async (config) => {
    const session = await verifySession();
    const accessToken = session?.token;
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
