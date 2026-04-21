const express = require('express');
const router  = express.Router();
const PDFDocument = require('pdfkit');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/msp/generate-pdf
// Body: { crops: [...], filter: 'All Crops' | 'Kharif' | ... }
// Returns a professional government-style PDF table
// ─────────────────────────────────────────────────────────────────────────────
router.post('/generate-pdf', (req, res) => {
  try {
    const { crops = [], filterLabel = 'All Crops', regionLabel = 'All India', categoryLabel = 'All Categories' } = req.body;

    if (!Array.isArray(crops) || crops.length === 0) {
      return res.status(400).json({ success: false, error: 'No crop data provided' });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="MSP_List_KRISHISETU_2025-27.pdf"');
    doc.pipe(res);

    // ── Palette ──────────────────────────────────────────────────────────────
    const GREEN_DARK  = '#0d3d21';
    const GREEN_MID   = '#1a5c2e';
    const GREEN_LIGHT = '#e8f5ec';
    const AMBER       = '#d97706';
    const BLUE        = '#1d4ed8';
    const PURPLE      = '#7c3aed';
    const GREY_DARK   = '#1f2937';
    const GREY_MID    = '#6b7280';
    const GREY_LIGHT  = '#f3f4f6';
    const WHITE       = '#ffffff';
    const RED         = '#dc2626';

    const PW  = doc.page.width;   // 595
    const COL = PW - 80;          // usable width

    // ── HEADER BANNER ────────────────────────────────────────────────────────
    doc.rect(0, 0, PW, 100).fill(GREEN_DARK);

    // Top emblem line
    doc.fillColor('#a7f3d0').font('Helvetica').fontSize(7.5)
      .text('GOVERNMENT OF INDIA  |  MINISTRY OF AGRICULTURE & FARMERS WELFARE  |  CACP APPROVED', 40, 12, {
        width: PW - 80, align: 'center'
      });

    // Horizontal rule under emblem
    doc.rect(40, 24, PW - 80, 0.5).fill('#2d7a47');

    // Title
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(18)
      .text('KRISHISETU — MSP TRACKER 2025–27', 40, 32, { width: PW - 80, align: 'center' });

    doc.fillColor('#bbf7d0').font('Helvetica').fontSize(9)
      .text('Minimum Support Prices (MSP) — Cabinet Committee on Economic Affairs (CCEA)', 40, 57, {
        width: PW - 80, align: 'center'
      });

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.fillColor('#6ee7b7').font('Helvetica').fontSize(8)
      .text(`Generated: ${dateStr}   |   Filter: ${filterLabel}   |   Region: ${regionLabel}   |   Category: ${categoryLabel}`, 40, 76, {
        width: PW - 80, align: 'center'
      });

    // ── FILTER BADGES ROW ────────────────────────────────────────────────────
    const badgeY = 108;
    doc.rect(0, 100, PW, 32).fill('#f0fdf4');
    doc.rect(0, 100, PW, 0.8).fill(GREEN_MID);

    const badges = [
      { label: `Season: ${filterLabel}`,      bg: '#dcfce7', text: GREEN_MID },
      { label: `Region: ${regionLabel}`,       bg: '#dbeafe', text: BLUE      },
      { label: `Category: ${categoryLabel}`,   bg: '#ede9fe', text: PURPLE    },
      { label: `Total Crops: ${crops.length}`, bg: '#fef3c7', text: AMBER     },
    ];
    let bx = 40;
    badges.forEach(b => {
      const tw  = doc.widthOfString(b.label, { fontSize: 7.5 });
      const bw  = tw + 18;
      doc.rect(bx, badgeY, bw, 16).fill(b.bg).stroke(b.bg);
      doc.fillColor(b.text).font('Helvetica-Bold').fontSize(7.5)
        .text(b.label, bx + 8, badgeY + 4, { width: bw });
      bx += bw + 8;
    });

    // ── TABLE HEADER ─────────────────────────────────────────────────────────
    const tableTop = 145;
    const colWidths = { sno: 28, icon: 22, crop: 155, cat: 65, season: 55, msp: 75, prev: 65, inc: 65 };
    const colX = {
      sno:    40,
      icon:   40 + colWidths.sno,
      crop:   40 + colWidths.sno + colWidths.icon,
      cat:    40 + colWidths.sno + colWidths.icon + colWidths.crop,
      season: 40 + colWidths.sno + colWidths.icon + colWidths.crop + colWidths.cat,
      msp:    40 + colWidths.sno + colWidths.icon + colWidths.crop + colWidths.cat + colWidths.season,
      prev:   40 + colWidths.sno + colWidths.icon + colWidths.crop + colWidths.cat + colWidths.season + colWidths.msp,
      inc:    40 + colWidths.sno + colWidths.icon + colWidths.crop + colWidths.cat + colWidths.season + colWidths.msp + colWidths.prev,
    };
    const ROW_H = 22;

    // Header bar
    doc.rect(40, tableTop, COL, ROW_H).fill(GREEN_MID);

    const headers = [
      { key: 'sno',    label: '#',              align: 'center' },
      { key: 'icon',   label: '',               align: 'center' },
      { key: 'crop',   label: 'Crop Name',      align: 'left'   },
      { key: 'cat',    label: 'Category',       align: 'center' },
      { key: 'season', label: 'Season',         align: 'center' },
      { key: 'msp',    label: 'MSP 2025-26',    align: 'right'  },
      { key: 'prev',   label: 'Prev Year MSP',  align: 'right'  },
      { key: 'inc',    label: 'Increase',       align: 'right'  },
    ];

    headers.forEach(h => {
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(7.5)
        .text(h.label, colX[h.key] + 3, tableTop + 7, {
          width: colWidths[h.key] - 6,
          align: h.align
        });
    });

    // ── TABLE ROWS ───────────────────────────────────────────────────────────
    let y = tableTop + ROW_H;

    // Category colour map
    const catColor = { Cereals: AMBER, Pulses: '#059669', Oilseeds: RED, Commercial: PURPLE };
    const seasonColor = { Kharif: AMBER, Rabi: BLUE, Commercial: PURPLE };

    crops.forEach((crop, i) => {
      // Page break check
      if (y + ROW_H > doc.page.height - 70) {
        doc.addPage();
        y = 40;
        // Repeat header
        doc.rect(40, y, COL, ROW_H).fill(GREEN_MID);
        headers.forEach(h => {
          doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(7.5)
            .text(h.label, colX[h.key] + 3, y + 7, { width: colWidths[h.key] - 6, align: h.align });
        });
        y += ROW_H;
      }

      const rowBg = i % 2 === 0 ? WHITE : '#f9fafb';
      doc.rect(40, y, COL, ROW_H).fill(rowBg);

      // Thin row divider
      doc.rect(40, y + ROW_H - 0.5, COL, 0.5).fill('#e5e7eb');

      const increase  = crop.msp - crop.prev;
      const pctInc    = ((increase / crop.prev) * 100).toFixed(1);
      const seasonKey = crop.season === 'Kharif' ? 'Kharif' : crop.season === 'Rabi' ? 'Rabi' : 'Commercial';
      const cc        = catColor[crop.category] || GREY_MID;
      const sc        = seasonColor[seasonKey]   || GREY_MID;

      // S.No
      doc.fillColor(GREY_MID).font('Helvetica').fontSize(8)
        .text(String(i + 1), colX.sno + 3, y + 7, { width: colWidths.sno - 6, align: 'center' });

      // Icon (emoji — as text; PDFKit on some systems may show ?)
      doc.fillColor(GREY_DARK).font('Helvetica').fontSize(9)
        .text(crop.icon || '-', colX.icon + 2, y + 6, { width: colWidths.icon, align: 'center' });

      // Crop Name
      doc.fillColor(GREY_DARK).font('Helvetica-Bold').fontSize(8.5)
        .text(crop.name, colX.crop + 3, y + 7, { width: colWidths.crop - 6 });

      // Category pill
      doc.rect(colX.cat + 4, y + 5, colWidths.cat - 8, 12).fill(cc + '22');
      doc.fillColor(cc).font('Helvetica-Bold').fontSize(7)
        .text(crop.category, colX.cat + 4, y + 8, { width: colWidths.cat - 8, align: 'center' });

      // Season pill
      doc.rect(colX.season + 3, y + 5, colWidths.season - 6, 12).fill(sc + '22');
      doc.fillColor(sc).font('Helvetica-Bold').fontSize(7)
        .text(seasonKey, colX.season + 3, y + 8, { width: colWidths.season - 6, align: 'center' });

      // MSP current (bold green)
      doc.fillColor(GREEN_MID).font('Helvetica-Bold').fontSize(8.5)
        .text(`Rs.${crop.msp.toLocaleString('en-IN')}`, colX.msp + 2, y + 7, { width: colWidths.msp - 6, align: 'right' });

      // Prev MSP (grey)
      doc.fillColor(GREY_MID).font('Helvetica').fontSize(8)
        .text(`Rs.${crop.prev.toLocaleString('en-IN')}`, colX.prev + 2, y + 7, { width: colWidths.prev - 6, align: 'right' });

      // Increase (green badge)
      doc.fillColor('#15803d').font('Helvetica-Bold').fontSize(8)
        .text(`+Rs.${increase.toLocaleString('en-IN')} (${pctInc}%)`, colX.inc + 2, y + 7, { width: colWidths.inc - 6, align: 'right' });

      y += ROW_H;
    });

    // Outer table border
    // (just draw after all rows are done for current page)
    doc.rect(40, tableTop, COL, y - tableTop).stroke('#d1d5db');

    // ── SUMMARY ROW ──────────────────────────────────────────────────────────
    if (y + 24 < doc.page.height - 70) {
      doc.rect(40, y, COL, 24).fill(GREEN_LIGHT);
      doc.fillColor(GREEN_MID).font('Helvetica-Bold').fontSize(8)
        .text(`Total ${crops.length} crops listed  |  Prices in Rs./Quintal (100 kg)  |  Data Source: CACP, Govt of India`,
          44, y + 8, { width: COL - 8 });
      y += 24;
    }

    // ── KEY LEGEND ───────────────────────────────────────────────────────────
    if (y + 40 < doc.page.height - 70) {
      y += 12;
      doc.fillColor(GREY_MID).font('Helvetica-Bold').fontSize(7.5).text('CATEGORY LEGEND:', 40, y);
      y += 12;
      const legendItems = [
        { label: 'Cereals',    color: AMBER  },
        { label: 'Pulses',     color: '#059669' },
        { label: 'Oilseeds',   color: RED    },
        { label: 'Commercial', color: PURPLE },
      ];
      let lx = 40;
      legendItems.forEach(li => {
        doc.rect(lx, y, 10, 10).fill(li.color);
        doc.fillColor(GREY_DARK).font('Helvetica').fontSize(7.5).text(li.label, lx + 14, y + 1);
        lx += 75;
      });
    }

    // ── FOOTER ───────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 52;
    doc.rect(0, footerY, PW, 52).fill(GREEN_DARK);

    doc.fillColor('#a7f3d0').font('Helvetica').fontSize(7.5)
      .text(
        'DISCLAIMER: MSP rates are as approved by CCEA, Govt of India. Rates are in Indian Rupees (Rs.) per Quintal (100 kg).',
        30, footerY + 8, { width: PW - 60, align: 'center' }
      );
    doc.fillColor('#6ee7b7').font('Helvetica').fontSize(7)
      .text(
        'Source: Commission for Agricultural Costs and Prices (CACP) | Ministry of Agriculture & Farmers Welfare',
        30, footerY + 22, { width: PW - 60, align: 'center' }
      );
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8.5)
      .text('KRISHISETU — Empowering Indian Farmers with AI  |  MSP Tracker Module', 30, footerY + 36, {
        width: PW - 60, align: 'center'
      });

    doc.end();

  } catch (err) {
    console.error('[MSP] PDF error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to generate PDF: ' + err.message });
    }
  }
});

module.exports = router;
