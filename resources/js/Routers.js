import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Import components directly
import Login from "./components/login/Login";
import Register from "./components/register/Register";
import Homepage from "./components/Homepage/homepage";
import Headerz from "./components/HeaderContent/Headerz";
import Browse from "./components/ShopContent/browse";
import Cart from "./components/CartContent/cart";
import Complete from "./components/OrdersContent/order_complete";
import Orders_modal from "./components/CartModals/orders_modal";
import Pay from "./components/Payment&Info/pay";
import Profile from "./components/Profile/profile";
















export default function Routers() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="homepage" />} /> {/* Default route */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="homepage" element={<Homepage />} />
        <Route path="headerz" element={<Headerz />} />
        <Route path="browse" element={<Browse />} />
        <Route path="cart" element={<Cart />} />
        <Route path="complete" element={<Complete />} />
        <Route path="orders_modal" element={<Orders_modal />} />
        <Route path="pay" element={<Pay />} />
        <Route path="profile" element={<Profile />} />
      
        
      
      </Routes>
    </Router>
  );
}

if (document.getElementById("root")) {
  ReactDOM.render(<Routers />, document.getElementById("root"));
}