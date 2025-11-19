import { Navigate } from "react-router-dom";
import { getOwnerAuthState, getTokenUserAuthState } from "./AuthUtilis";

function TokenUserProtectedRoute({ children }) {
  const ownerAuth = getOwnerAuthState();
  const tokenUserAuth = getTokenUserAuthState();
  const { isAuthenticated, isApproved } = tokenUserAuth;

  // if (ownerAuth.isAuthenticated) {
  //   return <Navigate to="/folder" replace />;
  // }

  if (!isAuthenticated && !isApproved) {
    return <Navigate to="/pending-access" replace />;
  }

  return children;
}

export default TokenUserProtectedRoute;
