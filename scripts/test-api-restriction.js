const fetch = require("node-fetch");

async function testAPIRestriction() {
  try {
    console.log("🔍 Testing API Restriction Endpoint...\n");

    // Test the checkin API with a recently checked-in employee
    const testQRCode = "90"; // Employee who checked in recently

    console.log(`1. Testing checkOnly=true for QR code: "${testQRCode}"`);

    const checkResponse = await fetch("http://localhost:3000/api/checkin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        qrCodeData: testQRCode,
        checkOnly: true,
      }),
    });

    console.log("Response status:", checkResponse.status);
    const checkData = await checkResponse.json();
    console.log("Response data:", JSON.stringify(checkData, null, 2));

    if (checkData.alreadyCheckedIn) {
      console.log(
        "✅ CheckOnly API working correctly - shows already checked in"
      );
    } else {
      console.log(
        "❌ CheckOnly API not working - should show already checked in"
      );
    }

    console.log(
      "\n2. Testing actual checkin attempt (should fail with restriction)"
    );

    const checkinResponse = await fetch("http://localhost:3000/api/checkin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        qrCodeData: testQRCode,
        sourceType: "QR",
        checkOnly: false,
      }),
    });

    console.log("Checkin response status:", checkinResponse.status);
    const checkinData = await checkinResponse.json();
    console.log("Checkin response data:", JSON.stringify(checkinData, null, 2));

    if (
      checkinResponse.status === 400 &&
      checkinData.message &&
      checkinData.message.includes("Please wait")
    ) {
      console.log("✅ Checkin API working correctly - shows restriction error");
    } else {
      console.log("❌ Checkin API not working - should show restriction error");
    }

    console.log("\n🎯 API Test Complete!");
    console.log("\n📱 Now test the QR scanner:");
    console.log("   1. Open the main page in your browser");
    console.log('   2. Scan the QR code for employee "90"');
    console.log("   3. You should see a restriction error message");
    console.log("   4. Check the browser console for detailed logs");
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.log(
      "\n💡 Make sure your development server is running on localhost:3000"
    );
  }
}

// Run the test
testAPIRestriction();
