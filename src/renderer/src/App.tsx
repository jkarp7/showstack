import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { ProjectPage } from './pages/ProjectPage';
import { ModuleLanding } from './pages/ModuleLanding';
import { Prep } from './pages/modules/Prep';
import { EquipmentManager } from './pages/modules/EquipmentManager';
import { Manager } from './pages/modules/Manager';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Default route - show landing page (projects) */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Project-based routes */}
        <Route path="/project/:projectId" element={<ProjectPage />} />
        <Route path="/project/:projectId/module/:moduleType" element={<ModuleLanding />} />
        <Route path="/project/:projectId/module/production/equipment" element={<EquipmentManager />} />
        <Route path="/project/:projectId/module/design/prep" element={<Prep />} />
        <Route path="/project/:projectId/module/manager" element={<Manager />} />

        {/* Direct module access (no project) */}
        <Route path="/module/:moduleType" element={<ModuleLanding />} />
        <Route path="/module/production/equipment" element={<EquipmentManager />} />
        <Route path="/module/design/prep" element={<Prep />} />
        <Route path="/module/manager" element={<Manager />} />

        {/* Backwards compatibility - redirect old routes */}
        <Route path="/modules" element={<LandingPage />} />
        <Route path="/modules/prep" element={<Navigate to="/module/design/prep" replace />} />
        <Route path="/modules/production" element={<Navigate to="/module/production/equipment" replace />} />
        <Route path="/modules/manager" element={<Navigate to="/module/manager" replace />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
