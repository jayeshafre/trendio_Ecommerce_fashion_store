/**
 * Axios instance for Trendio AI service (FastAPI on port 8001).
 * Separate from axiosClient — no JWT interceptors needed.
 * Sends AI_SECRET_KEY in every request header.
 */
import axios from "axios";
import { AI_BASE_URL, AI_SECRET_KEY } from "@constants";

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Api-Key": AI_SECRET_KEY,
  },
  timeout: 30000, // 30s — AI responses take longer than regular API calls
});

export default aiClient;