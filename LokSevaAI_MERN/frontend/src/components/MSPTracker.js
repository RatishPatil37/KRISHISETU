import React, { useState, useMemo, useRef } from 'react';
import './MSPTracker.css';

// ─────────────────────────────────────────────────────────────
//  MSP DATA — Verified 2025-27 Government Rates (₹/Quintal)
// ─────────────────────────────────────────────────────────────
const MSP_DATA = [
  // CEREALS — Kharif 2025-26
  { id: 1,  name: 'Paddy (Common)',      category: 'Cereals',    season: 'Kharif',     msp: 2369, prev: 2183, icon: '🌾', marketing: 'Kharif 2025-26' },
  { id: 2,  name: 'Maize (Makka)',       category: 'Cereals',    season: 'Kharif',     msp: 2400, prev: 2090, icon: '🌽', marketing: 'Kharif 2025-26' },
  { id: 3,  name: 'Jowar (Hybrid)',      category: 'Cereals',    season: 'Kharif',     msp: 3699, prev: 3180, icon: '🌾', marketing: 'Kharif 2025-26' },
  { id: 4,  name: 'Bajra',              category: 'Cereals',    season: 'Kharif',     msp: 2775, prev: 2500, icon: '🌾', marketing: 'Kharif 2025-26' },
  { id: 5,  name: 'Ragi',              category: 'Cereals',    season: 'Kharif',     msp: 4886, prev: 3846, icon: '🌿', marketing: 'Kharif 2025-26' },
  // CEREALS — Rabi 2026-27
  { id: 6,  name: 'Wheat',             category: 'Cereals',    season: 'Rabi',       msp: 2585, prev: 2275, icon: '🌾', marketing: 'Rabi 2026-27' },
  { id: 7,  name: 'Barley (Jau)',       category: 'Cereals',    season: 'Rabi',       msp: 2150, prev: 1735, icon: '🌿', marketing: 'Rabi 2026-27' },
  // PULSES — Kharif 2025-26
  { id: 8,  name: 'Moong',             category: 'Pulses',     season: 'Kharif',     msp: 8768, prev: 8558, icon: '🫘', marketing: 'Kharif 2025-26' },
  { id: 9,  name: 'Tur (Arhar)',        category: 'Pulses',     season: 'Kharif',     msp: 8000, prev: 7550, icon: '🟡', marketing: 'Kharif 2025-26' },
  { id: 10, name: 'Urad',              category: 'Pulses',     season: 'Kharif',     msp: 7800, prev: 7400, icon: '🫘', marketing: 'Kharif 2025-26' },
  // PULSES — Rabi 2026-27
  { id: 11, name: 'Gram (Chana)',       category: 'Pulses',     season: 'Rabi',       msp: 5875, prev: 5440, icon: '🟡', marketing: 'Rabi 2026-27' },
  { id: 12, name: 'Lentil (Masur)',     category: 'Pulses',     season: 'Rabi',       msp: 7000, prev: 6425, icon: '🫘', marketing: 'Rabi 2026-27' },
  // OILSEEDS — Kharif 2025-26
  { id: 13, name: 'Sesamum (Til)',      category: 'Oilseeds',   season: 'Kharif',     msp: 9846, prev: 9267, icon: '🌻', marketing: 'Kharif 2025-26' },
  { id: 14, name: 'Nigerseed',         category: 'Oilseeds',   season: 'Kharif',     msp: 9537, prev: 7734, icon: '🌼', marketing: 'Kharif 2025-26' },
  { id: 15, name: 'Sunflower Seed',    category: 'Oilseeds',   season: 'Kharif',     msp: 7721, prev: 6760, icon: '🌻', marketing: 'Kharif 2025-26' },
  { id: 16, name: 'Groundnut',         category: 'Oilseeds',   season: 'Kharif',     msp: 7263, prev: 6783, icon: '🥜', marketing: 'Kharif 2025-26' },
  { id: 17, name: 'Soybean (Yellow)',   category: 'Oilseeds',   season: 'Kharif',     msp: 5328, prev: 4892, icon: '🌿', marketing: 'Kharif 2025-26' },
  // OILSEEDS — Rabi 2026-27
  { id: 18, name: 'Safflower',         category: 'Oilseeds',   season: 'Rabi',       msp: 6540, prev: 5800, icon: '🌸', marketing: 'Rabi 2026-27' },
  { id: 19, name: 'Mustard',           category: 'Oilseeds',   season: 'Rabi',       msp: 6200, prev: 5650, icon: '🟡', marketing: 'Rabi 2026-27' },
  // COMMERCIAL
  { id: 20, name: 'Cotton (Long Staple)', category: 'Commercial', season: 'Commercial', msp: 8110, prev: 7521, icon: '☁️', marketing: 'Kharif 2025-26' },
  { id: 21, name: 'Sugarcane (FRP)',    category: 'Commercial', season: 'Commercial', msp: 355,  prev: 340,  icon: '🎋', marketing: '2025-26' },
  { id: 22, name: 'Raw Jute',          category: 'Commercial', season: 'Commercial', msp: 5650, prev: 5050, icon: '🌿', marketing: '2025-26' },
];

// Helper: compute price increase
const getPriceIncrease = (crop) => crop.msp - crop.prev;

// Helper: season filter key
const getSeasonKey = (season) => {
  if (season === 'Kharif')    return 'kharif';
  if (season === 'Rabi')      return 'rabi';
  return 'commercial';
};

// ─────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────
export default function MSPTracker() {
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');   // 'all' | 'kharif' | 'rabi' | 'commercial'
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef(null);

  // Filtered & searched crops
  const displayed = useMemo(() => {
    let list = MSP_DATA;
    if (filter !== 'all') {
      list = list.filter(c => getSeasonKey(c.season) === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, filter]);

  // ── PDF Export via html2pdf (already in dependencies)
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Dynamic import to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;
      const element  = printRef.current;
      const opt = {
        margin:      [8, 10, 8, 10],
        filename:    'MSP_List_KRISHISETU_2025-27.pdf',
        image:       { type: 'jpeg', quality: 0.97 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:   { mode: ['avoid-all', 'css'] },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Filter button config
  const FILTERS = [
    { key: 'all',        label: '🌍 All Crops',    cssKey: 'all' },
    { key: 'kharif',     label: '☀️ Kharif',       cssKey: 'kharif' },
    { key: 'rabi',       label: '❄️ Rabi',         cssKey: 'rabi' },
    { key: 'commercial', label: '🏭 Commercial',   cssKey: 'commercial' },
  ];

  return (
    <div className="msp-wrapper">
      {/* ── Hero Banner ── */}
      <div className="msp-hero">
        <div className="msp-hero-content">
          <div className="msp-hero-badge">
            🏛️ Government of India &nbsp;|&nbsp; CACP Approved
          </div>
          <h2>MSP Tracker 2025–27</h2>
          <p>
            Official Minimum Support Prices for Kharif 2025-26 & Rabi 2026-27 seasons.
            Real-time reference for farmers across India.
          </p>
          <div className="msp-hero-stats">
            <div className="msp-stat-pill">
              <span className="sp-num">22</span>
              <span className="sp-label">Crops</span>
            </div>
            <div className="msp-stat-pill">
              <span className="sp-num">4</span>
              <span className="sp-label">Categories</span>
            </div>
            <div className="msp-stat-pill">
              <span className="sp-num">₹9,846</span>
              <span className="sp-label">Highest MSP</span>
            </div>
            <div className="msp-stat-pill">
              <span className="sp-num">2025-27</span>
              <span className="sp-label">Season</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls Bar ── */}
      <div className="msp-controls">
        <div className="msp-search-wrap">
          <span className="msp-search-icon">🔍</span>
          <input
            id="msp-search-input"
            type="text"
            className="msp-search"
            placeholder="Search crop name or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search crops"
          />
        </div>

        <div className="msp-filter-group" role="group" aria-label="Season filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              id={`msp-filter-${f.key}`}
              className={`msp-filter-btn${filter === f.key ? ` active ${f.cssKey}` : ''}`}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          id="msp-export-pdf"
          className="msp-export-btn"
          onClick={handleExport}
          disabled={isExporting}
          aria-label="Download MSP list as PDF"
        >
          {isExporting ? (
            <><span style={{ display: 'inline-block', animation: 'mspSpin 0.7s linear infinite' }}>⏳</span> Exporting…</>
          ) : (
            <>📥 Download PDF</>
          )}
        </button>
      </div>

      {/* ── Results Info Bar ── */}
      <div className="msp-results-bar">
        <p className="msp-results-count">
          Showing <strong>{displayed.length}</strong> of {MSP_DATA.length} crops
          {filter !== 'all' && <> · Filtered by <strong>{filter.charAt(0).toUpperCase() + filter.slice(1)}</strong></>}
        </p>
        <div className="msp-season-legend">
          <span className="msp-legend-dot"><span className="dot-kharif"></span>Kharif</span>
          <span className="msp-legend-dot"><span className="dot-rabi"></span>Rabi</span>
          <span className="msp-legend-dot"><span className="dot-commercial"></span>Commercial</span>
        </div>
      </div>

      {/* ── PDF Target ── */}
      <div id="msp-pdf-target" ref={printRef}>
        {/* Hidden PDF header (visible only in PDF) */}
        <div style={{ display: 'none' }} className="msp-pdf-header-block">
          <h1 style={{ textAlign: 'center', color: '#1a5c2e' }}>KRISHISETU — MSP Reference 2025-27</h1>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
            Minimum Support Prices approved by Cabinet Committee on Economic Affairs (CCEA), Government of India
          </p>
        </div>

        {/* ── Crop Cards Grid ── */}
        {displayed.length > 0 ? (
          <div className="msp-grid">
            {displayed.map((crop, idx) => {
              const seasonKey = getSeasonKey(crop.season);
              const increase  = getPriceIncrease(crop);
              const pctInc    = ((increase / crop.prev) * 100).toFixed(1);
              return (
                <article
                  key={crop.id}
                  id={`msp-card-${crop.id}`}
                  className="msp-card"
                  style={{ animationDelay: `${Math.min(idx * 0.04, 0.4)}s` }}
                  aria-label={`${crop.name} MSP: ₹${crop.msp.toLocaleString('en-IN')} per quintal`}
                >
                  {/* Season accent stripe */}
                  <div className={`msp-card-accent accent-${seasonKey}`} />

                  <div className="msp-card-body">
                    {/* Top row: icon + name */}
                    <div className="msp-card-top">
                      <div className={`msp-crop-icon icon-${seasonKey}`} aria-hidden="true">
                        {crop.icon}
                      </div>
                      <div className="msp-card-titles">
                        <h3 className="msp-crop-name" title={crop.name}>{crop.name}</h3>
                        <span className={`msp-season-tag tag-${seasonKey}`}>
                          {seasonKey === 'kharif' ? '☀️' : seasonKey === 'rabi' ? '❄️' : '🏭'}
                          &nbsp;{crop.season}
                        </span>
                        <span className="msp-category-label">{crop.category}</span>
                      </div>
                    </div>

                    {/* Price block */}
                    <div className="msp-price-block">
                      <div>
                        <span className="msp-price-label">MSP Rate</span>
                        <div className="msp-price-value">
                          ₹{crop.msp.toLocaleString('en-IN')}
                        </div>
                        <span className="msp-price-unit">per Quintal (100 kg)</span>
                      </div>
                      <div
                        className="msp-trend-badge"
                        title={`Increased by ₹${increase} from ₹${crop.prev.toLocaleString('en-IN')} last year`}
                      >
                        <span className="msp-trend-arrow">↑</span>
                        +₹{increase.toLocaleString('en-IN')}
                        <span style={{ opacity: 0.8, fontWeight: 500 }}>({pctInc}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="msp-card-footer">
                    <span className="msp-marketing-season">📅 {crop.marketing}</span>
                    <span className="msp-govt-badge">CCEA Approved</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="msp-empty" role="status">
            <span className="msp-empty-icon">🌾</span>
            <h4>No crops found</h4>
            <p>Try a different search term or clear the filter.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes mspSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
