const fs = require('fs');

const cssAppend = `
/* Utilities and Animations */
.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #103567;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.high-contrast {
  filter: contrast(150%) saturate(0);
  background: #444;
  color: #fff;
}

.app.high-contrast .sidebar, 
.app.high-contrast .main-content, 
.app.high-contrast .scheme-card, 
.app.high-contrast .hero-section {
  background: #444 !important;
  color: #fff !important;
  border-color: #fff !important;
}

.loading-state, .error-state {
  padding: 20px;
  text-align: center;
  margin-top: 15px;
  border-radius: 4px;
}

.error-state {
  background: #f8dbdf;
  color: #dc3545;
  border: 1px solid #f1aeb5;
}

.scanned-insights {
  margin-top: 20px;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  text-align: left;
}

.scanned-insights h4 {
  color: #103567;
  margin-bottom: 15px;
}

.scanned-insights pre {
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 0.9rem;
  color: #333;
}

/* Location and Taaza */
.location-loading-state {
  padding: 40px;
  text-align: center;
  background: #f8f9fa;
  border: 1px dashed #ced4da;
  border-radius: 4px;
  color: #6c757d;
}

.marquee-wrapper {
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
  padding: 10px 0;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.marquee-content {
  display: inline-flex;
  animation: marquee-scroll 25s linear infinite;
  gap: 20px;
  padding-left: 20px;
}

.marquee-content:hover {
  animation-play-state: paused;
}

@keyframes marquee-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(-50% - 10px)); }
}

.news-item.curved-square {
  background: #ffffff;
  border: 1px solid #dee2e6;
  border-left: 4px solid #103567;
  border-radius: 4px;
  padding: 20px;
  width: 300px;
  min-height: 140px;
  display: inline-flex;
  flex-direction: column;
  white-space: normal;
  vertical-align: top;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  cursor: pointer;
  flex-shrink: 0;
  transition: box-shadow 0.2s;
}

.news-item.curved-square:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
`;

fs.appendFileSync('App.css', cssAppend);
console.log('Appended missing utilities');
