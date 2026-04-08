import axios from "axios";

import { apiBaseUrl } from "./api";

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});
