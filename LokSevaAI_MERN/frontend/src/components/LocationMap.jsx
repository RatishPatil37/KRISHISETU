import React, { useState, useEffect } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { 
  Navigation, Send, Users, MapPin, Building2, 
  ClipboardList, Home, Sprout, Landmark, Mail, Clock, Map as MapIcon,
  Search, Info
} from 'lucide-react';

const LocationMap = ({ locationParams, searchQuery, onQueryChange }) => {
  const [nearestOffice, setNearestOffice] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ driving: null, walking: null });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

  // Helper: Format Duration (ms to mins)
  const formatDuration = (millis) => {
    if (!millis) return '--';
    const mins = Math.round(parseInt(millis) / 60000);
    return mins < 1 ? '< 1 min' : `${mins} min`;
  };

  // Helper: Format Distance (meters to km)
  const formatDistance = (meters) => {
    if (!meters) return '--';
    const km = (parseInt(meters) / 1000).toFixed(1);
    return `${km} km`;
  };

  // Helper: Open External Navigation
  const openNavigation = (mode = 'driving') => {
    if (!locationParams) return;
    const dest = nearestOffice ? nearestOffice.name : searchQuery.replace(/\+/g, ' ');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${locationParams.lat},${locationParams.lng}&destination=${encodeURIComponent(dest)}&travelmode=${mode}`;
    window.open(url, '_blank');
  };

  // Helper: Share to WhatsApp
  const shareToWhatsApp = () => {
    if (!locationParams) return;
    const dest = nearestOffice ? `${nearestOffice.name} (${nearestOffice.vicinity})` : searchQuery.replace(/\+/g, ' ');
    const text = `KrishiSetu Location Share: I found the nearest ${dest} near my location. View here: https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}/@${locationParams.lat},${locationParams.lng},14z`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Helper: Get Office Status (Simulated based on 10AM - 5:45PM IST)
  const isOfficeOpen = () => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeVal = hours + minutes / 60;
    if (day === 0) return false;
    if (day === 6 && timeVal > 13.5) return false;
    return timeVal >= 10 && timeVal <= 17.75;
  };

  // Background Data Fetcher for Nearest Office Card
  useEffect(() => {
    const fetchNearest = async () => {
      if (!locationParams || !searchQuery) return;
      
      try {
        setIsLoadingData(true);
        setRouteInfo({ driving: null, walking: null });
        setOptions({ apiKey: apiKey, version: "weekly" });
        
        // Load the libraries modularly
        const [{ Map }, { PlacesService, PlacesServiceStatus }, { RouteMatrix }] = await Promise.all([
          importLibrary("maps"),
          importLibrary("places"),
          importLibrary("routes")
        ]);
        
        // Create a dummy map element (required for PlacesService)
        const dummyMap = new Map(document.createElement('div'));
        const service = new PlacesService(dummyMap);
        
        const request = {
          location: locationParams,
          radius: '10000', // 10km radius
          query: searchQuery.replace(/\+/g, ' ')
        };

        service.textSearch(request, async (results, status) => {
          if (status === PlacesServiceStatus.OK && results.length > 0) {
            const office = results[0];
            setNearestOffice(office);

            // Fetch Route Matrix for both modes
            try {
              const origins = [{ location: locationParams }];
              const destinations = [{ location: { 
                lat: office.geometry.location.lat(), 
                lng: office.geometry.location.lng() 
              }}];

              const [driveRes, walkRes] = await Promise.all([
                RouteMatrix.computeRouteMatrix({
                  origins,
                  destinations,
                  travelMode: 'DRIVING',
                  fields: ['distanceMeters', 'durationMillis']
                }),
                RouteMatrix.computeRouteMatrix({
                  origins,
                  destinations,
                  travelMode: 'WALKING',
                  fields: ['distanceMeters', 'durationMillis']
                })
              ]);

              setRouteInfo({
                driving: driveRes[0] || null,
                walking: walkRes[0] || null
              });
            } catch (routeErr) {
              console.error("Route Matrix Error:", routeErr);
            }
          } else {
            setNearestOffice(null);
          }
          setIsLoadingData(false);
        });
      } catch (err) {
        console.error("Discovery Error:", err);
        setIsLoadingData(false);
      }
    };

    fetchNearest();
  }, [searchQuery, locationParams, apiKey]);

  const categories = [
    { label: 'Offices', icon: <Building2 size={16} />, query: 'government+offices' },
    { label: 'Tahsildar', icon: <ClipboardList size={16} />, query: 'tahsildar+office' },
    { label: 'Collector', icon: <Building2 size={16} />, query: 'collector+office' },
    { label: 'Panchayat', icon: <Home size={16} />, query: 'gram+panchayat' },
    { label: 'Krishi Bhavan', icon: <Sprout size={16} />, query: 'krishi+bhavan+agriculture+office' },
    { label: 'Banks', icon: <Landmark size={16} />, query: 'nationalized+bank' },
    { label: 'Post Office', icon: <Mail size={16} />, query: 'post+office' },
  ];

  // Map URL with expanded search for better highlights
  const mapUrl = `https://www.google.com/maps?q=${searchQuery}+near+me+government+offices+agriculture+banks&t=k&z=15&output=embed`;

  return (
    <div className="location-tracer-container">
      <div className="tracer-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <MapPin size={24} color="#103567" />
          Nearby Government Offices
          <span className={`office-status-badge ${isOfficeOpen() ? 'open' : 'closed'}`}>
            <Clock size={12} /> {isOfficeOpen() ? 'LIKELY OPEN' : 'LIKELY CLOSED'}
          </span>
        </h3>
        <p style={{ marginTop: '8px', opacity: 0.7 }}>High-resolution satellite discovery of essential agricultural and government offices.</p>
      </div>

      <div className="office-category-shelf">
        {categories.map((item) => (
          <div
            key={item.query}
            onClick={() => onQueryChange(item.query)}
            className={`category-pill ${searchQuery === item.query ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </div>
        ))}
      </div>

      <div className="map-visual-wrapper">
        <iframe
          title="Satellite Office Locator"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
        />
      </div>

      <div className="logistics-action-zone">
        <button className="logistics-btn drive" onClick={() => openNavigation('driving')}>
          <Navigation size={18} /> DRIVE
        </button>
        <button className="logistics-btn walk" onClick={() => openNavigation('walking')}>
          <Users size={18} /> WALK
        </button>
        <button className="logistics-btn share" onClick={shareToWhatsApp}>
          <Send size={18} /> SHARE
        </button>
      </div>

      {/* Discovery Card (Taaza Inspired) */}
      {isLoadingData ? (
        <div className="discovery-card" style={{ justifyContent: 'center', opacity: 0.7 }}>
          <Search size={20} className="spinning" /> 
          <span style={{ fontWeight: 600, fontSize: '0.9rem', marginLeft: '10px' }}>Locating Nearest {searchQuery.split('+')[0]} Building...</span>
        </div>
      ) : nearestOffice ? (
        <div className="discovery-card">
          <div className="discovery-card-icon">
            <Building2 size={28} color="#1e40af" />
          </div>
          <div className="discovery-info">
            <span className="discovery-tag">Nearest Match</span>
            <h4 className="discovery-name">{nearestOffice.name}</h4>
            <p className="discovery-address">
              <MapIcon size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              {nearestOffice.vicinity || nearestOffice.formatted_address}
            </p>
            
            {/* Travel Times Grid */}
            <div className="travel-estimates-grid">
              <div className="estimate-item">
                <Navigation size={14} color="#1e40af" />
                <span className="estimate-label">Drive:</span>
                <span className="estimate-value">{formatDuration(routeInfo.driving?.durationMillis)}</span>
                <span className="estimate-dist">({formatDistance(routeInfo.driving?.distanceMeters)})</span>
              </div>
              <div className="estimate-item">
                <Users size={14} color="#059669" />
                <span className="estimate-label">Walk:</span>
                <span className="estimate-value">{formatDuration(routeInfo.walking?.durationMillis)}</span>
                <span className="estimate-dist">({formatDistance(routeInfo.walking?.distanceMeters)})</span>
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              <Info size={14} /> Tap "DRIVE" or "WALK" buttons above for turn-by-turn routes.
            </div>
          </div>
        </div>
      ) : (
        <div className="discovery-card" style={{ opacity: 0.8, background: 'rgba(0,0,0,0.02)', borderStyle: 'dashed' }}>
          <Info size={20} color="#64748b" />
          <div style={{ marginLeft: '12px' }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#475569' }}>Broadening Search...</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Try selecting a different category or zooming the map.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationMap;
