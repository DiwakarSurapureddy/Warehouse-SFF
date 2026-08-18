import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FloatingCopilotWidget from './components/FloatingCopilotWidget';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WarehouseProvider } from './context/WarehouseContext';
import { ToastProvider } from './context/ToastContext';

// Pages
import ControlTower from './pages/ControlTower';
import OrdersPage from './pages/OrdersPage';
import AllocationPage from './pages/AllocationPage';
import InventoryPage from './pages/InventoryPage';
import PickingWorkspace from './pages/PickingWorkspace';
import PackingWorkspace from './pages/PackingWorkspace';
import QualityCheckPage from './pages/QualityCheckPage';
import ExceptionCenter from './pages/ExceptionCenter';
import ReplenishmentPage from './pages/ReplenishmentPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import SimulatorPage from './pages/SimulatorPage';
import CopilotPage from './pages/CopilotPage';
import AuditLogPage from './pages/AuditLogPage';
import LoginPage from './pages/LoginPage';

const MainLayout = ({ children, onOpenCopilot }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar onOpenCopilot={onOpenCopilot} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-950/60 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-mono text-xs">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mr-3" />
        Initializing SmartFulfill Operations Engine...
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Operational Routes */}
        <Route
          path="/"
          element={
            <MainLayout onOpenCopilot={() => setIsCopilotOpen(true)}>
              <ControlTower />
            </MainLayout>
          }
        />
        <Route
          path="/orders"
          element={
            <MainLayout onOpenCopilot={() => setIsCopilotOpen(true)}>
              <OrdersPage />
            </MainLayout>
          }
        />
        <Route
          path="/allocation"
          element={
            <MainLayout onOpenCopilot={() => setIsCopilotOpen(true)}>
              <AllocationPage />
            </MainLayout>
          }
        />
        <Route
          path="/inventory"
          element={
            <MainLayout onOpenCopilot={() => setIsCopilotOpen(true)}>
              <InventoryPage />
            </MainLayout>
          }
        />
        <Route
          path="/picking"
          element={
            <MainLayout onOpenCopilot={() => setIsCopilotOpen(true)}>
              <PickingWorkspace />
            </MainLayout>
          }
        />
        <Route
          path="/packing"
          element={
            <MainLayout onOpenCopilot={() => setIsCopilotOpen(true)}>
              <PackingWorkspace />
            </MainLayout>
          }
        />
        <Route
          path="/qc"
          element={
            <MainLayout onOpenCopilot={() => setIsCopilotOpen(true)}>
              <QualityCheckPage />
            </MainLayout>
          }
        />
        <Route
          path="/exceptions"
          element={
            <MainLayout onOpenCopilot={() => setIsCopilotOpen(true)}>
              <ExceptionCenter />
            </MainLayout>
          }
        />
        <Route
          path="/replenishment"
          element={
            <MainLayout onOpenCopilot={() => setIsCopilotOpen(true)}>
              <ReplenishmentPage />
            </MainLayout>
          }
        />
        <Route
          path="/analytics"
          element={
            <MainLayout onOpenCopilot={() => setIsCopilotOpen(true)}>
              <AnalyticsDashboard />
            </MainLayout>
          }
        />
        <Route
          path="/simulator"
          element={
            <MainLayout onOpenCopilot={() => setIsCopilotOpen(true)}>
              <SimulatorPage />
            </MainLayout>
          }
        />
        <Route
          path="/copilot"
          element={
            <MainLayout onOpenCopilot={() => setIsCopilotOpen(true)}>
              <CopilotPage />
            </MainLayout>
          }
        />
        <Route
          path="/audit"
          element={
            <MainLayout onOpenCopilot={() => setIsCopilotOpen(true)}>
              <AuditLogPage />
            </MainLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating Copilot Assistant available globally */}
      <FloatingCopilotWidget
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </>
  );
};

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <WarehouseProvider>
            <AppRoutes />
          </WarehouseProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}
