export const BaseUrl = import.meta.env.VITE_BACKEND_URL;

const SummaryApi = {
  register: {
    url: "/api/auth/register",
    method: "post",
  },
  login: {
    url: "/api/auth/login",
    method: "post",
  },
  forgetPassword: {
    url: "/api/auth/forget-password",
    method: "put",
  },
  resetPassword: {
    url: "/api/auth/reset-password",
    method: "put",
  },
  changePassword: {
    url: "/api/auth/change-password",
    method: "post",
  },
  logout: {
    url: "/api/auth/logout",
    method: "post",
  },
  saveTokenCode: {
    url: "/api/auth/code",
    method: "post",
  },
  getTokenCode: {
    url: "/api/auth/getCode",
    method: "get",
  },
  getTokenSettings: {
    url: "/api/auth/token-settings",
    method: "get",
  },

  updateTokenSettings: {
    url: "/api/auth/token-settings",
    method: "put",
  },
  update_avatar: {
    url: "/api/auth/update-avatar",
    method: "put",
  },
  createFolder: {
    url: "/api/upload/folder",
    method: "post",
  },
  getFolders: {
    url: "/api/upload/folders",
    method: "get",
  },
  getSelectedFolders: {
    url: `/api/upload/folder/getSelectedFolders`,
    method: "get",
  },
  getFilesInFolder: (id) => ({
    url: `api/upload/folders/${id}/files`,
    method: "get",
  }),
  uploadFileOnFolder: (id) => ({
    url: `/api/upload/folders/${id}/file`,
    method: "post",
  }),
  deleteFolder: (id) => ({
    url: `/api/upload/folders/${id}`,
    method: "delete",
  }),
  renameFolder: (id) => ({
    url: `/api/upload/folders/${id}`,
    method: "put",
  }),
  getFolder: (id) => ({
    url: `/api/upload/folder/${id}`,
    method: "get",
  }),
  renameFile: (id) => ({
    url: `/api/upload/folder/file/${id}`,
    method: "put",
  }),
  deleteFile: (id) => ({
    url: `/api/upload/folder/file/${id}`,
    method: "delete",
  }),
  tokenUserLogin: {
    url: `/api/user-auth/user-login`,
    method: "post",
  },
  GetPendingDevice: {
    url: `/api/user-auth/device/pending`,
    method: "get",
  },
  UpdateDevicesStatus: (id) => ({
    url: `/api/user-auth/device/${id}`,
    method: "post",
  }),
  GetUpdateDevice: (id) => ({
    url: `/api/user-auth/device/${id}/approved`,
    method: "get",
  }),
  UserLogoutAndRemove: {
    url: `/api/user-auth/device/remove`,
    method: "delete",
  },
  GetApprovedDevice: {
    url: `/api/user-auth/device/approved`,
    method: "get",
  },
  ForceLogout: (id) => ({
    url: `/api/user-auth/device/force_logout/${id}`,
    method: "delete",
  }),
  GetUserById: {
    url: `/api/user-auth/device/findUser`,
    method: "get",
  },
  selectFolders: {
    url: `/api/user-auth/device/selected-folders`,
    method: "put",
  },
  GetUpdateTokenFolder: {
    url: `/api/user-auth/device/tokenSelectedFolder`,
    method: "get",
  },
  tokenLogAudit: {
    url: `/api/user-auth/device/tokenLogAudit`,
    method: "post",
  },
  getTokenLogAudit: {
    url: `/api/user-auth/device/getTokenLogAudit`,
    method: "get",
  },
};
export default SummaryApi;
