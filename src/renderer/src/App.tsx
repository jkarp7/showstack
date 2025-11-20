import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { Prep } from './pages/modules/Prep';
import { Production } from './pages/modules/Production';
import { Manager } from './pages/modules/Manager';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Default route - redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Module Selection */}
        <Route path="/modules" element={<LandingPage />} />

        {/* Individual Modules */}
        <Route path="/modules/prep" element={<Prep />} />
        <Route path="/modules/production" element={<Production />} />
        <Route path="/modules/manager" element={<Manager />} />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
