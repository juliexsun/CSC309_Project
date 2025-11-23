import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import RequireRole from './components/RequireRole';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RegularDashboard from './pages/RegularDashboard';
import CashierDashboard from './pages/CashierDashboard';
import ScanQRPage from './pages/ScanQRPage';
import ManualAwardPage from './pages/ManualAwardPage';
import CashierTransactionsPage from './pages/CashierTransactionsPage';
import ManagerDashboard from './pages/ManagerDashboard';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageEventsPage from './pages/ManageEventsPage';
import ManagePromotionsPage from './pages/ManagePromotionsPage';
import PromotionsPage from './pages/PromotionsPage';
import EventsListPage from './pages/EventsListPage';
import EventDetailPage from './pages/EventDetailPage';
import MyTransactionsPage from './pages/MyTransactionsPage';
import MyQRCodePage from './pages/MyQRCodePage';
import TransferPage from './pages/TransferPage';
import CreateRedemptionPage from './pages/CreateRedemptionPage';
import MyRedemptionsPage from './pages/MyRedemptionsPage';
import ProfilePage from './pages/ProfilePage';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Protected routes */}
            <Route element={<RequireAuth />}>
              {/* Common routes for all authenticated users */}
              <Route path="/profile" element={<ProfilePage />} />
              
              {/* Regular user routes */}
              <Route element={<RequireRole allowedRoles={['regular', 'cashier', 'manager', 'superuser']} />}>
                <Route path="/dashboard" element={<RegularDashboard />} />
                <Route path="/promotions" element={<PromotionsPage />} />
                <Route path="/events" element={<EventsListPage />} />
                <Route path="/events/:eventId" element={<EventDetailPage />} />
                <Route path="/transactions" element={<MyTransactionsPage />} />
                <Route path="/my-qr" element={<MyQRCodePage />} />
                <Route path="/transfer" element={<TransferPage />} />
                <Route path="/redemptions" element={<MyRedemptionsPage />} />
                <Route path="/redemptions/create" element={<CreateRedemptionPage />} />
              </Route>
              
              {/* Cashier routes */}
              <Route element={<RequireRole allowedRoles={['cashier', 'manager', 'superuser']} />}>
                <Route path="/cashier" element={<CashierDashboard />} />
                <Route path="/cashier/scan" element={<ScanQRPage />} />
                <Route path="/cashier/manual-award" element={<ManualAwardPage />} />
                <Route path="/cashier/transactions" element={<CashierTransactionsPage />} />
              </Route>
              
              {/* Manager/Superuser routes */}
              <Route element={<RequireRole allowedRoles={['manager', 'superuser']} />}>
                <Route path="/manager" element={<ManagerDashboard />} />
                <Route path="/manager/users" element={<ManageUsersPage />} />
                <Route path="/manager/events" element={<ManageEventsPage />} />
                <Route path="/manager/promotions" element={<ManagePromotionsPage />} />
                <Route path="/manager/transactions" element={<CashierTransactionsPage />} />
              </Route>
            </Route>
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 404 Not Found */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
