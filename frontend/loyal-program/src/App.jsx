import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import Login from './pages/Login';
import RegularDashboard from './pages/RegularDashboard';
import CashierDashboard from './pages/CashierDashboard';
import ScanQRPage from './pages/ScanQRPage';
import ManualAwardPage from './pages/ManualAwardPage';
import CashierTransactionsPage from './pages/CashierTransactionsPage';
import CashierHome from './pages/CashierHome';
import ManagerHome from './pages/ManagerHome';
import PromotionsPage from './pages/PromotionsPage';
import EventsListPage from './pages/EventsListPage';
import EventDetailPage from './pages/EventDetailPage';
import MyTransactionsPage from './pages/MyTransactionsPage';
import MyQRCodePage from './pages/MyQRCodePage';
import TransferPage from './pages/TransferPage';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route element={<RequireAuth />}>
              {/* Regular user routes */}
              <Route path="/dashboard" element={<RegularDashboard />} />
              <Route path="/promotions" element={<PromotionsPage />} />
              <Route path="/events" element={<EventsListPage />} />
              <Route path="/events/:eventId" element={<EventDetailPage />} />
              <Route path="/transactions" element={<MyTransactionsPage />} />
              <Route path="/my-qr" element={<MyQRCodePage />} />
              <Route path="/transfer" element={<TransferPage />} />
              
              {/* Cashier routes */}
              <Route path="/cashier" element={<CashierDashboard />} />
              <Route path="/cashier/scan" element={<ScanQRPage />} />
              <Route path="/cashier/manual-award" element={<ManualAwardPage />} />
              <Route path="/cashier/transactions" element={<CashierTransactionsPage />} />
              
              {/* Manager/Superuser routes */}
              <Route path="/manager" element={<ManagerHome />} />
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
