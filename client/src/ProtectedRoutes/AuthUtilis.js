export const getOwnerAuthState = () => {
  const accessToken = localStorage.getItem("accessToken");
  return {
    isAuthenticated: !!accessToken,
    accessToken,
  };
};

export const getTokenUserAuthState = () => {
  const tokenLog = localStorage.getItem("tokenLog");
  const isApproved = localStorage.getItem("isApproved") === "true";

  return {
    isAuthenticated: !!tokenLog,
    isApproved,
  };
};
