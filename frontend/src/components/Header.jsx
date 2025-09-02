import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../utils/auth';

const Header = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <header style={{
      background: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '24px', 
            color: '#1f2937',
            margin: 0
          }}>
            🦷 OralVis Healthcare
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            {user.role} Dashboard
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px' 
        }}>
          <span style={{ 
            fontSize: '14px',
            color: '#374151'
          }}>
            👤 {user.email}
          </span>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ fontSize: '12px' }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;