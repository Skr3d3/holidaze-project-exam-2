import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "../components/Layout/Navbar";
import Footer from "../components/Layout/Footer";

import Home from "../pages/Home";
import Venues from "../pages/Venues";
import VenueDetail from "../pages/VenueDetail";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import ManageVenues from "../pages/ManageVenues";
import VenueCreate from "../pages/VenueCreate";
import MyVenueDetail from "../pages/MyVenueDetail";
import VenueBookings from "../pages/VenueBookings";
import NotFound from "../pages/NotFound";

export function AppRouter() {
  const basename = process.env.BASE_URL ? process.env.BASE_URL : "/";
  return (
    <BrowserRouter basename={basename}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />

        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/venues/:id" element={<VenueDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="/managevenues" element={<ManageVenues />} />
            <Route path="/manage/venues/new" element={<VenueCreate />} />
            <Route path="/my-venues/:id" element={<MyVenueDetail />} />
            <Route path="/manage/venues/:id/bookings" element={<VenueBookings />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
