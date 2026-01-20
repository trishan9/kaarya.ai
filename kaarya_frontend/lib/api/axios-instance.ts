import axios from "axios";
import { API_URLS } from "./endpoints";

export const api = axios.create({
  baseURL: API_URLS.BASE,
  withCredentials: true,
});
