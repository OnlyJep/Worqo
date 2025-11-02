import React, { useMemo } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { message } from "antd";
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
import JobPost from "./components/adminside/jobposting/jobposting";
import Workerlists from "./components/adminside/workerlist/workerlist";
import Employerlists from "./components/adminside/employerlist/employerlist";
import ContractorList from "./components/adminside/contractorlist/contractorlist";
import ReviewList from "./components/adminside/ReviewList/reviewlist";
import Categories from "./components/adminside/categories/Categories";
import Roles from "./components/adminside/roles/Roles";
import SkillCategories from "./components/adminside/skillscategories/skillcategories";
import ColorCodeCollars from "./components/adminside/colorcodecollars/collars";
import Ranks from "./components/adminside/ranks/Ranks";
import RolesManagement from "./components/adminside/roles/Roles";
import FindJob from "./components/HeaderContent/findjob";
import JobProfile from "./components/HeaderContent/JobProfile";
import AboutUs from "./components/HeaderContent/AboutUs";
import Message from "./components/HeaderContent/Message";
import MessageWorker from "./components/HeaderContent/MessageWorker";
import Notif from "./components/HeaderContent/Notif";
import Services from "./components/adminside/services/Services";
import Company from "./components/adminside/company/Company.js";
import Book from "./components/adminside/Booking/book";
import PostHiringTable from "./components/adminside/posthiring/posthiring";
import ProfileSettings from "./components/profilesettings/profilesettings";
import AdminProfileSetting from "./components/AdminSetting/AdminProfileSetting.js";
import SkillRatingModal from "./components/SkillRatingModal/SkillRatingModal";



const useAuth = () => {
  return useMemo(() => {
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      const user = JSON.parse(storedUser);
      return { isAuthenticated: true, userRole: user.role_id };
    }
    return { isAuthenticated: false, userRole: null };
  }, []);
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role-based route protection component
const RoleBasedRoute = ({ children, restrictedRoles = [] }) => {
  const location = useLocation();
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If user's role is in the restricted roles, redirect to homepage
  if (restrictedRoles.includes(userRole)) {
    return <Navigate to="/homepage" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const targetRoute = userRole === 3 ? "/admin" : "/homepage";
    return <Navigate to={targetRoute} replace state={{ from: location }} />;
  }

  return children;
};

const RootRoute = () => {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/homepage" replace />;
  }

  const targetRoute = userRole === 3 ? "/admin" : "/homepage";
  return <Navigate to={targetRoute} replace />;
};

// Message wrapper component that routes to correct component based on role
const MessageWrapper = () => {
  const { userRole } = useAuth();
  
  if (userRole === 1) {
    return <MessageWorker />;
  } else {
    return <Message />;
  }
};

// Guard for Post Jobs: allow only Employer (role_id === 2)
const PostJobsGuard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();

  React.useEffect(() => {
    const goTo = isAuthenticated ? "/homepage" : "/login";
    if (!isAuthenticated || userRole !== 2) {
      message.warning("You need to be an employer to post a job.");
      navigate(goTo, { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);

  if (!isAuthenticated || userRole !== 2) {
    return null;
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Post Jobs</h2>
      <p>This feature is coming soon!</p>
    </div>
  );
};

export default function Routers() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route path="/homepage" element={<Homepage />} />
        <Route 
          path="/services" 
          element={<Service />} 
        />
        <Route path="/headerz" element={<Headerz />} />
        <Route 
          path="/find-jobs" 
          element={<FindJob />} 
        />
        <Route path="/job/:jobId" element={<JobProfile />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/message" element={<MessageWrapper />} />
        <Route path="/notifications" element={<Notif />} />
        <Route 
          path="/browse" 
          element={
            <RoleBasedRoute restrictedRoles={[1]}>
              <Browse />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="/browse-white" 
          element={
            <RoleBasedRoute restrictedRoles={[1]}>
              <BrowseWhite />
            </RoleBasedRoute>
          } 
        />
        <Route path="/complete" element={<Complete />} />
        <Route path="/orders_modal" element={<Orders_modal />} />
        <Route path="/pay" element={<Pay />} />
        <Route 
          path="/profile/:workerId" 
          element={<Profile />} 
        />
        <Route path="/profile-settings/*" element={<ProfileSettings />} />
        <Route 
          path="/skill-rating" 
          element={
            <ProtectedRoute>
              <SkillRatingModal
                isOpen={true}
                onClose={() => window.history.back()}
                onComplete={() => window.location.href = '/homepage'}
                user={JSON.parse(localStorage.getItem('user') || '{}')}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/post-jobs" 
          element={<PostJobsGuard />} 
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
          path="/admin/contractorlist"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <ContractorList />
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
        <Route
          path="/admin/company"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Company />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/jobs"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Company />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Book />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/post-hiring"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <PostHiringTable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/services"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <AdminProfileSetting />
            </ProtectedRoute>
          }
          />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

if (document.getElementById("root")) {
  ReactDOM.render(<Routers />, document.getElementById("root"));
}