import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Import components directly
import Login from "./components/login/Login";
import Register from "./components/register/Register";
import Homepage from "./components/Homepage/homepage";
import Headerz from "./components/HeaderContent/Headerz";




export default function Routers() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="homepage" />} /> {/* Default route */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="homepage" element={<Homepage />} />
        <Route path="headerz" element={<Headerz />} />
      </Routes>
    </Router>
  );
}

if (document.getElementById("root")) {
  ReactDOM.render(<Routers />, document.getElementById("root"));
}