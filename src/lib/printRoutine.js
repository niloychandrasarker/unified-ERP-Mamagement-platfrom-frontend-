/**
 * Universal Academic Routine Print Utility
 * Unified Education Management Platform (UEMP)
 * 
 * Uses an isolated hidden iframe to guarantee:
 * 1. Strictly 1-page printout (A4 portrait or landscape)
 * 2. Complete isolation from Next.js dev overlays (no "3 error" badge)
 * 3. No backdrop modal artifacts or background dashboard DOM bleed
 * 4. Crisp, high-contrast, official academic institutional format
 */

function triggerIframePrint(htmlContent) {
  // Remove any previously created print iframe
  const existingIframe = document.getElementById('uemp-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'uemp-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow.focus();

  // Give fonts and layout a brief moment to render before firing print dialog
  setTimeout(() => {
    try {
      iframe.contentWindow.print();
    } catch (e) {
      console.error('Error triggering iframe print:', e);
    } finally {
      // Clean up iframe after user closes the print dialog
      setTimeout(() => {
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 3000);
    }
  }, 250);
}

/**
 * Print Official Examination Routine
 */
export function printExamRoutine({
  institutionName = 'Unified Education Management Platform',
  institutionAddress = '',
  examName = 'Examination',
  academicYear = '2026',
  schedules = [],
  studentInfo = null,
  classInfo = null,
  isBn = false
}) {
  const titleText = isBn ? 'অফিসিয়াল পরীক্ষার রুটিন ও সময়সূচী' : 'OFFICIAL EXAMINATION TIMETABLE';
  const examBadge = `${examName} — ${academicYear}`;

  const rowsHtml = schedules.length === 0
    ? `<tr><td colspan="6" style="text-align:center; padding: 20px; font-weight: bold; color: #555;">${
        isBn ? 'কোনো পরীক্ষা সময়সূচী পাওয়া যায়নি' : 'No exam schedules found'
      }</td></tr>`
    : schedules.map((rt, idx) => {
        const d = new Date(rt.exam_date);
        const dateStr = !isNaN(d)
          ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : rt.exam_date;
        const dayStr = !isNaN(d)
          ? d.toLocaleDateString('en-GB', { weekday: 'long' })
          : '';

        return `
          <tr>
            <td class="col-center col-bold">${idx + 1}</td>
            <td>
              <div class="date-main">${dateStr}</div>
              <div class="day-sub">${dayStr}</div>
            </td>
            <td>
              <div class="subject-name">${rt.subject_name || '—'}</div>
              ${rt.subject_code ? `<div class="code-sub">Code: ${rt.subject_code}</div>` : ''}
              ${rt.class_name ? `<div class="class-sub">Class: ${rt.class_name}</div>` : ''}
            </td>
            <td>
              <div class="time-main">${rt.start_time || '—'} - ${rt.end_time || '—'}</div>
              ${rt.duration_minutes ? `<div class="time-sub">(${rt.duration_minutes} mins)</div>` : ''}
            </td>
            <td class="col-center font-bold">
              ${rt.room_number ? `Room ${rt.room_number}` : 'TBA'}
            </td>
            <td class="col-center col-bold mark-val">
              ${rt.full_marks || '100'}
            </td>
          </tr>
        `;
      }).join('');

  // Info Box HTML
  let infoBoxHtml = '';
  if (studentInfo) {
    infoBoxHtml = `
      <div class="info-grid student-grid">
        <div class="info-item">
          <span class="info-label">${isBn ? 'শিক্ষার্থীর নাম' : 'Student Name'}:</span>
          <strong class="info-val">${studentInfo.name || '—'}</strong>
        </div>
        <div class="info-item">
          <span class="info-label">${isBn ? 'শিক্ষার্থী আইডি' : 'Student ID'}:</span>
          <strong class="info-val font-mono">${studentInfo.studentId || '—'}</strong>
        </div>
        <div class="info-item">
          <span class="info-label">${isBn ? 'শ্রেণি ও শাখা' : 'Class & Section'}:</span>
          <strong class="info-val">${studentInfo.className || '—'} ${studentInfo.sectionName ? `(${studentInfo.sectionName})` : ''}</strong>
        </div>
        <div class="info-item">
          <span class="info-label">${isBn ? 'রোল নম্বর' : 'Roll Number'}:</span>
          <strong class="info-val font-mono">${studentInfo.rollNumber || '—'}</strong>
        </div>
      </div>
    `;
  } else if (classInfo) {
    infoBoxHtml = `
      <div class="info-grid class-grid">
        <div class="info-item">
          <span class="info-label">${isBn ? 'লক্ষ্য শ্রেণি' : 'Target Class'}:</span>
          <strong class="info-val">${classInfo.className || (isBn ? 'সকল শ্রেণি' : 'All Classes')}</strong>
        </div>
        ${classInfo.sectionName ? `
        <div class="info-item">
          <span class="info-label">${isBn ? 'শাখা' : 'Section'}:</span>
          <strong class="info-val">${classInfo.sectionName}</strong>
        </div>` : ''}
        <div class="info-item">
          <span class="info-label">${isBn ? 'শিক্ষাবর্ষ' : 'Academic Year'}:</span>
          <strong class="info-val font-mono">${academicYear}</strong>
        </div>
        <div class="info-item">
          <span class="info-label">${isBn ? 'মোট বিষয়' : 'Total Subjects'}:</span>
          <strong class="info-val font-mono">${schedules.length}</strong>
        </div>
      </div>
    `;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${examBadge} - ${institutionName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        body {
          color: #000;
          background: #fff;
          font-size: 11px;
          line-height: 1.35;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page-container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 20mm);
          justify-content: space-between;
        }
        .main-content {
          flex: 1;
        }
        /* Top Institution Header */
        .institution-header {
          text-align: center;
          padding-bottom: 8px;
          border-bottom: 2.5px solid #000;
          margin-bottom: 10px;
        }
        .institution-name {
          font-size: 24px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #000;
          line-height: 1.2;
          margin-bottom: 3px;
        }
        .institution-address {
          font-size: 11px;
          color: #222;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .badge-wrap {
          margin-top: 4px;
        }
        .exam-badge {
          display: inline-block;
          background: #000;
          color: #fff;
          padding: 3px 14px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-radius: 4px;
        }
        .exam-subtitle {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: #111;
          margin-top: 3px;
        }
        /* Info Grid */
        .info-grid {
          display: grid;
          padding: 7px 12px;
          background: #f8fafc;
          border: 1.5px solid #000;
          border-radius: 6px;
          margin-bottom: 12px;
          gap: 6px 14px;
        }
        .student-grid {
          grid-template-columns: repeat(4, 1fr);
        }
        .class-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          color: #555;
          letter-spacing: 0.3px;
        }
        .info-val {
          font-size: 12px;
          font-weight: 800;
          color: #000;
        }
        .font-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        /* Timetable Table */
        .timetable-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          margin-bottom: 12px;
        }
        .timetable-table th {
          background: #e2e8f0;
          color: #000;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 6px 8px;
          border: 1.5px solid #000;
          text-align: left;
        }
        .timetable-table td {
          padding: 6px 8px;
          border: 1.5px solid #000;
          vertical-align: middle;
          font-size: 11px;
        }
        .timetable-table tbody tr:nth-child(even) {
          background-color: #fafafa;
        }
        .col-center {
          text-align: center;
        }
        .col-bold {
          font-weight: 800;
        }
        .date-main {
          font-weight: 800;
          color: #000;
        }
        .day-sub {
          font-size: 9.5px;
          font-weight: 600;
          color: #444;
        }
        .subject-name {
          font-weight: 800;
          font-size: 12px;
          color: #000;
        }
        .code-sub {
          font-size: 9px;
          color: #444;
          font-family: ui-monospace, monospace;
        }
        .class-sub {
          font-size: 9px;
          font-weight: 700;
          color: #1e40af;
        }
        .time-main {
          font-weight: 700;
          font-family: ui-monospace, monospace;
          color: #000;
        }
        .time-sub {
          font-size: 9.5px;
          color: #555;
        }
        .mark-val {
          font-size: 12px;
          font-family: ui-monospace, monospace;
        }
        /* Notice / Instructions */
        .exam-instructions {
          font-size: 9.5px;
          color: #333;
          border: 1px dashed #666;
          border-radius: 4px;
          padding: 6px 10px;
          margin-bottom: 12px;
          line-height: 1.4;
        }
        .exam-instructions strong {
          color: #000;
        }
        /* Signatures Block (Guaranteed inside page) */
        .signatures-block {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 35px;
          padding-bottom: 5px;
          page-break-inside: avoid;
        }
        .sig-col {
          text-align: center;
          width: 170px;
        }
        .sig-line {
          border-bottom: 1.5px solid #000;
          margin-bottom: 4px;
        }
        .sig-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #000;
        }
        .footer-note {
          text-align: center;
          font-size: 8px;
          color: #777;
          border-top: 1px solid #ddd;
          padding-top: 4px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <div class="main-content">
          <!-- Institution Header -->
          <div class="institution-header">
            <h1 class="institution-name">${institutionName}</h1>
            ${institutionAddress ? `<p class="institution-address">${institutionAddress}</p>` : ''}
            <div class="badge-wrap">
              <span class="exam-badge">${examBadge}</span>
            </div>
            <div class="exam-subtitle">${titleText}</div>
          </div>

          <!-- Student or Class Info Box -->
          ${infoBoxHtml}

          <!-- Timetable Table -->
          <table class="timetable-table">
            <thead>
              <tr>
                <th style="width: 28px; text-align: center;">#</th>
                <th style="width: 110px;">${isBn ? 'তারিখ ও দিন' : 'Date & Day'}</th>
                <th>${isBn ? 'বিষয় ও কোড' : 'Subject & Code'}</th>
                <th style="width: 140px;">${isBn ? 'সময়সূচী' : 'Exam Timing'}</th>
                <th style="width: 70px; text-align: center;">${isBn ? 'কক্ষ নম্বর' : 'Room'}</th>
                <th style="width: 60px; text-align: center;">${isBn ? 'পূর্ণমান' : 'Marks'}</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <!-- Essential Instructions -->
          <div class="exam-instructions">
            <strong>${isBn ? 'জরুরি নির্দেশাবলী:' : 'Instructions:'}</strong>
            ${isBn 
              ? 'পরীক্ষা শুরুর অন্তত ১৫ মিনিট পূর্বে কক্ষে উপস্থিত হতে হবে। প্রবেশপত্র ও প্রয়োজনীয় শিক্ষা উপকরণ সঙ্গে রাখতে হবে। মোবাইল ফোন সম্পূর্ণ নিষিদ্ধ।'
              : 'Candidates must enter the examination hall 15 minutes prior to the start time with valid admit card. Mobile phones and unauthorized materials are strictly prohibited.'
            }
          </div>
        </div>

        <!-- Official Signatures -->
        <div>
          <div class="signatures-block">
            <div class="sig-col">
              <div class="sig-line"></div>
              <div class="sig-label">${isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}</div>
            </div>
            <div class="sig-col">
              <div class="sig-line"></div>
              <div class="sig-label">${isBn ? 'পরীক্ষা নিয়ন্ত্রক' : 'Controller of Exams'}</div>
            </div>
            <div class="sig-col">
              <div class="sig-line"></div>
              <div class="sig-label">${isBn ? 'অধ্যক্ষ / প্রতিষ্ঠান প্রধান' : 'Principal / Headmaster'}</div>
            </div>
          </div>
          <div class="footer-note">
            ${institutionName} • ${isBn ? 'স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত অফিশিয়াল কপি' : 'System Generated Official Examination Timetable'}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  triggerIframePrint(fullHtml);
}

/**
 * Print Weekly Class Routine
 */
export function printClassRoutine({
  institutionName = 'Unified Education Management Platform',
  institutionAddress = '',
  className = 'Class',
  sectionName = '',
  academicYear = '2026',
  routines = [],
  periodTimings = [],
  isBn = false
}) {
  const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'SATURDAY'];
  const dayNames = {
    SUNDAY: isBn ? 'রবিবার' : 'Sunday',
    MONDAY: isBn ? 'সোমবার' : 'Monday',
    TUESDAY: isBn ? 'মঙ্গলবার' : 'Tuesday',
    WEDNESDAY: isBn ? 'বুধবার' : 'Wednesday',
    THURSDAY: isBn ? 'বৃহস্পতিবার' : 'Thursday',
    SATURDAY: isBn ? 'শনিবার' : 'Saturday',
  };

  // Group by day
  const activeDays = daysOfWeek.filter(day => routines.some(r => r.day_of_week === day));

  const daySectionsHtml = activeDays.length === 0
    ? `<tr><td colspan="5" style="text-align:center; padding: 25px; font-weight: bold; color: #555;">${
        isBn ? 'কোনো ক্লাস রুটিন পাওয়া যায়নি' : 'No class routine records found'
      }</td></tr>`
    : activeDays.map(day => {
        const periods = routines
          .filter(r => r.day_of_week === day)
          .sort((a, b) => (a.period_number || 0) - (b.period_number || 0));

        return periods.map((p, pIdx) => `
          <tr>
            ${pIdx === 0 ? `<td rowspan="${periods.length}" class="day-cell col-bold">${dayNames[day]}</td>` : ''}
            <td class="col-center col-bold">Period ${p.period_number}</td>
            <td class="col-center font-mono">${p.start_time || '—'} - ${p.end_time || '—'}</td>
            <td>
              <div class="subject-name">${p.subject_name || '—'}</div>
              ${p.subject_code ? `<div class="code-sub">Code: ${p.subject_code}</div>` : ''}
            </td>
            <td>
              <div class="teacher-name">${p.teacher_name || '—'}</div>
              ${p.room_number ? `<div class="room-sub">Room: ${p.room_number}</div>` : ''}
            </td>
          </tr>
        `).join('');
      }).join('');

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Class Routine - ${className} ${sectionName ? `(${sectionName})` : ''}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        body {
          color: #000;
          background: #fff;
          font-size: 11px;
          line-height: 1.35;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 20mm);
          justify-content: space-between;
        }
        .main-content {
          flex: 1;
        }
        .institution-header {
          text-align: center;
          padding-bottom: 8px;
          border-bottom: 2.5px solid #000;
          margin-bottom: 10px;
        }
        .institution-name {
          font-size: 24px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #000;
          margin-bottom: 3px;
        }
        .institution-address {
          font-size: 11px;
          color: #222;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .badge-wrap {
          margin-top: 4px;
        }
        .routine-badge {
          display: inline-block;
          background: #000;
          color: #fff;
          padding: 3px 14px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-radius: 4px;
        }
        .routine-subtitle {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: #111;
          margin-top: 3px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          padding: 7px 12px;
          background: #f8fafc;
          border: 1.5px solid #000;
          border-radius: 6px;
          margin-bottom: 12px;
          gap: 6px 14px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          color: #555;
        }
        .info-val {
          font-size: 12px;
          font-weight: 800;
          color: #000;
        }
        .font-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .routine-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          margin-bottom: 12px;
        }
        .routine-table th {
          background: #e2e8f0;
          color: #000;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 6px 8px;
          border: 1.5px solid #000;
          text-align: left;
        }
        .routine-table td {
          padding: 5px 8px;
          border: 1.5px solid #000;
          vertical-align: middle;
          font-size: 11px;
        }
        .col-center {
          text-align: center;
        }
        .col-bold {
          font-weight: 800;
        }
        .day-cell {
          background: #f1f5f9;
          text-align: center;
          vertical-align: middle;
          font-size: 12px;
          letter-spacing: 0.5px;
        }
        .subject-name {
          font-weight: 800;
          color: #000;
        }
        .code-sub {
          font-size: 9px;
          color: #555;
          font-family: ui-monospace, monospace;
        }
        .teacher-name {
          font-weight: 700;
          color: #1e293b;
        }
        .room-sub {
          font-size: 9.5px;
          font-weight: 600;
          color: #475569;
        }
        .signatures-block {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 35px;
          padding-bottom: 5px;
          page-break-inside: avoid;
        }
        .sig-col {
          text-align: center;
          width: 180px;
        }
        .sig-line {
          border-bottom: 1.5px solid #000;
          margin-bottom: 4px;
        }
        .sig-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #000;
        }
        .footer-note {
          text-align: center;
          font-size: 8px;
          color: #777;
          border-top: 1px solid #ddd;
          padding-top: 4px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <div class="main-content">
          <div class="institution-header">
            <h1 class="institution-name">${institutionName}</h1>
            ${institutionAddress ? `<p class="institution-address">${institutionAddress}</p>` : ''}
            <div class="badge-wrap">
              <span class="routine-badge">${isBn ? 'সাপ্তাহিক ক্লাস রুটিন' : 'WEEKLY CLASS TIMETABLE'}</span>
            </div>
            <div class="routine-subtitle">${className} ${sectionName ? `(${sectionName})` : ''} — ${academicYear}</div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">${isBn ? 'শ্রেণি' : 'Class'}:</span>
              <strong class="info-val">${className}</strong>
            </div>
            <div class="info-item">
              <span class="info-label">${isBn ? 'শাখা' : 'Section'}:</span>
              <strong class="info-val">${sectionName || (isBn ? 'সকল শাখা' : 'All Sections')}</strong>
            </div>
            <div class="info-item">
              <span class="info-label">${isBn ? 'শিক্ষাবর্ষ' : 'Academic Session'}:</span>
              <strong class="info-val font-mono">${academicYear}</strong>
            </div>
          </div>

          <table class="routine-table">
            <thead>
              <tr>
                <th style="width: 100px; text-align: center;">${isBn ? 'দিন' : 'Day'}</th>
                <th style="width: 90px; text-align: center;">${isBn ? 'পিরিয়ড' : 'Period'}</th>
                <th style="width: 140px; text-align: center;">${isBn ? 'সময়সূচী' : 'Time'}</th>
                <th>${isBn ? 'বিষয়' : 'Subject'}</th>
                <th style="width: 180px;">${isBn ? 'শিক্ষক ও কক্ষ' : 'Teacher & Room'}</th>
              </tr>
            </thead>
            <tbody>
              ${daySectionsHtml}
            </tbody>
          </table>
        </div>

        <div>
          <div class="signatures-block">
            <div class="sig-col">
              <div class="sig-line"></div>
              <div class="sig-label">${isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}</div>
            </div>
            <div class="sig-col">
              <div class="sig-line"></div>
              <div class="sig-label">${isBn ? 'রুটিন ইনচার্জ' : 'Routine In-Charge'}</div>
            </div>
            <div class="sig-col">
              <div class="sig-line"></div>
              <div class="sig-label">${isBn ? 'অধ্যক্ষ / প্রতিষ্ঠান প্রধান' : 'Principal / Headmaster'}</div>
            </div>
          </div>
          <div class="footer-note">
            ${institutionName} • ${isBn ? 'স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত অফিশিয়াল কপি' : 'Official Academic Routine'}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  triggerIframePrint(fullHtml);
}

