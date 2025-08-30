import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

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
import JobProfile from "./components/HeaderContent/JobProfile"; // New component
import AboutUs from "./components/HeaderContent/AboutUs";
import Message from "./components/HeaderContent/Message";
import Notif from "./components/HeaderContent/Notif";

export default function Routers() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/homepage" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/homepage" element={<Homepage />} />
        <Route path="/services" element={<Service />} />
        <Route path="/headerz" element={<Headerz />} />
        <Route path="/find-jobs" element={<FindJob />} />
        <Route path="/job/:jobId" element={<JobProfile />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/message" element={<Message />} />
        <Route path="/notifications" element={<Notif />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/browse-white" element={<BrowseWhite />} />
        <Route path="/complete" element={<Complete />} />
        <Route path="/orders_modal" element={<Orders_modal />} />
        <Route path="/pay" element={<Pay />} />
        <Route path="/profile/:workerId" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/admin/orders" element={<Orders />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/adminlist" element={<Adminlist />} />
        <Route path="/admin/jobs-post" element={<JobPost />} />
        <Route path="/admin/workerlist" element={<Workerlists />} />
        <Route path="/admin/employerlist" element={<Employerlists />} />
        <Route path="/admin/reviews" element={<ReviewList />} />
        <Route path="/admin/categories" element={<Categories />} />
        <Route path="/admin/roles" element={<Roles />} />
        <Route path="/admin/skill-categories" element={<SkillCategories />} />
        <Route path="/admin/color-code-manager" element={<ColorCodeCollars />} />
        <Route path="/admin/ranks" element={<Ranks />} />
        <Route path="/admin/roles-management" element={<RolesManagement />} />
      </Routes>
    </Router>
  );
}

if (document.getElementById("root")) {
  ReactDOM.render(<Routers />, document.getElementById("root"));
}