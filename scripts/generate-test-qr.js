const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generateTestQR() {
  try {
    console.log('🔍 Generating test QR codes...\n');

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Generate QR codes for common test cases
    const testCases = [
      { name: 'Employee 787', data: '787' },
      { name: 'Employee 901', data: '901' },
      { name: 'Employee UHPE001', data: 'UHPE001' },
      { name: 'Contractor Test', data: 'CONTRACTOR_MAINTENANCE_PRO_002' },
    ];

    for (const testCase of testCases) {
      const qrCodeDataUrl = await QRCode.toDataURL(testCase.data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Save as PNG file
      const pngBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      const pngPath = path.join(outputDir, `${testCase.name.replace(/\s+/g, '_')}.png`);
      fs.writeFileSync(pngPath, pngBuffer);

      // Save as SVG file
      const svgContent = await QRCode.toString(testCase.data, {
        type: 'svg',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      const svgPath = path.join(outputDir, `${testCase.name.replace(/\s+/g, '_')}.svg`);
      fs.writeFileSync(svgPath, svgContent);

      console.log(`✅ Generated ${testCase.name}:`);
      console.log(`   Data: "${testCase.data}"`);
      console.log(`   PNG: ${pngPath}`);
      console.log(`   SVG: ${svgPath}`);
      console.log('');
    }

    // Create HTML test page
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test QR Codes</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .qr-container {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .qr-code {
            margin: 20px 0;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 10px;
            background: white;
        }
        .qr-code img {
            max-width: 200px;
            height: auto;
        }
        .qr-data {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 6px;
            font-family: monospace;
            margin: 10px 0;
            font-size: 14px;
        }
        .instructions {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2196f3;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>🧪 Test QR Codes for Scanner</h1>
    
    <div class="instructions">
        <h3>📱 How to Test:</h3>
        <ol>
            <li>Open your phone camera</li>
            <li>Point it at any of the QR codes below</li>
            <li>The scanner should detect and process the QR code</li>
            <li>Check the main page for success/error messages</li>
        </ol>
    </div>

    ${testCases.map(testCase => `
    <div class="qr-container">
        <h3>${testCase.name}</h3>
        <div class="qr-code">
            <img src="data:image/png;base64,${Buffer.from(testCase.data).toString('base64')}" alt="${testCase.name}">
        </div>
        <div class="qr-data">
            QR Data: "${testCase.data}"
        </div>
        <p><strong>Expected Result:</strong> Should find and process the ${testCase.name.toLowerCase()}</p>
    </div>
    `).join('')}

    <div class="instructions">
        <h3>🔍 Troubleshooting:</h3>
        <ul>
            <li>Make sure the QR code is clearly visible and well-lit</li>
            <li>Hold your phone steady and close enough to the QR code</li>
            <li>Check the browser console for detailed logs</li>
            <li>Ensure the scanner is active and camera permissions are granted</li>
        </ul>
    </div>
</body>
</html>`;

    const htmlPath = path.join(outputDir, 'test-qr-codes.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`✅ Generated HTML test page: ${htmlPath}`);

    console.log('\n🎯 Test QR codes generated successfully!');
    console.log('\n📱 To test:');
    console.log('   1. Open the HTML file in your browser');
    console.log('   2. Use your phone camera to scan the QR codes');
    console.log('   3. Check the main page scanner for responses');
    console.log('   4. Look for success/error messages');

  } catch (error) {
    console.error('❌ Failed to generate test QR codes:', error);
  }
}

// Run the generator
generateTestQR();
