import { createBrowserRouter } from "react-router-dom";
import App from "../App.jsx";
import About from "../pages/About.jsx";
import Signup from "../components/Signup.jsx";
import Login from "../components/Login.jsx";
import Folder from "../components/Folder.jsx";
import FileUpload from "../components/FileUpload.jsx";
import FolderDetail from "../pages/FolderDetail.jsx";
import FolderList from "../pages/FolderList.jsx";
import UserLogin from "../TokenUser/components/UserLogin.jsx";
import UserDashboard from "../TokenUser/components/UserDashboard.jsx";
import TokenHeader from "../TokenUser/components/TokenHeader.jsx";
import PendingAccess from "../TokenUser/components/PendingAccess.jsx";
import PendingStatus from "../components/PendingStatus.jsx";
import ApprovedDevices from "../components/ApprovedDevices.jsx";
import TokenFolders from "../TokenUser/components/TokenFolders.jsx";
import SecurityCenter from "../components/SecurityCenter.jsx";
import ForgetPassword from "../components/ForgetPasword.jsx";
import ResetCodeVerification from "../components/ResetCodeVerification.jsx";
import TokenUserProtectedRoute from "../ProtectedRoutes/TokenUSerProtectedRoute.jsx";
import OwnerProtectedRoute from "../ProtectedRoutes/OwnerProtectedRoute.jsx";

import Privacy from "../pages/Privacy.jsx";
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "signup",
        element: <Signup />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "forget-password",
        element: <ForgetPassword />,
      },
      {
        path: "verify-reset-code",
        element: <ResetCodeVerification />,
      },
      {
        path: "folder",
        element: (
          <OwnerProtectedRoute>
            <Folder />
          </OwnerProtectedRoute>
        ),
      },

      {
        path: "folder/:id",
        element: (
          <OwnerProtectedRoute>
            <FolderDetail />
          </OwnerProtectedRoute>
        ),
      },
      {
        path: "userlogin",
        element: <UserLogin />,
      },
      {
        path: "pending",
        element: (
          <OwnerProtectedRoute>
            <PendingStatus />
          </OwnerProtectedRoute>
        ),
      },
      {
        path: "approved",
        element: (
          <OwnerProtectedRoute>
            <ApprovedDevices />
          </OwnerProtectedRoute>
        ),
      },
      {
        path: "security-center",
        element: (
          <OwnerProtectedRoute>
            <SecurityCenter />
          </OwnerProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          // <TokenUserProtectedRoute>
            <UserDashboard />
          // </TokenUserProtectedRoute>
        ),
        children: [
          // {
          //   path: "profile",

          //   element: (
          //     // <TokenUserProtectedRoute>
          //       <TokenHeader />
          //     // </TokenUserProtectedRoute>
          //   ),
          // },
        ],
      },

      {
        path: "pending-access",
        element: <PendingAccess />
      },
      {
        path: "about",

        element: (
          <OwnerProtectedRoute>
            <About />
          </OwnerProtectedRoute>
        ),
      },
      {
        path: "privacy",
        element: (
          <OwnerProtectedRoute>
            <Privacy />
          </OwnerProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
