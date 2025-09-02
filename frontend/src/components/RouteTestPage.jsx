import { getCurrentUser, isAuthenticated } from '../utils/auth';
import { Link } from 'react-router-dom';

const RouteTestPage = () => {
  const user = getCurrentUser();
  const authenticated = isAuthenticated();

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <div className="card">
        <h2>🧪 Route Testing Page</h2>
        
        <div className="alert alert-info">
          <strong>Current Authentication Status:</strong>
          <div style={{ marginTop: '8px' }}>
            <div>✅ Authenticated: {authenticated ? 'Yes' : 'No'}</div>
            {user && (
              <>
                <div>👤 User: {user.email}</div>
                <div>🎭 Role: {user.role}</div>
              </>
            )}
          </div>
        </div>

        <h3>Test Route Protection:</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <Link to="/" className="btn btn-secondary">
            🏠 Home (Public)
          </Link>
          <Link to="/technician" className="btn btn-primary">
            📤 Technician Dashboard (Protected)
          </Link>
          <Link to="/dentist" className="btn btn-primary">
            👩‍⚕️ Dentist Dashboard (Protected)
          </Link>
          <Link to="/invalid-route" className="btn btn-secondary">
            ❓ Invalid Route (Should redirect)
          </Link>
        </div>

        {authenticated && (
          <button 
            onClick={() => {
              const { logout } = require('../utils/auth');
              logout();
              window.location.reload();
            }}
            className="btn btn-danger"
            style={{ marginTop: '24px' }}
          >
            🚪 Logout & Test
          </button>
        )}
      </div>
    </div>
  );
};

export default RouteTestPage;