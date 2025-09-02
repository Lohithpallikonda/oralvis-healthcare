import { useState, useEffect } from 'react';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { uploadAPI } from '../utils/api';
import { getCurrentUser } from '../utils/auth';

const TechnicianDashboard = () => {
  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    scanType: 'RGB',
    region: 'Frontal'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadHistory, setUploadHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const user = getCurrentUser();

  // Load upload history on component mount
  useEffect(() => {
    loadUploadHistory();
  }, []);

  const loadUploadHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await uploadAPI.getHistory();
      setUploadHistory(response.uploads || []);
      console.log('📊 Upload history loaded:', response.count, 'items');
    } catch (error) {
      console.error('❌ Error loading upload history:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to load upload history: ${error.message}` 
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear message when user starts typing
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ 
        type: 'error', 
        text: 'Please select a valid image file (JPG, JPEG, or PNG)' 
      });
      e.target.value = '';
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage({ 
        type: 'error', 
        text: 'File size must be less than 10MB' 
      });
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setMessage({ type: '', text: '' });

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const errors = [];

    // Patient Name validation
    if (!formData.patientName.trim()) {
      errors.push('Patient name is required');
    } else if (formData.patientName.trim().length < 2) {
      errors.push('Patient name must be at least 2 characters');
    } else if (!/^[a-zA-Z\s\-]+$/.test(formData.patientName.trim())) {
      errors.push('Patient name can only contain letters, spaces, and hyphens');
    }

    // Patient ID validation
    if (!formData.patientId.trim()) {
      errors.push('Patient ID is required');
    } else if (!/^[a-zA-Z0-9]{3,20}$/.test(formData.patientId.trim())) {
      errors.push('Patient ID must be 3-20 alphanumeric characters');
    }

    // File validation
    if (!selectedFile) {
      errors.push('Please select a scan image');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      // Validate form
      const errors = validateForm();
      if (errors.length > 0) {
        throw new Error(errors.join('. '));
      }

      console.log('📤 Starting upload for patient:', formData.patientName);

      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('patientName', formData.patientName.trim());
      uploadData.append('patientId', formData.patientId.trim().toUpperCase());
      uploadData.append('scanType', formData.scanType);
      uploadData.append('region', formData.region);
      uploadData.append('scanImage', selectedFile);

      // Upload scan
      const response = await uploadAPI.uploadScan(uploadData);

      console.log('✅ Upload successful:', response);

      // Show success message
      setMessage({
        type: 'success',
        text: `Scan uploaded successfully! Patient: ${response.scan.patientName} (ID: ${response.scan.patientId})`
      });

      // Reset form
      setFormData({
        patientName: '',
        patientId: '',
        scanType: 'RGB',
        region: 'Frontal'
      });
      setSelectedFile(null);
      setFilePreview(null);
      
      // Clear file input
      const fileInput = document.getElementById('scanImage');
      if (fileInput) fileInput.value = '';

      // Reload upload history
      await loadUploadHistory();

    } catch (error) {
      console.error('❌ Upload error:', error);
      setMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (uploading) {
    return <LoadingSpinner message="Uploading scan to cloud storage..." />;
  }

  return (
    <>
      <Header />
      <div className="container">
        {/* Welcome Section */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#1f2937' }}>
                📤 Scan Upload Dashboard
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
                Upload dental scans with patient information
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '14px', color: '#6b7280' }}>
              <div>Welcome, {user?.email}</div>
              <div>Role: <strong style={{ color: '#3b82f6' }}>{user?.role}</strong></div>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            <strong>{message.type === 'success' ? 'Success!' : 'Error!'}</strong><br />
            {message.text}
          </div>
        )}

        {/* Upload Form */}
        <div className="card">
          <h3 style={{ marginBottom: '24px', color: '#374151' }}>
            🏥 Patient Scan Upload Form
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2" style={{ marginBottom: '24px' }}>
              {/* Patient Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="patientName">
                  👤 Patient Name *
                </label>
                <input
                  type="text"
                  id="patientName"
                  name="patientName"
                  className="form-input"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  placeholder="Enter patient full name"
                  disabled={uploading}
                  required
                />
                <div className="form-error" style={{ fontSize: '12px', color: '#6b7280' }}>
                  Letters, spaces, and hyphens only (2-50 characters)
                </div>
              </div>

              {/* Patient ID */}
              <div className="form-group">
                <label className="form-label" htmlFor="patientId">
                  🆔 Patient ID *
                </label>
                <input
                  type="text"
                  id="patientId"
                  name="patientId"
                  className="form-input"
                  value={formData.patientId}
                  onChange={handleInputChange}
                  placeholder="Enter unique patient ID"
                  disabled={uploading}
                  style={{ textTransform: 'uppercase' }}
                  required
                />
                <div className="form-error" style={{ fontSize: '12px', color: '#6b7280' }}>
                  Alphanumeric only (3-20 characters)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2" style={{ marginBottom: '24px' }}>
              {/* Scan Type */}
              <div className="form-group">
                <label className="form-label" htmlFor="scanType">
                  📊 Scan Type
                </label>
                <select
                  id="scanType"
                  name="scanType"
                  className="form-select"
                  value={formData.scanType}
                  onChange={handleInputChange}
                  disabled={uploading}
                >
                  <option value="RGB">RGB</option>
                </select>
                <div className="form-error" style={{ fontSize: '12px', color: '#6b7280' }}>
                  Currently only RGB scans are supported
                </div>
              </div>

              {/* Region */}
              <div className="form-group">
                <label className="form-label" htmlFor="region">
                  🦷 Dental Region *
                </label>
                <select
                  id="region"
                  name="region"
                  className="form-select"
                  value={formData.region}
                  onChange={handleInputChange}
                  disabled={uploading}
                  required
                >
                  <option value="Frontal">Frontal</option>
                  <option value="Upper Arch">Upper Arch</option>
                  <option value="Lower Arch">Lower Arch</option>
                </select>
              </div>
            </div>

            {/* File Upload */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="scanImage">
                📷 Scan Image * (JPG, PNG - Max 10MB)
              </label>
              <input
                type="file"
                id="scanImage"
                name="scanImage"
                className="form-input"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileSelect}
                disabled={uploading}
                required
              />
              
              {selectedFile && (
                <div style={{ 
                  marginTop: '12px',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Selected File:</strong> {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                    Size: {formatFileSize(selectedFile.size)} | Type: {selectedFile.type}
                  </div>
                  
                  {filePreview && (
                    <div>
                      <div style={{ fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>
                        Preview:
                      </div>
                      <img
                        src={filePreview}
                        alt="Scan preview"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={uploading}
              style={{ 
                width: '100%',
                fontSize: '16px',
                padding: '16px'
              }}
            >
              {uploading ? '⏳ Uploading Scan...' : '🚀 Upload Scan'}
            </button>
          </form>
        </div>

        {/* Upload History Section */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#374151' }}>
              📊 Your Upload History
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="btn btn-secondary"
                style={{ fontSize: '14px' }}
              >
                {showHistory ? '🔼 Hide' : '🔽 Show'} History ({uploadHistory.length})
              </button>
              <button
                onClick={loadUploadHistory}
                className="btn btn-secondary"
                disabled={loadingHistory}
                style={{ fontSize: '14px' }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {showHistory && (
            <>
              {loadingHistory ? (
                <LoadingSpinner message="Loading upload history..." />
              ) : uploadHistory.length === 0 ? (
                <div className="alert alert-info">
                  <strong>No uploads yet</strong><br />
                  Upload your first scan using the form above!
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Patient ID</th>
                        <th>Type</th>
                        <th>Region</th>
                        <th>Upload Date</th>
                        <th>Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadHistory.map((upload, index) => (
                        <tr key={upload.id || index}>
                          <td style={{ fontWeight: '500' }}>
                            {upload.patientName}
                          </td>
                          <td>
                            <code style={{ 
                              backgroundColor: '#f3f4f6',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}>
                              {upload.patientId}
                            </code>
                          </td>
                          <td>{upload.scanType}</td>
                          <td>{upload.region}</td>
                          <td style={{ fontSize: '12px' }}>
                            {formatDate(upload.uploadDate)}
                          </td>
                          <td>
                            <a 
                              href={upload.imageUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ textDecoration: 'none' }}
                            >
                              <img
                                src={upload.imageUrl}
                                alt={`Scan for ${upload.patientName}`}
                                className="image-thumbnail"
                                style={{ cursor: 'pointer' }}
                              />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TechnicianDashboard;