import axiosClient from "./axiosClient";

export const authApi = {
  register:       (data)              => axiosClient.post("/auth/register/", data),
  login:          (data)              => axiosClient.post("/auth/login/", data),
  logout:         (data)              => axiosClient.post("/auth/logout/", data),
  refreshToken:   (data)              => axiosClient.post("/auth/token/refresh/", data),
  getMe:          ()                  => axiosClient.get("/auth/me/"),
  forgotPassword: (data)              => axiosClient.post("/auth/password/forgot/", data),
  resetPassword:  (uid, token, data)  => axiosClient.post(`/auth/password/reset/${uid}/${token}/`, data),
  changePassword: (data)              => axiosClient.post("/auth/password/change/", data),
};
