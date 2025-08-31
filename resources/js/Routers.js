import React, { useMemo } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
// Import components directly
import Login from "./components/login/Login";
import Register from "./components/register/Register";
import Homepage from "./components/Homepage/homepage";
import Headerz from "./components/HeaderContent/Headerz";
import Service from "./components/HeaderContent/Service";
import Browse from "./components/ShopContent/browseblue";
import BrowseWhite from "./components/ShopContent/browsewhite";
import Complete from "./components/OrdersContent/order_complete";
import Orders_modal from "./components/CartModals/orders_modal";
import Pay from "./components/Payment&Info/pay";
import Profile from "./components/Profile/profile";
import AdminDashboard from "./components/adminside/admindashboard/admindashboard";
import Products from "./components/adminside/products/Products";
import Orders from "./components/adminside/orders/Orders";
import Users from "./components/adminside/users/Users";
import Adminlist from "./components/adminside/Adminlist/adminlist";
import JobPost from "./components/adminside/jobposting/jobposting.js";
import Workerlists from "./components/adminside/workerlist/workerlist.js";
import Employerlists from "./components/adminside/employerlist/employerlist.js";
import ReviewList from "./components/adminside/ReviewList/reviewlist.js";
import Categories from "./components/adminside/categories/Categories";
import Roles from "./components/adminside/roles/Roles";
import SkillCategories from "./components/adminside/skillscategories/skillcategories.js";
import ColorCodeCollars from "./components/adminside/colorcodecollars/collars.js";
import Ranks from "./components/adminside/ranks/Ranks.js";
import RolesManagement from "./components/adminside/roles/Roles.js";
import FindJob from "./components/HeaderContent/findjob";
import JobProfile from "./components/HeaderContent/JobProfile";
import AboutUs from "./components/HeaderContent/AboutUs";
import Message from "./components/HeaderContent/Message";
import Notif from "./components/HeaderContent/Notif";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const { isAuthenticated, userRole } = useMemo(() => {
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      const user = JSON.parse(storedUser);
      return { isAuthenticated: true, userRole: user.role_id };
    }
    return { isAuthenticated: false, userRole: null };
  }, []); // Empty dependency array to run once on mount

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Auth Check for Public Routes
const AuthCheck = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, userRole } = useMemo(() => {
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      const user = JSON.parse(storedUser);
      return { isAuthenticated: true, userRole: user.role_id };
    }
    return { isAuthenticated: false, userRole: null };
  }, []); // Empty dependency array to run once on mount

  if (isAuthenticated) {
    // Define the target route based on role
    const targetRoute = userRole === 3 ? "/admin" : "/homepage";
    // Only redirect if not already on an allowed route
    if (
      (userRole === 1 || userRole === 2 || userRole === 3) &&
      location.pathname !== "/homepage" &&
      location.pathname !== targetRoute &&
      !location.pathname.startsWith("/admin")
    ) {
      return <Navigate to={targetRoute} replace />;
    }
    return children; // Allow access to /homepage for all roles, or /admin for role_id 3
  }

  return children;
};

export default function Routers() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/homepage" />} />
        <Route
          path="/login"
          element={
            <AuthCheck>
              <Login />
            </AuthCheck>
          }
        />
        <Route
          path="/register"
          element={
            <AuthCheck>
              <Register />
            </AuthCheck>
          }
        />
        <Route
          path="/homepage"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <Homepage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <Service />
            </ProtectedRoute>
          }
        />
        <Route
          path="/headerz"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <Headerz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/find-jobs"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <FindJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job/:jobId"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <JobProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <AboutUs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/message"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <Message />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <Notif />
            </ProtectedRoute>
          }
        />
        <Route
          path="/browse"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <Browse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/browse-white"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <BrowseWhite />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complete"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <Complete />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders_modal"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <Orders_modal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pay"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <Pay />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:workerId"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/adminlist"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Adminlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/jobs-post"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <JobPost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/workerlist"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Workerlists />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employerlist"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Employerlists />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <ReviewList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Categories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Roles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/skill-categories"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <SkillCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/color-code-manager"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <ColorCodeCollars />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ranks"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Ranks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles-management"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <RolesManagement />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

if (document.getElementById("root")) {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<Routers />);
}