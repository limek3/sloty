import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/home";
import { MasterProfilePage } from "./pages/master-profile";
import { BookingPage } from "./pages/booking";
import { MyAppointmentsPage } from "./pages/my-appointments";
import { MasterDashboardPage } from "./pages/master-dashboard";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/m/:masterId" element={<MasterProfilePage />} />
      <Route path="/m/:masterId/book" element={<BookingPage />} />
      <Route path="/me" element={<MyAppointmentsPage />} />
      <Route path="/master" element={<MasterDashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
