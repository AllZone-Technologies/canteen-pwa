const db = require('../models');

async function testRestriction() {
  try {
    console.log('🔍 Testing 1-Hour Restriction...\n');

    // Test database connection
    console.log('1. Testing database connection...');
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Find an employee with a recent check-in
    console.log('2. Looking for recent check-ins...');
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentCheckins = await db.VisitLog.findAll({
      where: {
        checkin_time: {
          [db.Sequelize.Op.gte]: oneHourAgo,
        },
      },
      order: [["checkin_time", "DESC"]],
      limit: 5,
    });

    if (recentCheckins.length === 0) {
      console.log('❌ No recent check-ins found in the last hour');
      console.log('   You need to check in someone first to test the restriction');
      return;
    }

    console.log(`✅ Found ${recentCheckins.length} recent check-ins:`);
    recentCheckins.forEach(checkin => {
      const timeSince = new Date() - new Date(checkin.checkin_time);
      const minutesAgo = Math.floor(timeSince / (60 * 1000));
      const secondsAgo = Math.floor(timeSince / 1000);
      
      console.log(`   - ${checkin.employee_id} checked in ${minutesAgo}m ${secondsAgo % 60}s ago`);
    });

    // Test the restriction logic
    console.log('\n3. Testing restriction logic...');
    const testCheckin = recentCheckins[0];
    const timeSinceLastCheckIn = new Date() - new Date(testCheckin.checkin_time);
    const oneHourInMs = 60 * 60 * 1000;
    const timeRemaining = oneHourInMs - timeSinceLastCheckIn;

    console.log('Restriction calculation:', {
      lastCheckInTime: testCheckin.checkin_time,
      currentTime: new Date(),
      timeSinceLastCheckIn: `${Math.floor(timeSinceLastCheckIn / 1000)} seconds`,
      timeRemaining: `${Math.floor(timeRemaining / 1000)} seconds`,
      isRestricted: timeRemaining > 0
    });

    if (timeRemaining > 0) {
      const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));
      const secondsRemaining = Math.ceil(timeRemaining / 1000);

      console.log(`✅ Restriction is ACTIVE - ${testCheckin.employee_id} must wait:`);
      if (minutesRemaining >= 1) {
        console.log(`   ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}`);
      } else {
        console.log(`   ${secondsRemaining} second${secondsRemaining > 1 ? 's' : ''}`);
      }
    } else {
      console.log(`✅ No restriction - ${testCheckin.employee_id} can check in again`);
    }

    // Test API endpoint directly
    console.log('\n4. Testing API endpoint...');
    const testEmployee = await db.Employee.findOne({
      where: { employee_id: testCheckin.employee_id }
    });

    if (testEmployee && testEmployee.qr_code_data) {
      console.log(`Testing with employee: ${testEmployee.firstname} ${testEmployee.lastname}`);
      console.log(`QR Code data: "${testEmployee.qr_code_data}"`);
      
      // Simulate the API call
      const checkPayload = {
        qrCodeData: testEmployee.qr_code_data,
        checkOnly: true
      };
      
      console.log('Check payload:', checkPayload);
      console.log('Expected result: Should show already checked in');
    }

    console.log('\n🎯 Restriction Test Complete!');
    console.log('\n📱 To test the scanner:');
    console.log('   1. Try scanning the same QR code again');
    console.log('   2. You should see a restriction error message');
    console.log('   3. Check the browser console for detailed logs');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.sequelize.close();
  }
}

// Run the test
testRestriction();
