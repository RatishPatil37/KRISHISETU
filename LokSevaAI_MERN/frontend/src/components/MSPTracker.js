import React, { useState, useMemo } from 'react';
import axios from 'axios';
import './MSPTracker.css';

// ─────────────────────────────────────────────────────────────
//  MSP DATA — Verified 2025-27 Government Rates (Rs./Quintal)
//  Added: states[] — primary producing states in India
// ─────────────────────────────────────────────────────────────
const MSP_DATA = [
  // CEREALS — Kharif 2025-26
  {
    id: 1, name: 'Paddy (Common)', category: 'Cereals', season: 'Kharif',
    msp: 2369, prev: 2183, icon: '🌾', marketing: 'Kharif 2025-26',
    states: ['Punjab', 'Haryana', 'Uttar Pradesh', 'West Bengal', 'Bihar', 'Odisha', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Chhattisgarh']
  },
  {
    id: 2, name: 'Maize (Makka)', category: 'Cereals', season: 'Kharif',
    msp: 2400, prev: 2090, icon: '🌽', marketing: 'Kharif 2025-26',
    states: ['Karnataka', 'Andhra Pradesh', 'Rajasthan', 'Uttar Pradesh', 'Bihar', 'Madhya Pradesh', 'Maharashtra']
  },
  {
    id: 3, name: 'Jowar (Hybrid)', category: 'Cereals', season: 'Kharif',
    msp: 3699, prev: 3180, icon: '🌾', marketing: 'Kharif 2025-26',
    states: ['Maharashtra', 'Karnataka', 'Rajasthan', 'Madhya Pradesh', 'Andhra Pradesh', 'Tamil Nadu']
  },
  {
    id: 4, name: 'Bajra', category: 'Cereals', season: 'Kharif',
    msp: 2775, prev: 2500, icon: '🌾', marketing: 'Kharif 2025-26',
    states: ['Rajasthan', 'Uttar Pradesh', 'Haryana', 'Gujarat', 'Madhya Pradesh', 'Maharashtra']
  },
  {
    id: 5, name: 'Ragi', category: 'Cereals', season: 'Kharif',
    msp: 4886, prev: 3846, icon: '🌿', marketing: 'Kharif 2025-26',
    states: ['Karnataka', 'Andhra Pradesh', 'Tamil Nadu', 'Uttarakhand', 'Himachal Pradesh', 'Odisha']
  },
  // CEREALS — Rabi 2026-27
  {
    id: 6, name: 'Wheat', category: 'Cereals', season: 'Rabi',
    msp: 2585, prev: 2275, icon: '🌾', marketing: 'Rabi 2026-27',
    states: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan', 'Bihar', 'Gujarat']
  },
  {
    id: 7, name: 'Barley (Jau)', category: 'Cereals', season: 'Rabi',
    msp: 2150, prev: 1735, icon: '🌿', marketing: 'Rabi 2026-27',
    states: ['Uttar Pradesh', 'Rajasthan', 'Madhya Pradesh', 'Haryana', 'Himachal Pradesh', 'Bihar']
  },
  // PULSES — Kharif 2025-26
  {
    id: 8, name: 'Moong', category: 'Pulses', season: 'Kharif',
    msp: 8768, prev: 8558, icon: '🫘', marketing: 'Kharif 2025-26',
    states: ['Rajasthan', 'Maharashtra', 'Andhra Pradesh', 'Karnataka', 'Odisha', 'Madhya Pradesh', 'Tamil Nadu']
  },
  {
    id: 9, name: 'Tur (Arhar)', category: 'Pulses', season: 'Kharif',
    msp: 8000, prev: 7550, icon: '🟡', marketing: 'Kharif 2025-26',
    states: ['Maharashtra', 'Uttar Pradesh', 'Karnataka', 'Madhya Pradesh', 'Gujarat', 'Andhra Pradesh']
  },
  {
    id: 10, name: 'Urad', category: 'Pulses', season: 'Kharif',
    msp: 7800, prev: 7400, icon: '🫘', marketing: 'Kharif 2025-26',
    states: ['Madhya Pradesh', 'Maharashtra', 'Andhra Pradesh', 'Rajasthan', 'Uttar Pradesh', 'Tamil Nadu']
  },
  // PULSES — Rabi 2026-27
  {
    id: 11, name: 'Gram (Chana)', category: 'Pulses', season: 'Rabi',
    msp: 5875, prev: 5440, icon: '🟡', marketing: 'Rabi 2026-27',
    states: ['Madhya Pradesh', 'Rajasthan', 'Maharashtra', 'Uttar Pradesh', 'Karnataka', 'Andhra Pradesh']
  },
  {
    id: 12, name: 'Lentil (Masur)', category: 'Pulses', season: 'Rabi',
    msp: 7000, prev: 6425, icon: '🫘', marketing: 'Rabi 2026-27',
    states: ['Madhya Pradesh', 'Uttar Pradesh', 'Bihar', 'West Bengal', 'Rajasthan']
  },
  // OILSEEDS — Kharif 2025-26
  {
    id: 13, name: 'Sesamum (Til)', category: 'Oilseeds', season: 'Kharif',
    msp: 9846, prev: 9267, icon: '🌻', marketing: 'Kharif 2025-26',
    states: ['Madhya Pradesh', 'Rajasthan', 'Gujarat', 'Uttar Pradesh', 'Odisha', 'West Bengal']
  },
  {
    id: 14, name: 'Nigerseed', category: 'Oilseeds', season: 'Kharif',
    msp: 9537, prev: 7734, icon: '🌼', marketing: 'Kharif 2025-26',
    states: ['Odisha', 'Chhattisgarh', 'Madhya Pradesh', 'Andhra Pradesh', 'Maharashtra']
  },
  {
    id: 15, name: 'Sunflower Seed', category: 'Oilseeds', season: 'Kharif',
    msp: 7721, prev: 6760, icon: '🌻', marketing: 'Kharif 2025-26',
    states: ['Karnataka', 'Andhra Pradesh', 'Maharashtra', 'Bihar', 'Odisha', 'Telangana']
  },
  {
    id: 16, name: 'Groundnut', category: 'Oilseeds', season: 'Kharif',
    msp: 7263, prev: 6783, icon: '🥜', marketing: 'Kharif 2025-26',
    states: ['Gujarat', 'Rajasthan', 'Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 'Maharashtra']
  },
  {
    id: 17, name: 'Soybean (Yellow)', category: 'Oilseeds', season: 'Kharif',
    msp: 5328, prev: 4892, icon: '🌿', marketing: 'Kharif 2025-26',
    states: ['Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Karnataka', 'Telangana']
  },
  // OILSEEDS — Rabi 2026-27
  {
    id: 18, name: 'Safflower', category: 'Oilseeds', season: 'Rabi',
    msp: 6540, prev: 5800, icon: '🌸', marketing: 'Rabi 2026-27',
    states: ['Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Madhya Pradesh']
  },
  {
    id: 19, name: 'Mustard', category: 'Oilseeds', season: 'Rabi',
    msp: 6200, prev: 5650, icon: '🟡', marketing: 'Rabi 2026-27',
    states: ['Rajasthan', 'Uttar Pradesh', 'Haryana', 'Madhya Pradesh', 'West Bengal', 'Gujarat']
  },
  // COMMERCIAL
  {
    id: 20, name: 'Cotton (Long Staple)', category: 'Commercial', season: 'Commercial',
    msp: 8110, prev: 7521, icon: '☁️', marketing: 'Kharif 2025-26',
    states: ['Gujarat', 'Maharashtra', 'Telangana', 'Andhra Pradesh', 'Punjab', 'Haryana', 'Rajasthan', 'Karnataka']
  },
  {
    id: 21, name: 'Sugarcane (FRP)', category: 'Commercial', season: 'Commercial',
    msp: 355,  prev: 340,  icon: '🎋', marketing: '2025-26',
    states: ['Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Punjab', 'Gujarat', 'Haryana']
  },
  {
    id: 22, name: 'Raw Jute', category: 'Commercial', season: 'Commercial',
    msp: 5650, prev: 5050, icon: '🌿', marketing: '2025-26',
    states: ['West Bengal', 'Bihar', 'Assam', 'Odisha', 'Uttar Pradesh']
  },
];

// Unique sorted state list from all data
const ALL_STATES = ['All India', ...Array.from(
  new Set(MSP_DATA.flatMap(c => c.states))
).sort()];

const ALL_CATEGORIES = ['All Categories', 'Cereals', 'Pulses', 'Oilseeds', 'Commercial'];

const getPriceIncrease = (c) => c.msp - c.prev;
const getSeasonKey     = (s) => s === 'Kharif' ? 'kharif' : s === 'Rabi' ? 'rabi' : 'commercial';

// ─────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────
export default function MSPTracker() {
  const [search,    setSearch]    = useState('');
  const [season,    setSeason]    = useState('all');
  const [category,  setCategory]  = useState('All Categories');
  const [region,    setRegion]    = useState('All India');
  const [isExporting, setIsExporting] = useState(false);

  // ── Filtered list ──────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = MSP_DATA;

    // Season filter
    if (season !== 'all') {
      list = list.filter(c => getSeasonKey(c.season) === season);
    }

    // Category filter
    if (category !== 'All Categories') {
      list = list.filter(c => c.category === category);
    }

    // Region filter
    if (region !== 'All India') {
      list = list.filter(c => c.states.includes(region));
    }

    // Text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.states.some(s => s.toLowerCase().includes(q))
      );
    }

    return list;
  }, [search, season, category, region]);

  // ── PDF Export — backend PDFKit ────────────────────────────
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const seasonLabel   = season === 'all' ? 'All Seasons' : season.charAt(0).toUpperCase() + season.slice(1);
      const payload = {
        crops:          displayed,
        filterLabel:    seasonLabel,
        regionLabel:    region,
        categoryLabel:  category,
      };
      const response = await axios.post(
        '/api/msp/generate-pdf',
        payload,
        { responseType: 'blob' }
      );
      const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', 'MSP_List_KRISHISETU_2025-27.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF export failed. Make sure the backend server is running.');
    } finally {
      setIsExporting(false);
    }
  };

  const SEASON_FILTERS = [
    { key: 'all',        label: 'All Crops',  cssKey: 'all'        },
    { key: 'kharif',     label: 'Kharif',     cssKey: 'kharif'     },
    { key: 'rabi',       label: 'Rabi',       cssKey: 'rabi'       },
    { key: 'commercial', label: 'Commercial', cssKey: 'commercial' },
  ];

  return (
    <div className="msp-wrapper">
      {/* ── Hero ── */}
      <div className="msp-hero">
        <div className="msp-hero-content">
          <div className="msp-hero-badge">
            🏛️ Government of India &nbsp;|&nbsp; CACP Approved
          </div>
          <h2>MSP Tracker 2025–27</h2>
          <p>
            Official Minimum Support Prices for Kharif 2025-26 &amp; Rabi 2026-27 seasons.
            Filter by state/region, crop category, or season.
          </p>
          <div className="msp-hero-stats">
            <div className="msp-stat-pill">
              <span className="sp-num">{displayed.length}</span>
              <span className="sp-label">Crops shown</span>
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
        {/* Search */}
        <div className="msp-search-wrap">
          <span className="msp-search-icon">🔍</span>
          <input
            id="msp-search-input"
            type="text"
            className="msp-search"
            placeholder="Search crop or state name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search crops"
          />
        </div>

        {/* Season filter pills */}
        <div className="msp-filter-group" role="group" aria-label="Season filters">
          {SEASON_FILTERS.map(f => (
            <button
              key={f.key}
              id={`msp-filter-${f.key}`}
              className={`msp-filter-btn${season === f.key ? ` active ${f.cssKey}` : ''}`}
              onClick={() => setSeason(f.key)}
              aria-pressed={season === f.key}
            >
              {f.key === 'kharif' ? '☀️' : f.key === 'rabi' ? '❄️' : f.key === 'commercial' ? '🏭' : '🌍'}&nbsp;{f.label}
            </button>
          ))}
        </div>

        {/* Category dropdown */}
        <select
          id="msp-category-select"
          className="msp-select"
          value={category}
          onChange={e => setCategory(e.target.value)}
          aria-label="Filter by crop category"
        >
          {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Region dropdown */}
        <select
          id="msp-region-select"
          className="msp-select"
          value={region}
          onChange={e => setRegion(e.target.value)}
          aria-label="Filter by state/region"
        >
          {ALL_STATES.map(s => <option key={s} value={s}>{s === 'All India' ? '📍 All India' : s}</option>)}
        </select>

        {/* Export button */}
        <button
          id="msp-export-pdf"
          className="msp-export-btn"
          onClick={handleExport}
          disabled={isExporting}
          aria-label="Download MSP list as PDF"
        >
          {isExporting
            ? <><span className="msp-spin">⏳</span> Exporting…</>
            : <>📥 Download PDF</>
          }
        </button>
      </div>

      {/* ── Results Info Bar ── */}
      <div className="msp-results-bar">
        <p className="msp-results-count">
          Showing <strong>{displayed.length}</strong> of {MSP_DATA.length} crops
          {region !== 'All India' && <> · Region: <strong>{region}</strong></>}
          {category !== 'All Categories' && <> · Category: <strong>{category}</strong></>}
          {season !== 'all' && <> · Season: <strong>{season.charAt(0).toUpperCase() + season.slice(1)}</strong></>}
        </p>
        <div className="msp-season-legend">
          <span className="msp-legend-dot"><span className="dot-kharif" />Kharif</span>
          <span className="msp-legend-dot"><span className="dot-rabi" />Rabi</span>
          <span className="msp-legend-dot"><span className="dot-commercial" />Commercial</span>
        </div>
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
                <div className={`msp-card-accent accent-${seasonKey}`} />

                <div className="msp-card-body">
                  <div className="msp-card-top">
                    <div className={`msp-crop-icon icon-${seasonKey}`} aria-hidden="true">
                      {crop.icon}
                    </div>
                    <div className="msp-card-titles">
                      <h3 className="msp-crop-name" title={crop.name}>{crop.name}</h3>
                      <div className="msp-tags-row">
                        <span className={`msp-season-tag tag-${seasonKey}`}>
                          {seasonKey === 'kharif' ? '☀️' : seasonKey === 'rabi' ? '❄️' : '🏭'}
                          &nbsp;{crop.season}
                        </span>
                        <span className={`msp-category-tag cat-${crop.category.toLowerCase()}`}>
                          {crop.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price block */}
                  <div className="msp-price-block">
                    <div>
                      <span className="msp-price-label">MSP Rate</span>
                      <div className="msp-price-value">₹{crop.msp.toLocaleString('en-IN')}</div>
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

                  {/* State chips */}
                  <div className="msp-states-row">
                    {crop.states.slice(0, 4).map(st => (
                      <span
                        key={st}
                        className={`msp-state-chip${region === st ? ' active' : ''}`}
                        onClick={() => setRegion(st)}
                        title={`Filter by ${st}`}
                      >
                        {st}
                      </span>
                    ))}
                    {crop.states.length > 4 && (
                      <span className="msp-state-chip more">+{crop.states.length - 4} more</span>
                    )}
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
          <p>Try a different search term, region, or clear the filters.</p>
          <button
            className="msp-clear-btn"
            onClick={() => { setSearch(''); setSeason('all'); setCategory('All Categories'); setRegion('All India'); }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      <style>{`
        @keyframes mspSpin { to { transform: rotate(360deg); } }
        .msp-spin { display: inline-block; animation: mspSpin 0.7s linear infinite; }
      `}</style>
    </div>
  );
}
