const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-spinner">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ 
          marginTop: '16px', 
          color: '#6b7280',
          fontSize: '14px' 
        }}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;