import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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
    <div className="flex h-screen w-screen bg-background overflow-hidden text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header />
        {/* 
          We remove 'overflow-y-auto' from the main wrapper to allow 
          pages like Dashboard to handle their own internal scrolling layouts 
          using h-full. Pages that need body scrolling should add it themselves
          or rely on the child container.
        */}
        <main className="flex-1 overflow-hidden relative p-6">
          <div className="h-full w-full">
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </HashRouter>
  );
};

export default App;