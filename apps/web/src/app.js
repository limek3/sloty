import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/home";
import { MasterProfilePage } from "./pages/master-profile";
import { BookingPage } from "./pages/booking";
import { MyAppointmentsPage } from "./pages/my-appointments";
import { MasterDashboardPage } from "./pages/master-dashboard";
export function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/m/:masterId", element: _jsx(MasterProfilePage, {}) }), _jsx(Route, { path: "/m/:masterId/book", element: _jsx(BookingPage, {}) }), _jsx(Route, { path: "/me", element: _jsx(MyAppointmentsPage, {}) }), _jsx(Route, { path: "/master", element: _jsx(MasterDashboardPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
