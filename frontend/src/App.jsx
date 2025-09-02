import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import TechnicianDashboard from './pages/TechnicianDashboard';
import DentistDashboard from './pages/DentistDashboard';
import { PublicRoute, TechnicianRoute, DentistRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public Routes - redirect if already authenticated */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes with specific role requirements */}
          <Route 
            path="/technician" 
            element={
              <TechnicianRoute>
                <TechnicianDashboard />
              </TechnicianRoute>
            } 
          />
          
          <Route 
            path="/dentist" 
            element={
              <DentistRoute>
                <DentistDashboard />
              </DentistRoute>
            } 
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;