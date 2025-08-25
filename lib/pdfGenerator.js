import puppeteer from "puppeteer";

export async function generatePDF(htmlContent, options = {}) {
  let browser;
  try {
    console.log("Starting PDF generation...");
    console.log("HTML content length:", htmlContent.length);

    // Launch browser with more compatible settings
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--single-process",
      ],
    });

    console.log("Browser launched successfully");

    const page = await browser.newPage();
    console.log("New page created");

    // Set content with timeout and better error handling
    await page.setContent(htmlContent, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    console.log("Content set successfully");

    // Wait a bit for any dynamic content to render
    await page.waitForTimeout(2000);

    console.log("Generating PDF...");

    // Generate PDF with optimized settings
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
      preferCSSPageSize: true,
      ...options,
    });

    console.log("PDF generated successfully, size:", pdf.length);
    return pdf;
  } catch (error) {
    console.error("Error generating PDF:", error);
    console.error("Error stack:", error.stack);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log("Browser closed successfully");
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }
  }
}

// Fallback method: Generate HTML that can be printed to PDF
export function generatePrintableHTML(htmlContent, title = "Document") {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 20px;
          font-size: 12px;
          line-height: 1.4;
        }
        .print-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .print-header h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 24px;
        }
        .print-header p {
          margin: 10px 0;
          color: #7f8c8d;
        }
        .print-instructions {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
        }
        .print-instructions h3 {
          margin: 0 0 10px 0;
          color: #856404;
        }
        .print-instructions p {
          margin: 5px 0;
          color: #856404;
        }
        .print-instructions .steps {
          text-align: left;
          max-width: 400px;
          margin: 15px auto;
        }
        .print-instructions .steps ol {
          margin: 0;
          padding-left: 20px;
        }
        .print-instructions .steps li {
          margin: 5px 0;
        }
        .print-button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          margin: 10px;
        }
        .print-button:hover {
          background-color: #0056b3;
        }
        .content {
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Use the print button below to save as PDF</p>
      </div>
      
      <div class="print-instructions no-print">
        <h3>📄 How to Save as PDF</h3>
        <div class="steps">
          <ol>
            <li>Click the "Print to PDF" button below</li>
            <li>In the print dialog, select "Save as PDF" as destination</li>
            <li>Choose your preferred settings and click "Save"</li>
          </ol>
        </div>
        <button class="print-button" onclick="window.print()">🖨️ Print to PDF</button>
      </div>
      
      <div class="content">
        ${htmlContent}
      </div>
      
      <script>
        // Auto-print after a short delay (optional)
        // setTimeout(() => window.print(), 1000);
      </script>
    </body>
    </html>
  `;
}

export function generateCheckinsHTML(data, title = "Check-ins Report") {
  const tableRows = data
    .map(
      (row) => `
    <tr>
      <td>${row["Employee ID"] || "N/A"}</td>
      <td>${row["Employee Name"] || "N/A"}</td>
      <td>${row["Department"] || "N/A"}</td>
      <td>${row["Nationality"] || "N/A"}</td>
      <td>${row["Check-in Time"] || "N/A"}</td>
      <td>${row["Username"] || "N/A"}</td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1.4;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 25px;
          border-bottom: 3px solid #2c3e50;
          padding-bottom: 15px;
        }
        .header h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 22px;
          font-weight: 600;
        }
        .header p {
          margin: 8px 0;
          color: #7f8c8d;
          font-size: 12px;
        }
        .stats {
          display: flex;
          justify-content: space-around;
          margin: 20px 0;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .stat-item {
          text-align: center;
        }
        .stat-value {
          font-size: 18px;
          font-weight: bold;
          color: #2c3e50;
        }
        .stat-label {
          font-size: 10px;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
          border: 1px solid #e1e8ed;
          padding: 10px 8px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background-color: #34495e;
          color: white;
          font-weight: 600;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        tr:hover {
          background-color: #ecf0f1;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 9px;
          color: #95a5a6;
          border-top: 1px solid #ecf0f1;
          padding-top: 15px;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="stats">
        <div class="stat-item">
          <div class="stat-value">${data.length}</div>
          <div class="stat-label">Total Records</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${new Date().toLocaleDateString()}</div>
          <div class="stat-label">Report Date</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Employee Name</th>
            <th>Department</th>
            <th>Nationality</th>
            <th>Check-in Time</th>
            <th>Username</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div class="footer">
        <p>UHP Canteen Management System</p>
        <p>This is an automatically generated report</p>
      </div>
    </body>
    </html>
  `;
}

export function generateReportsHTML(reportData) {
  const tableRows = reportData.data
    .map(
      (row) => `
    <tr>
      ${reportData.columns
        .map((column) => `<td>${row[column] || "N/A"}</td>`)
        .join("")}
    </tr>
  `
    )
    .join("");

  const summaryHTML = reportData.summary
    ? `
    <div class="summary">
      <h3>Summary</h3>
      <table class="summary-table">
        ${Object.entries(reportData.summary)
          .map(
            ([key, value]) => `
          <tr>
            <td><strong>${key.replace(/([A-Z])/g, " $1").trim()}</strong></td>
            <td>${value}</td>
          </tr>
        `
          )
          .join("")}
      </table>
    </div>
  `
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${reportData.title || "Report"}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1.4;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 25px;
          border-bottom: 3px solid #2c3e50;
          padding-bottom: 15px;
        }
        .header h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 22px;
          font-weight: 600;
        }
        .header p {
          margin: 8px 0;
          color: #7f8c8d;
          font-size: 12px;
        }
        .stats {
          display: flex;
          justify-content: space-around;
          margin: 20px 0;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .stat-item {
          text-align: center;
        }
        .stat-value {
          font-size: 18px;
          font-weight: bold;
          color: #2c3e50;
        }
        .stat-label {
          font-size: 10px;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
          border: 1px solid #e1e8ed;
          padding: 10px 8px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background-color: #34495e;
          color: white;
          font-weight: 600;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        tr:hover {
          background-color: #ecf0f1;
        }
        .summary {
          margin-top: 30px;
        }
        .summary h3 {
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
          font-size: 16px;
          margin-bottom: 15px;
        }
        .summary-table {
          width: 60%;
          border: 1px solid #e1e8ed;
        }
        .summary-table th {
          background-color: #3498db;
          color: white;
          padding: 12px 8px;
        }
        .summary-table td {
          padding: 10px 8px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 9px;
          color: #95a5a6;
          border-top: 1px solid #ecf0f1;
          padding-top: 15px;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportData.title || "Report"}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="stats">
        <div class="stat-item">
          <div class="stat-value">${reportData.data.length}</div>
          <div class="stat-label">Total Records</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${new Date().toLocaleDateString()}</div>
          <div class="stat-label">Report Date</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${reportData.columns.length}</div>
          <div class="stat-label">Columns</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            ${reportData.columns.map((column) => `<th>${column}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      ${summaryHTML}
      
      <div class="footer">
        <p>UHP Canteen Management System</p>
        <p>This is an automatically generated report</p>
      </div>
    </body>
    </html>
  `;
}
