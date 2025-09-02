import { useEffect, useState } from 'react';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { scansAPI } from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import jsPDF from 'jspdf';

const DentistDashboard = () => {
  const user = getCurrentUser();

  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ region: '', scanType: '' });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllScans();
  }, []);

  const loadAllScans = async () => {
    try {
      setLoading(true);
      const res = await scansAPI.getAllScans();
      setScans(res.scans || []);
      setMessage({ type: '', text: '' });
      console.log('Loaded scans:', res.count);
    } catch (error) {
      console.error('Failed to load scans:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to load scans' });
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadAllScans();
    setRefreshing(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search || search.trim().length < 2) {
      setMessage({ type: 'info', text: 'Enter at least 2 characters to search, or clear to view all.' });
      return;
    }
    try {
      setLoading(true);
      const res = await scansAPI.searchScans(search.trim(), {
        region: filters.region || undefined,
        scanType: filters.scanType || undefined
      });
      setScans(res.scans || []);
      setMessage({ type: 'success', text: `Found ${res.count} scan(s) for "${res.query}"` });
    } catch (error) {
      console.error('Search failed:', error);
      setMessage({ type: 'error', text: error.message || 'Search failed' });
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = async () => {
    setSearch('');
    setFilters({ region: '', scanType: '' });
    setMessage({ type: '', text: '' });
    await loadAllScans();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Utility to load an image with CORS and get its dimensions
  const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const downloadReport = async (scan) => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      let y = margin;

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('OralVis Healthcare - Scan Report', margin, y);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const generatedAt = new Date().toLocaleString();
      doc.text(`Generated: ${generatedAt}`, pageWidth - margin, y, { align: 'right' });
      y += 24;
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 20;

      // Patient/scan details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Patient Details', margin, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Name: ${scan.patientName}`, margin, y); y += 16;
      doc.text(`Patient ID: ${scan.patientId}`, margin, y); y += 16;
      doc.text(`Scan Type: ${scan.scanType}`, margin, y); y += 16;
      doc.text(`Region: ${scan.region}`, margin, y); y += 16;
      doc.text(`Upload Date: ${new Date(scan.uploadDate).toLocaleString()}`, margin, y); y += 20;

      // Section divider
      y += 8;
      doc.setDrawColor(220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 18;

      // Image section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Scan Image', margin, y);
      y += 12;

      // Load and place image, scaled to fit available area
      const img = await loadImage(scan.imageUrl);
      const maxW = pageWidth - margin * 2;
      const maxH = pageHeight - y - margin;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const drawW = img.width * scale;
      const drawH = img.height * scale;

      // If not enough vertical space, add a new page
      if (drawH > maxH) {
        doc.addPage();
        y = margin;
      }
      const x = margin + (maxW - drawW) / 2; // center horizontally
      doc.addImage(img, 'JPEG', x, y, drawW, drawH);
      y += drawH + 16;

      // Footer
      const footerY = pageHeight - margin / 2;
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('OralVis Healthcare • Confidential', margin, footerY);
      doc.text(`${scan.patientName} • ${scan.patientId}`, pageWidth - margin, footerY, { align: 'right' });

      const fileName = `Scan_${scan.patientId}_${scan.id}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setMessage({ type: 'error', text: 'Failed to generate PDF report. Please try again.' });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading scans for review..." />;
  }

  return (
    <>
      <Header />
      <div className="container">
        {/* Header Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, color: '#1f2937' }}>
                Scan Viewer Dashboard
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
                Review uploaded scans with details and thumbnails
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '14px', color: '#6b7280' }}>
              <div>Welcome, {user?.email}</div>
              <div>Role: <strong style={{ color: '#10b981' }}>{user?.role}</strong></div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            <strong>{message.type === 'error' ? 'Error' : message.type === 'success' ? 'Success' : 'Notice'}</strong><br />
            {message.text}
          </div>
        )}

        {/* Search & Filters */}
        <div className="card">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-4" style={{ gap: '12px', marginBottom: '12px' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Search by Patient Name or ID</label>
                <input
                  type="text"
                  placeholder="e.g., John or P123"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Region</label>
                <select value={filters.region} onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}>
                  <option value="">Any</option>
                  <option value="Frontal">Frontal</option>
                  <option value="Upper Arch">Upper Arch</option>
                  <option value="Lower Arch">Lower Arch</option>
                </select>
              </div>
              <div className="form-group">
                <label>Scan Type</label>
                <select value={filters.scanType} onChange={(e) => setFilters(prev => ({ ...prev, scanType: e.target.value }))}>
                  <option value="">Any</option>
                  <option value="RGB">RGB</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary">Search</button>
              <button type="button" onClick={clearSearch} className="btn btn-secondary">Clear</button>
              <button type="button" onClick={refresh} className="btn btn-secondary" disabled={refreshing}>Refresh</button>
            </div>
          </form>
        </div>

        {/* Scans Table */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', color: '#374151' }}>All Scans ({scans.length})</h3>
          {scans.length === 0 ? (
            <div className="alert alert-info">
              <strong>No scans available</strong><br />
              Once technicians upload scans, they will appear here.
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((scan) => (
                    <tr key={scan.id}>
                      <td style={{ fontWeight: 500 }}>{scan.patientName}</td>
                      <td>
                        <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                          {scan.patientId}
                        </code>
                      </td>
                      <td>{scan.scanType}</td>
                      <td>{scan.region}</td>
                      <td style={{ fontSize: 12 }}>{formatDate(scan.uploadDate)}</td>
                      <td>
                        <a href={scan.imageUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                          <img
                            src={scan.imageUrl}
                            alt={`Scan for ${scan.patientName}`}
                            className="image-thumbnail"
                            style={{ cursor: 'pointer' }}
                          />
                        </a>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <a
                            href={scan.imageUrl}
                            className="btn btn-secondary"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 12 }}
                          >
                            View Image
                          </a>
                          <button className="btn btn-primary" onClick={() => downloadReport(scan)} style={{ fontSize: 12 }}>
                            Download Report
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DentistDashboard;
