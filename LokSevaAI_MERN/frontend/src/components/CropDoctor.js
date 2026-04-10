import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import './CropDoctor.css';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ConfidenceBar({ value, color }) {
  return (
    <div className="cd-confidence-bar">
      <div
        className={`fill ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function TreatmentCard({ type, icon, title, items }) {
  const empty = !items || items.length === 0;
  return (
    <div className={`cd-treatment-card ${type}`}>
      <div className="tc-header">
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      <div className="tc-body">
        {empty ? (
          <p className="tc-empty">No data available for this diagnosis.</p>
        ) : (
          <ul>
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function CropDoctor() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [dragActive, setDragActive]     = useState(false);
  const [analyzing, setAnalyzing]       = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [error, setError]               = useState('');
  const [result, setResult]             = useState(null);  // { analysis, imageBase64, imageMimeType }
  const fileInputRef = useRef(null);

  // ── File selection logic ──
  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10 MB.');
      return;
    }
    setError('');
    setResult(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleInputChange = (e) => {
    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Analyze ──
  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('cropImage', selectedFile);

      const res = await axios.post('/api/crop-doctor/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000,
      });

      if (res.data.success) {
        setResult(res.data);
      } else {
        setError(res.data.error || 'Analysis failed. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to connect to server.';
      setError(`Error: ${msg}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Download PDF ──
  const handleDownloadPDF = async () => {
    if (!result) return;
    setGenerating(true);
    setError('');

    try {
      const res = await axios.post(
        '/api/crop-doctor/generate-pdf',
        {
          analysis:      result.analysis,
          imageBase64:   result.imageBase64,
          imageMimeType: result.imageMimeType,
        },
        { responseType: 'blob', timeout: 30000 }
      );

      // Trigger browser download
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `CropDoctor_Report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('PDF generation failed. Please try again.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  // ── Format file size ──
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const analysis = result?.analysis;

  return (
    <div className="crop-doctor-wrapper">
      {/* ── Header ── */}
      <div className="cd-title">
        <h2>🌿 AI Crops Doctor</h2>
        <span className="cd-badge">Kindwise AI</span>
      </div>
      <p className="cd-subtitle">
        Upload a crop photo — get instant disease diagnosis, treatment advice, and a downloadable PDF report.
      </p>

      {/* ── Upload zone ── */}
      {!selectedFile && (
        <div
          id="crop-upload-zone"
          className={`cd-upload-zone ${dragActive ? 'drag-active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Upload crop image"
        >
          <span className="cd-upload-icon">🌾</span>
          <h3>Drop your crop image here</h3>
          <p>or click to browse — JPEG / PNG / WebP, max 10 MB</p>
          <button
            className="cd-browse-btn"
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            📂 Choose File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleInputChange}
            id="crop-file-input"
          />
        </div>
      )}

      {/* ── Preview + Analyze ── */}
      {selectedFile && (
        <div className="cd-preview-area">
          <div className="cd-image-preview">
            <img src={previewUrl} alt="Crop preview" />
            <button
              className="cd-clear-btn"
              onClick={handleClear}
              title="Remove image"
              type="button"
              id="crop-clear-btn"
            >
              ✕
            </button>
          </div>
          <div className="cd-file-info">
            <div className="cd-file-name">📷 {selectedFile.name}</div>
            <div className="cd-file-meta">Size: {formatSize(selectedFile.size)} · Type: {selectedFile.type}</div>
            <button
              id="crop-analyze-btn"
              className="cd-analyze-btn"
              onClick={handleAnalyze}
              disabled={analyzing}
              type="button"
            >
              {analyzing ? (
                <>
                  <div className="cd-spinner" />
                  Analyzing with AI…
                </>
              ) : (
                <>🔬 Analyze Crop Health</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="cd-error" role="alert">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Results ── */}
      {analysis && (
        <div className="cd-results">
          <div className="cd-results-header">
            <h3>📊 Analysis Results</h3>
            <button
              id="crop-download-pdf-btn"
              className="cd-download-btn"
              onClick={handleDownloadPDF}
              disabled={generating}
              type="button"
            >
              {generating ? (
                <><div className="cd-spinner" />Generating PDF…</>
              ) : (
                <>⬇️ Download Full Report</>
              )}
            </button>
          </div>

          {/* ── Summary cards ── */}
          <div className="cd-summary-grid">
            {/* Crop identified */}
            <div className="cd-summary-card green" data-icon="🌱">
              <div className="label">Crop Identified</div>
              <div className="value">{analysis.cropName}</div>
              <ConfidenceBar value={analysis.cropConfidence} color="green" />
              <div className="sub">{analysis.cropConfidence}% confidence</div>
              {analysis.commonNames?.length > 0 && (
                <div className="sub" style={{ marginTop: 4 }}>
                  Also: {analysis.commonNames.slice(0, 2).join(', ')}
                </div>
              )}
            </div>

            {/* Health status */}
            <div
              className={`cd-summary-card ${analysis.isHealthy === false ? 'red' : 'green'}`}
              data-icon={analysis.isHealthy === false ? '🔴' : '✅'}
            >
              <div className="label">Health Status</div>
              <div className="value" style={{ marginBottom: 8 }}>
                <span className={`cd-health-badge ${analysis.isHealthy === false ? 'diseased' : 'healthy'}`}>
                  {analysis.isHealthy === false ? '🔴 Disease Detected' : '✅ Healthy'}
                </span>
              </div>
              <ConfidenceBar
                value={analysis.isHealthy === false ? 100 - analysis.healthProbability : analysis.healthProbability}
                color={analysis.isHealthy === false ? 'red' : 'green'}
              />
              <div className="sub">
                {analysis.isHealthy === false
                  ? `${100 - analysis.healthProbability}% disease probability`
                  : `${analysis.healthProbability}% healthy probability`}
              </div>
            </div>

            {/* Disease/Pest */}
            {analysis.isHealthy === false && (
              <div className="cd-summary-card red" data-icon="🦠">
                <div className="label">Disease / Pest</div>
                <div className="value">{analysis.diseaseName}</div>
                <ConfidenceBar value={analysis.diseaseConfidence} color="red" />
                <div className="sub">{analysis.diseaseConfidence}% confidence</div>
              </div>
            )}
          </div>

          {/* ── Description ── */}
          {analysis.description && (
            <div className="cd-description">
              <h4>📋 About this disease</h4>
              <p>{analysis.description}</p>
            </div>
          )}

          {/* ── Treatment cards ── */}
          <div className="cd-treatment-grid">
            <TreatmentCard
              type="organic"
              icon="🌿"
              title="Organic / Biological Remedy"
              items={analysis.biological}
            />
            <TreatmentCard
              type="chemical"
              icon="🧪"
              title="Chemical Remedy"
              items={analysis.chemical}
            />
            <TreatmentCard
              type="prevention"
              icon="🛡️"
              title="Prevention Tips"
              items={analysis.prevention}
            />
          </div>

          {/* ── Other diseases ── */}
          {analysis.allDiseases?.length > 1 && (
            <div className="cd-description">
              <h4>🔍 Other Possible Conditions</h4>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                {analysis.allDiseases.map((d, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', color: '#374151', marginBottom: 4 }}>
                    <strong>{d.name}</strong>
                    <span style={{ color: d.confidence > 60 ? '#b91c1c' : '#9ca3af', marginLeft: 8 }}>
                      {d.confidence}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Disclaimer ── */}
          <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 16, lineHeight: 1.6 }}>
            ⚠️ This report is AI-generated. Always consult a certified agronomist before applying any treatment.
          </p>
        </div>
      )}
    </div>
  );
}
