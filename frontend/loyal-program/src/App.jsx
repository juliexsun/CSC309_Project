import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';


const App = () => {
    return <BrowserRouter>
        <Routes>
          {/* 🌟 访问 "/" 自动跳去 "/login" */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Login 页面 */}
          <Route path="/login" element={<Login />} />
            
        </Routes>
    </BrowserRouter>
};

export default App
