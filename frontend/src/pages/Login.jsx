import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { saveAuthData, isAuthenticated, getCurrentUser } from '../utils/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import { useEffect } from 'react';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTestCredentials, setShowTestCredentials] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      redirectByRole(user.role);
    }
  }, []);

  const redirectByRole = (role) => {
    if (role === 'Technician') {
      navigate('/technician', { replace: true });
    } else if (role === 'Dentist') {
      navigate('/dentist', { replace: true });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      if (!formData.email || !formData.password) {
        throw new Error('Please enter both email and password');
      }

      if (!formData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      console.log('🔐 Attempting login for:', formData.email);

      // Call login API
      const response = await authAPI.login(formData.email, formData.password);

      console.log('✅ Login successful:', response);

      // Save authentication data
      saveAuthData(response.token, response.user);

      // Show success message briefly
      console.log(`🎉 Welcome ${response.user.role}: ${response.user.email}`);

      // Redirect based on user role
      redirectByRole(response.user.role);

    } catch (error) {
      console.error('❌ Login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async (testEmail, testPassword) => {
    setFormData({ email: testEmail, password: testPassword });
    setError('');
    
    // Small delay to show the form update, then submit
    setTimeout(() => {
      const syntheticEvent = {
        preventDefault: () => {},
        target: { email: { value: testEmail }, password: { value: testPassword } }
      };
      handleSubmit(syntheticEvent);
    }, 300);
  };

  if (loading) {
    return <LoadingSpinner message="Logging you in..." />;
  }

  return (
    <div className="container" style={{ 
      maxWidth: '450px', 
      marginTop: '80px' 
    }}>
      <div className="card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '32px',
            marginBottom: '8px',
            color: '#1f2937'
          }}>
            🦷 OralVis Healthcare
          </h1>
          <p style={{ 
            fontSize: '16px',
            color: '#6b7280'
          }}>
            Dental Scan Management System
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            <strong>Login Failed</strong><br />
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              📧 Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              🔒 Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ 
              width: '100%', 
              fontSize: '16px',
              padding: '14px'
            }}
          >
            {loading ? '🔄 Logging In...' : '🚀 Login'}
          </button>
        </form>

        {/* Test Credentials Section */}
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
          <button
            type="button"
            onClick={() => setShowTestCredentials(!showTestCredentials)}
            className="btn btn-secondary"
            style={{ 
              width: '100%',
              fontSize: '14px',
              marginBottom: showTestCredentials ? '16px' : '0'
            }}
          >
            {showTestCredentials ? '🔼 Hide' : '🔽 Show'} Test Credentials
          </button>

          {showTestCredentials && (
            <div style={{ 
              background: '#f8fafc', 
              padding: '16px', 
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              <p style={{ 
                fontWeight: '600', 
                marginBottom: '12px',
                color: '#374151'
              }}>
                💡 Click to auto-fill and login:
              </p>
              
              <div className="grid grid-cols-2" style={{ gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => handleTestLogin('technician@oralvis.com', 'technician123')}
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ 
                    fontSize: '12px',
                    padding: '8px 12px'
                  }}
                >
                  📤 Technician Login
                </button>
                
                <button
                  type="button"
                  onClick={() => handleTestLogin('dentist@oralvis.com', 'dentist123')}
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ 
                    fontSize: '12px',
                    padding: '8px 12px'
                  }}
                >
                  👩‍⚕️ Dentist Login
                </button>
              </div>

              <div style={{ 
                marginTop: '12px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <div><strong>Technician:</strong> technician@oralvis.com / technician123</div>
                <div><strong>Dentist:</strong> dentist@oralvis.com / dentist123</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div style={{ 
          marginTop: '24px', 
          textAlign: 'center',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          <p>🔒 Secure authentication with JWT tokens</p>
          <p>🌐 API: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</p>
        </div>
      </div>

      {/* Additional Info Card */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ 
          fontSize: '16px', 
          marginBottom: '12px',
          color: '#374151'
        }}>
          👥 User Roles
        </h3>
        
        <div className="grid grid-cols-2" style={{ fontSize: '14px', gap: '16px' }}>
          <div>
            <div style={{ fontWeight: '600', color: '#3b82f6' }}>📤 Technician</div>
            <ul style={{ 
              marginTop: '4px',
              paddingLeft: '16px',
              color: '#6b7280'
            }}>
              <li>Upload patient scans</li>
              <li>Add scan metadata</li>
              <li>View upload history</li>
            </ul>
          </div>
          
          <div>
            <div style={{ fontWeight: '600', color: '#10b981' }}>👩‍⚕️ Dentist</div>
            <ul style={{ 
              marginTop: '4px',
              paddingLeft: '16px',
              color: '#6b7280'
            }}>
              <li>View all scans</li>
              <li>Search patient records</li>
              <li>Download PDF reports</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;