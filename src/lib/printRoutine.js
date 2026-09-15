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

export { triggerIframePrint };

/**
 * Print Official Staff / Faculty Login Credentials Slip
 */
export function printCredentialSlip({
  staff = {},
  institution = {},
  portalUrl = '',
  isBn = false
}) {
  const institutionName = institution?.name || 'Unified Education Management Platform';
  const institutionAddress = institution?.address || '';
  const staffName = staff.name || 'Staff Member';
  const designation = staff.designation || (isBn ? 'শিক্ষক / স্টাফ' : 'Faculty Member');
  const additional = staff.additional_designation ? ` (${staff.additional_designation})` : '';
  const email = staff.email || '—';
  const staffId = staff.employee_id || staff.username || staff.id?.slice(0, 8) || '—';
  const department = staff.department || (isBn ? 'সাধারণ' : 'General');
  const password = staff.initial_password || 'Staff@2026';
  const effectivePortalUrl = portalUrl || (typeof window !== 'undefined' ? `${window.location.origin}/login` : 'http://localhost:3000/login');
  const generatedAt = new Date().toLocaleString(isBn ? 'bn-BD' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Login Credentials - ${staffName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 20mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        body {
          background: #fff;
          color: #000;
          padding: 20px 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .slip-card {
          max-width: 600px;
          margin: 0 auto;
          border: 2px solid #0f172a;
          border-radius: 12px;
          padding: 24px 28px;
          background: #ffffff;
          position: relative;
        }
        .slip-header {
          text-align: center;
          border-bottom: 2px dashed #0f172a;
          padding-bottom: 14px;
          margin-bottom: 18px;
        }
        .inst-title {
          font-size: 20px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #0f172a;
        }
        .inst-sub {
          font-size: 11px;
          color: #475569;
          margin-top: 2px;
        }
        .badge-title {
          display: inline-block;
          margin-top: 8px;
          background: #0f172a;
          color: #fff;
          padding: 3px 14px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        .info-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
        }
        .label-col {
          width: 38%;
          color: #64748b;
          font-weight: 600;
        }
        .val-col {
          color: #0f172a;
          font-weight: 800;
        }
        .highlight-box {
          display: inline-block;
          background: #f1f5f9;
          border: 1.5px solid #cbd5e1;
          padding: 3px 10px;
          border-radius: 6px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.5px;
        }
        .url-box {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px 12px;
          font-family: ui-monospace, monospace;
          font-size: 11px;
          color: #1d4ed8;
          word-break: break-all;
          margin-top: 4px;
        }
        .instructions {
          background: #f8fafc;
          border-left: 3px solid #0f172a;
          padding: 10px 14px;
          font-size: 11px;
          line-height: 1.45;
          color: #334155;
          margin-bottom: 24px;
          border-radius: 0 6px 6px 0;
        }
        .instructions strong {
          color: #0f172a;
        }
        .sig-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 30px;
        }
        .sig-box {
          text-align: center;
          width: 180px;
        }
        .sig-line {
          border-top: 1.5px solid #000;
          margin-bottom: 5px;
        }
        .sig-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .footer-bar {
          text-align: center;
          font-size: 9px;
          color: #94a3b8;
          margin-top: 18px;
          border-top: 1px solid #f1f5f9;
          padding-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="slip-card">
        <div class="slip-header">
          <h1 class="inst-title">${institutionName}</h1>
          ${institutionAddress ? `<p class="inst-sub">${institutionAddress}</p>` : ''}
          <div>
            <span class="badge-title">${isBn ? 'অফিসিয়াল শিক্ষক ও স্টাফ লগইন স্লিপ' : 'OFFICIAL FACULTY & STAFF LOGIN SLIP'}</span>
          </div>
        </div>

        <table class="info-table">
          <tr>
            <td class="label-col">${isBn ? 'শিক্ষক / কর্মচারীর নাম:' : 'Full Name:'}</td>
            <td class="val-col">${staffName}</td>
          </tr>
          <tr>
            <td class="label-col">${isBn ? 'পদবি ও দায়িত্ব:' : 'Designation & Role:'}</td>
            <td class="val-col">${designation}${additional}</td>
          </tr>
          <tr>
            <td class="label-col">${isBn ? 'বিভাগ (Department):' : 'Department:'}</td>
            <td class="val-col">${department}</td>
          </tr>
          ${staffId !== '—' ? `
          <tr>
            <td class="label-col">${isBn ? 'এমপ্লয়ি / স্টাফ আইডি:' : 'Staff ID / Code:'}</td>
            <td class="val-col"><span style="font-family: ui-monospace, monospace;">${staffId}</span></td>
          </tr>` : ''}
          <tr>
            <td class="label-col">${isBn ? 'লগইন ইমেইল:' : 'Official Email / ID:'}</td>
            <td class="val-col" style="font-family: ui-monospace, monospace; color: #1e293b;">${email}</td>
          </tr>
          <tr>
            <td class="label-col">${isBn ? 'প্রাথমিক পাসওয়ার্ড:' : 'Initial Password:'}</td>
            <td class="val-col">
              <span class="highlight-box">${password}</span>
            </td>
          </tr>
        </table>

        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 2px;">
            ${isBn ? 'পোর্টাল ডিরেক্ট লিংক (Web Access):' : 'Portal Access URL:'}
          </div>
          <div class="url-box">${effectivePortalUrl}</div>
        </div>

        <div class="instructions">
          <strong>${isBn ? 'নিরাপত্তা ও ব্যবহার নির্দেশিকা:' : 'Security & Login Instructions:'}</strong><br />
          ${isBn 
            ? '১. এই লগইন স্লিপটি অত্যন্ত গোপনীয়। আপনার পাসওয়ার্ড কারো সাথে শেয়ার করবেন না।<br />২. প্রথমবার পোর্টালে লগইন করার পর অবিলম্বে আপনার পছন্দমতো নতুন শক্তিশালী পাসওয়ার্ড সেট করুন।'
            : '1. Keep this login slip strictly confidential. Never share your password with anyone.<br />2. Log in using the portal URL and change your temporary password immediately upon first sign-in.'
          }
        </div>

        <div class="sig-row">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-title">${isBn ? 'গ্রহণকারীর স্বাক্ষর' : 'Staff / Recipient Signature'}</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-title">${isBn ? 'অনুমোদনকারী প্রধানের স্বাক্ষর ও সিল' : 'Authorized Authority / Seal'}</div>
          </div>
        </div>

        <div class="footer-bar">
          ${institutionName} • Generated: ${generatedAt} • Unified Education Management Platform (UEMP)
        </div>
      </div>
    </body>
    </html>
  `;

  triggerIframePrint(fullHtml);
}

/**
 * Print Official Student Fee Invoice Voucher
 */
export function printFeeInvoice({
  invoice = {},
  institution = {},
  isBn = false
}) {
  const institutionName = institution?.name || 'Unified Education Management Platform';
  const institutionAddress = institution?.address || '';
  const invoiceNumber = invoice.invoice_number || 'INV-2026';
  const monthLabel = invoice.month_label || invoice.month || 'Current Period';
  const studentName = invoice.student_name || 'Student';
  const studentCode = invoice.student_code || invoice.student_id || '—';
  const className = invoice.class_name || 'Class';
  const sectionName = invoice.section_name ? ` (${invoice.section_name})` : '';
  const roll = invoice.roll_number || '—';
  const totalAmount = parseFloat(invoice.total_amount || 0).toLocaleString();
  const paidAmount = parseFloat(invoice.paid_amount || 0).toLocaleString();
  const dueAmount = parseFloat(invoice.due_amount || 0).toLocaleString();
  const status = invoice.status || 'UNPAID';
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [{ name: 'Tuition Fee / মাসিক বেতন', amount: invoice.total_amount || 0 }];
  const generatedAt = new Date().toLocaleString(isBn ? 'bn-BD' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const itemsRows = items.map((itm, idx) => `
    <tr>
      <td style="text-align: center; width: 35px; border: 1px solid #cbd5e1; padding: 6px 8px;">${idx + 1}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: 600;">${itm.name || 'Tuition Fee'}</td>
      <td style="text-align: right; width: 120px; border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: 800; font-family: ui-monospace, monospace;">৳ ${parseFloat(itm.amount || 0).toLocaleString()}</td>
    </tr>
  `).join('');

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Fee Invoice - ${invoiceNumber}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 20mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        body {
          background: #fff;
          color: #000;
          padding: 10px 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .invoice-card {
          max-width: 650px;
          margin: 0 auto;
          border: 2px solid #0f172a;
          border-radius: 12px;
          padding: 24px 28px;
        }
        .invoice-header {
          text-align: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .inst-title {
          font-size: 22px;
          font-weight: 900;
          text-transform: uppercase;
          color: #0f172a;
        }
        .inst-sub {
          font-size: 11px;
          color: #475569;
          margin-top: 2px;
        }
        .badge-title {
          display: inline-block;
          margin-top: 8px;
          background: #0f172a;
          color: #fff;
          padding: 4px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .meta-grid {
          display: flex;
          justify-content: space-between;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 12px;
          margin-bottom: 16px;
        }
        .meta-col {
          line-height: 1.6;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 12px;
        }
        .items-table th {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 7px 8px;
          text-align: left;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 10px;
        }
        .totals-box {
          border: 1.5px solid #0f172a;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 20px;
          font-size: 12px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 7px 14px;
          border-bottom: 1px solid #e2e8f0;
        }
        .totals-row:last-child {
          border-bottom: none;
          background: #0f172a;
          color: #fff;
          font-weight: 800;
          font-size: 14px;
        }
        .sig-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 35px;
        }
        .sig-box {
          text-align: center;
          width: 170px;
        }
        .sig-line {
          border-top: 1.5px solid #000;
          margin-bottom: 5px;
        }
        .sig-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .footer-bar {
          text-align: center;
          font-size: 9px;
          color: #94a3b8;
          margin-top: 16px;
          border-top: 1px solid #f1f5f9;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="invoice-header">
          <h1 class="inst-title">${institutionName}</h1>
          ${institutionAddress ? `<p class="inst-sub">${institutionAddress}</p>` : ''}
          <div>
            <span class="badge-title">${isBn ? 'শিক্ষার্থী ফি ইনভয়েস ভাউচার' : 'STUDENT FEE INVOICE VOUCHER'}</span>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-col">
            <div><strong>${isBn ? 'ইনভয়েস নম্বর:' : 'Invoice No:'}</strong> <span style="font-family: ui-monospace, monospace;">${invoiceNumber}</span></div>
            <div><strong>${isBn ? 'শিক্ষার্থীর নাম:' : 'Student Name:'}</strong> ${studentName}</div>
            <div><strong>${isBn ? 'শিক্ষার্থী আইডি:' : 'Student ID:'}</strong> <span style="font-family: ui-monospace, monospace;">${studentCode}</span></div>
          </div>
          <div class="meta-col" style="text-align: right;">
            <div><strong>${isBn ? 'বিলিং মাস:' : 'Billing Period:'}</strong> ${monthLabel}</div>
            <div><strong>${isBn ? 'শ্রেণি ও শাখা:' : 'Class & Section:'}</strong> ${className}${sectionName}</div>
            <div><strong>${isBn ? 'রোল নম্বর:' : 'Roll:'}</strong> ${roll}</div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align: center; width: 35px;">#</th>
              <th>${isBn ? 'ফি বিবরণ' : 'Particulars / Fee Description'}</th>
              <th style="text-align: right; width: 120px;">${isBn ? 'পরিমাণ (টাকা)' : 'Amount (BDT)'}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="totals-box">
          <div class="totals-row">
            <span>${isBn ? 'মোট ইনভয়েস মূল্য:' : 'Total Invoiced:'}</span>
            <strong style="font-family: ui-monospace, monospace;">৳ ${totalAmount}</strong>
          </div>
          <div class="totals-row" style="color: #059669;">
            <span>${isBn ? 'পরিশোধিত অর্থ:' : 'Paid Amount:'}</span>
            <strong style="font-family: ui-monospace, monospace;">৳ ${paidAmount}</strong>
          </div>
          <div class="totals-row">
            <span>${isBn ? 'অবশিষ্ট বকেয়া:' : 'Net Remaining Due:'}</span>
            <span style="font-family: ui-monospace, monospace;">৳ ${dueAmount}</span>
          </div>
        </div>

        <div class="sig-row">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-title">${isBn ? 'অভিভাবক / শিক্ষার্থীর স্বাক্ষর' : 'Guardian / Student Signature'}</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-title">${isBn ? 'হিসাবরক্ষণ কর্মকর্তার স্বাক্ষর ও সিল' : 'Accounts Officer / Seal'}</div>
          </div>
        </div>

        <div class="footer-bar">
          ${institutionName} • Status: ${status} • Generated: ${generatedAt}
        </div>
      </div>
    </body>
    </html>
  `;

  triggerIframePrint(fullHtml);
}

/**
 * Print Official Money Receipt (Payment Voucher with Student & Office Copy)
 */
export function printMoneyReceipt({
  receipt = {},
  allocatedInvoices = [],
  totalRemainingDue = 0,
  isBn = false
}) {
  const institutionName = receipt.institution_name || 'Unified Education Management Platform';
  const institutionAddress = receipt.institution_address || '';
  const institutionPhone = receipt.institution_phone || '';
  const receiptNo = receipt.receipt_number || 'REC-2026';
  const paymentDate = receipt.payment_date ? new Date(receipt.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const studentName = receipt.student_name || 'Student';
  const studentCode = receipt.student_code || '—';
  const className = receipt.class_name || 'Class';
  const sectionName = receipt.section_name ? ` (${receipt.section_name})` : '';
  const roll = receipt.roll_number || '—';
  const method = receipt.payment_method === 'CASH' ? (isBn ? 'নগদ ক্যাশ (CASH)' : 'Cash Counter') : (receipt.payment_method || 'CASH');
  const trxId = receipt.transaction_id ? `TrxID: ${receipt.transaction_id}` : '';
  const amountPaid = parseFloat(receipt.amount_paid || 0).toLocaleString();
  const dueRemaining = parseFloat(totalRemainingDue || 0).toLocaleString();

  const allocatedRows = (allocatedInvoices && allocatedInvoices.length > 0 ? allocatedInvoices : []).map(a => `
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 4px 6px; font-weight: 700;">${a.month_label || '—'}</td>
      <td style="border: 1px solid #cbd5e1; padding: 4px 6px; font-family: ui-monospace, monospace; color: #64748b;">${a.invoice_number || '—'}</td>
      <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right; font-weight: 800; font-family: ui-monospace, monospace;">৳ ${parseFloat(a.allocated_amount || 0).toLocaleString()}</td>
    </tr>
  `).join('');

  const makeVoucherBlock = (copyLabel) => `
    <div class="voucher-box">
      <div class="voucher-header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h2 class="inst-name">${institutionName}</h2>
            <p class="inst-sub">${institutionAddress} ${institutionPhone ? `• Phone: ${institutionPhone}` : ''}</p>
          </div>
          <div style="text-align: right;">
            <span class="copy-badge">${copyLabel}</span>
          </div>
        </div>
        <div class="title-strip">
          <span class="title-text">${isBn ? 'ফি আদায়ের অফিসিয়াল রসিদ (MONEY RECEIPT)' : 'OFFICIAL MONEY RECEIPT / PAYMENT VOUCHER'}</span>
        </div>
      </div>

      <div class="meta-row">
        <div>
          <div><strong>Receipt No:</strong> <span style="font-family: ui-monospace, monospace;">${receiptNo}</span></div>
          <div><strong>Date:</strong> ${paymentDate}</div>
          <div><strong>Method:</strong> <span style="font-weight: 800; color: #059669;">${method}</span> ${trxId}</div>
        </div>
        <div style="text-align: right;">
          <div><strong>Student:</strong> <span style="font-weight: 800;">${studentName}</span></div>
          <div><strong>ID:</strong> <span style="font-family: ui-monospace, monospace;">${studentCode}</span> | <strong>Roll:</strong> ${roll}</div>
          <div><strong>Class:</strong> ${className}${sectionName}</div>
        </div>
      </div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th>${isBn ? 'মাস / খাত' : 'Billing Month / Particulars'}</th>
            <th>${isBn ? 'ইনভয়েস নং' : 'Invoice #'}</th>
            <th style="text-align: right;">${isBn ? 'জমা অর্থ (টাকা)' : 'Paid Amount (BDT)'}</th>
          </tr>
        </thead>
        <tbody>
          ${allocatedRows || `<tr><td colspan="3" style="text-align: center; padding: 6px;">Fee Payment Received</td></tr>`}
        </tbody>
      </table>

      <div class="total-bar">
        <div>
          <span style="font-size: 10px; color: #475569;">${isBn ? 'অবশিষ্ট মোট বকেয়া:' : 'Remaining Total Dues:'}</span>
          <div style="font-weight: 800; color: #dc2626; font-family: ui-monospace, monospace;">৳ ${dueRemaining}</div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 10px; color: #475569;">${isBn ? 'আজ পরিশোধিত টাকা:' : 'Total Paid Today:'}</span>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a; font-family: ui-monospace, monospace;">৳ ${amountPaid}</div>
        </div>
      </div>

      <div class="sig-row">
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-title">${isBn ? 'শিক্ষার্থী / অভিভাবক' : 'Student / Guardian'}</div>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-title">${isBn ? 'আদায়কারীর স্বাক্ষর ও সিল' : 'Authorized Cashier / Seal'}</div>
        </div>
      </div>
    </div>
  `;

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Money Receipt - ${receiptNo}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 15mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        body {
          background: #fff;
          color: #000;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page-wrap {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .voucher-box {
          border: 1.5px solid #0f172a;
          border-radius: 8px;
          padding: 14px 18px;
          background: #fff;
        }
        .inst-name {
          font-size: 16px;
          font-weight: 900;
          text-transform: uppercase;
          color: #0f172a;
        }
        .inst-sub {
          font-size: 10px;
          color: #475569;
        }
        .copy-badge {
          display: inline-block;
          background: #0f172a;
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 3px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .title-strip {
          text-align: center;
          margin-top: 6px;
          padding-top: 4px;
          border-top: 1px solid #cbd5e1;
        }
        .title-text {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #0f172a;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 10px;
          margin-top: 8px;
          margin-bottom: 8px;
          font-size: 10.5px;
          line-height: 1.45;
        }
        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          margin-bottom: 8px;
        }
        .receipt-table th {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 4px 6px;
          text-align: left;
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .total-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          border: 1.5px solid #0f172a;
          border-radius: 6px;
          padding: 6px 12px;
          margin-bottom: 12px;
        }
        .sig-row {
          display: flex;
          justify-content: space-between;
          padding-top: 20px;
        }
        .sig-box {
          text-align: center;
          width: 150px;
        }
        .sig-line {
          border-top: 1.2px solid #000;
          margin-bottom: 3px;
        }
        .sig-title {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .scissor-line {
          border-top: 1px dashed #64748b;
          text-align: center;
          position: relative;
          margin: 6px 0;
        }
        .scissor-line span {
          background: #fff;
          padding: 0 10px;
          font-size: 9px;
          color: #64748b;
          position: relative;
          top: -8px;
        }
      </style>
    </head>
    <body>
      <div class="page-wrap">
        ${makeVoucherBlock(isBn ? 'শিক্ষার্থীর কপি (Student Copy)' : 'STUDENT COPY')}
        <div class="scissor-line">
          <span>✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂</span>
        </div>
        ${makeVoucherBlock(isBn ? 'অফিস / ব্যাংক কপি (Office Copy)' : 'OFFICE / ACCOUNTS COPY')}
      </div>
    </body>
    </html>
  `;

  triggerIframePrint(fullHtml);
}


