// Authentication utility functions for OralVis Healthcare

const TOKEN_KEY = 'oralvis_token';
const USER_KEY = 'oralvis_user';

// Store authentication data in localStorage
export const saveAuthData = (token, user) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    console.log('✅ Auth data saved successfully');
  } catch (error) {
    console.error('❌ Error saving auth data:', error);
  }
};

// Get stored JWT token
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('❌ Error getting token:', error);
    return null;
  }
};

// Get current user data
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('❌ Error getting user data:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  const user = getCurrentUser();
  
  if (!token || !user) {
    return false;
  }

  // Check if token is expired (basic check)
  try {
    // JWT tokens have 3 parts separated by dots
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return false;
    }

    // Decode the payload (middle part)
    const payload = JSON.parse(atob(tokenParts[1]));
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      console.log('🕒 Token expired, clearing auth data');
      logout();
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error validating token:', error);
    logout();
    return false;
  }
};

// Check if user has specific role
export const hasRole = (requiredRole) => {
  const user = getCurrentUser();
  if (!user || !isAuthenticated()) {
    return false;
  }
  
  // Handle both single role and array of roles
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }
  
  return user.role === requiredRole;
};

// Check if user is technician
export const isTechnician = () => {
  return hasRole('Technician');
};

// Check if user is dentist
export const isDentist = () => {
  return hasRole('Dentist');
};

// Clear all authentication data (logout)
export const logout = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    console.log('✅ Logout successful - auth data cleared');
  } catch (error) {
    console.error('❌ Error during logout:', error);
  }
};

// Get authentication headers for API requests
export const getAuthHeaders = () => {
  const token = getToken();
  
  if (!token) {
    return {};
  }

  return {
    'Authorization': `Bearer ${token}`
  };
};

// Decode JWT token payload (for debugging/info purposes)
export const decodeToken = (token = null) => {
  try {
    const tokenToUse = token || getToken();
    
    if (!tokenToUse) {
      return null;
    }

    const tokenParts = tokenToUse.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    return payload;
  } catch (error) {
    console.error('❌ Error decoding token:', error);
    return null;
  }
};

// Get token expiration info
export const getTokenExpiration = () => {
  try {
    const payload = decodeToken();
    
    if (!payload || !payload.exp) {
      return null;
    }

    const expirationDate = new Date(payload.exp * 1000);
    const now = new Date();
    const timeUntilExpiration = expirationDate.getTime() - now.getTime();

    return {
      expirationDate,
      timeUntilExpiration,
      isExpired: timeUntilExpiration <= 0,
      expiresInMinutes: Math.floor(timeUntilExpiration / (1000 * 60))
    };
  } catch (error) {
    console.error('❌ Error getting token expiration:', error);
    return null;
  }
};

// Auto-logout when token expires (optional utility)
export const setupTokenExpirationCheck = () => {
  const checkInterval = 60000; // Check every minute
  
  const intervalId = setInterval(() => {
    if (!isAuthenticated()) {
      console.log('🔄 Token expired, user will be logged out');
      clearInterval(intervalId);
      // Optionally trigger a page reload or redirect
      // window.location.href = '/';
    }
  }, checkInterval);

  return intervalId; // Return ID so it can be cleared if needed
};

// Helper function to get user's display name
export const getUserDisplayName = () => {
  const user = getCurrentUser();
  if (!user) return 'Unknown User';
  
  // Use email as display name (can be enhanced with firstName/lastName later)
  return user.email;
};

// Helper function to get user's role badge info
export const getRoleBadge = () => {
  const user = getCurrentUser();
  if (!user) return null;

  const roleConfig = {
    'Technician': {
      label: 'Technician',
      color: '#3b82f6',
      icon: '📤'
    },
    'Dentist': {
      label: 'Dentist', 
      color: '#10b981',
      icon: '👩‍⚕️'
    }
  };

  return roleConfig[user.role] || {
    label: user.role,
    color: '#6b7280',
    icon: '👤'
  };
};