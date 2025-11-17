import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { Design } from './pages/modules/Design';
import { Production } from './pages/modules/Production';
import { Tour } from './pages/modules/Tour';

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
        <Route path="/modules/design" element={<Design />} />
        <Route path="/modules/production" element={<Production />} />
        <Route path="/modules/tour" element={<Tour />} />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
