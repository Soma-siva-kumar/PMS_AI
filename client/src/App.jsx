import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import PageTransition from './components/PageTransition';
import Sidebar from './components/Dashboard/Sidebar';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import PatientDashboard from './components/Dashboard/PatientDashboard';
import CaretakerDashboard from './components/Dashboard/CaretakerDashboard';
import FamilyDashboard from './components/Dashboard/FamilyDashboard';
import StaffDashboard from './components/Dashboard/StaffDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import AddStaff from './components/Dashboard/AddStaff';
import AddPatient from './components/Dashboard/AddPatient';
import UserDetail from './components/Dashboard/UserDetail';
import SalineMonitor from './components/Dashboard/SalineMonitor';
import PostureMonitor from './components/Dashboard/PostureMonitor';
import GestureMonitor from './components/Dashboard/GestureMonitor';
import UnknownPersonMonitor from './components/Dashboard/UnknownPersonMonitor';
import Monitor from './components/Monitor';
import Search from './components/Search';
import Profile from './components/Profile';
import './App.css'

function App() {
    return (
        <ToastProvider>
            <Router>
                <AppContent />
            </Router>
        </ToastProvider>
    );
}

const AppContent = () => {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));

    const isDashboardRoute = ['/dashboard/patient', '/dashboard/caretaker', '/dashboard/family', '/dashboard/staff', '/dashboard/admin', '/search', '/profile'].some(path => location.pathname.startsWith(path)) && !location.pathname.includes('/user/');

    return (
        <>
            {isDashboardRoute && user && <Sidebar user={user} />}
            <div className={`main-content ${isDashboardRoute && user ? 'with-sidebar' : ''}`}>
                <PageTransition>
                    <Routes>
                        <Route path="/" element={<HomeRedirect />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/dashboard/patient" element={<PatientDashboard />} />
                        <Route path="/dashboard/caretaker" element={<CaretakerDashboard />} />
                        <Route path="/dashboard/family" element={<FamilyDashboard />} />
                        <Route path="/dashboard/staff" element={<StaffDashboard />} />
                        <Route path="/dashboard/admin" element={<AdminDashboard />} />
                        <Route path="/dashboard/admin/add-staff" element={<AddStaff />} />
                        <Route path="/dashboard/admin/add-patient" element={<AddPatient />} />
                        <Route path="/dashboard/admin/user/:id" element={<UserDetail />} />
                        <Route path="/monitor/:id/saline" element={<SalineMonitor />} />
                        <Route path="/monitor/:id/posture" element={<PostureMonitor />} />
                        <Route path="/monitor/:id/gestures" element={<GestureMonitor />} />
                        <Route path="/monitor/:id/unknown" element={<UnknownPersonMonitor />} />
                        <Route path="/monitor/:id/:type" element={<Monitor />} />
                        <Route path="/monitor/:id" element={<Monitor />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/profile" element={<Profile />} />
                    </Routes>
                </PageTransition>
            </div>
        </>
    );
};

const HomeRedirect = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        if (user.role === 'Patient') return <PatientDashboard />;
        if (user.role === 'Caretaker') return <CaretakerDashboard />;
        if (user.role === 'Family Member') return <FamilyDashboard />;
        if (user.role === 'Staff') return <StaffDashboard />;
        if (user.role === 'Admin') return <AdminDashboard />;
    }
    return <LandingPage />;
};

export default App

