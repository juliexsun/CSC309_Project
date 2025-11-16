import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';


const App = () => {
    return <BrowserRouter>
        <Routes>
        
          <Route path="/" element={<Navigate to="/login" replace />} />
    
          <Route path="/login" element={<Login />} />
            
        </Routes>
    </BrowserRouter>
};

export default App
