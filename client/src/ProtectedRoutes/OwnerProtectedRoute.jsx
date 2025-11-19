import React from "react";
import { Navigate } from "react-router-dom";
import { getOwnerAuthState, getTokenUserAuthState } from "./AuthUtilis";

function OwnerProtectedRoute({ children }) {
  const ownerAuth = getOwnerAuthState();
  const tokenUserAuth = getTokenUserAuthState();

  // if (tokenUserAuth.isAuthenticated) {
  //   return <Navigate to="/dashboard" replace />;
  // }

  if (!ownerAuth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default OwnerProtectedRoute;
