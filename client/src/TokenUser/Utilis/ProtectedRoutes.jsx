import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);
  const token = localStorage.getItem("tokenLogin");
  const isApproved = JSON.parse(localStorage.getItem("isApproved"));

  useEffect(() => {
    const timer = setTimeout(() => {
      setAuth(!!token && isApproved);
      setLoading(false);
    }, 300); 
    return () => clearTimeout(timer);
  }, [token, isApproved]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
        <span className="animate-pulse text-lg">Checking access...</span>
      </div>
    );
  }

  if (!token) <Navigate to="/login" />;
  if (!isApproved) return <Navigate to="/pending-access" />;

  return children;
}

export default ProtectedRoute;
