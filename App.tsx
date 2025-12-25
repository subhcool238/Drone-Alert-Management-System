
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import FleetManagement from './pages/FleetManagement';
import ManualControl from './pages/ManualControl';
import PatrolRoutes from './pages/PatrolRoutes';
import Incidents from './pages/Incidents';
import Settings from './pages/Settings';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/fleet" element={<FleetManagement />} />
          <Route path="/manual" element={<ManualControl />} />
          <Route path="/patrols" element={<PatrolRoutes />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/settings/*" element={<Settings />} />
        </Routes>
      </MainLayout>
    </HashRouter>
  );
};

export default App;
