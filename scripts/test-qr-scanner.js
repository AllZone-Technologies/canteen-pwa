const db = require('../models');

async function testQRScanner() {
  try {
    console.log('🔍 Testing QR Scanner Setup...\n');

    // Test database connection
    console.log('1. Testing database connection...');
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Check if employees exist with QR codes
    console.log('2. Checking employees with QR codes...');
    const employees = await db.Employee.findAll({
      where: {
        qr_code_data: {
          [db.Sequelize.Op.not]: null
        }
      },
      attributes: ['id', 'employee_id', 'firstname', 'lastname', 'qr_code_data']
    });

    if (employees.length === 0) {
      console.log('❌ No employees found with QR codes');
      console.log('   You need to run the seeders first:');
      console.log('   npx sequelize-cli db:seed:all');
      return;
    }

    console.log(`✅ Found ${employees.length} employees with QR codes:`);
    employees.forEach(emp => {
      console.log(`   - ${emp.firstname} ${emp.lastname} (${emp.employee_id}) -> QR: "${emp.qr_code_data}"`);
    });

    // Check if contractors exist with QR codes
    console.log('\n3. Checking contractors with QR codes...');
    const contractors = await db.Contractor.findAll({
      where: {
        qr_code_data: {
          [db.Sequelize.Op.not]: null
        },
        is_active: true
      },
      attributes: ['id', 'company_name', 'qr_code_data']
    });

    if (contractors.length === 0) {
      console.log('ℹ️  No contractors found with QR codes');
    } else {
      console.log(`✅ Found ${contractors.length} contractors with QR codes:`);
      contractors.forEach(contractor => {
        console.log(`   - ${contractor.company_name} -> QR: "${contractor.qr_code_data}"`);
      });
    }

    // Test QR code lookup
    console.log('\n4. Testing QR code lookup...');
    const testQRCode = employees[0].qr_code_data;
    console.log(`   Testing with QR code: "${testQRCode}"`);

    const foundEmployee = await db.Employee.findOne({
      where: { qr_code_data: testQRCode }
    });

    if (foundEmployee) {
      console.log(`   ✅ Successfully found employee: ${foundEmployee.firstname} ${foundEmployee.lastname}`);
    } else {
      console.log('   ❌ Failed to find employee with QR code');
    }

    // Check recent check-ins
    console.log('\n5. Checking recent check-ins...');
    const recentCheckins = await db.VisitLog.findAll({
      order: [['checkin_time', 'DESC']],
      limit: 5,
      attributes: ['id', 'employee_id', 'checkin_time', 'source_type']
    });

    if (recentCheckins.length === 0) {
      console.log('ℹ️  No recent check-ins found');
    } else {
      console.log(`✅ Found ${recentCheckins.length} recent check-ins:`);
      recentCheckins.forEach(checkin => {
        console.log(`   - ${checkin.employee_id} at ${checkin.checkin_time} (${checkin.source_type})`);
      });
    }

    console.log('\n🎯 QR Scanner Test Complete!');
    console.log('\n📱 To test the scanner:');
    console.log('   1. Open your browser to the main page');
    console.log('   2. Use your phone camera to scan one of the QR codes above');
    console.log('   3. Check the browser console for detailed logs');
    console.log('   4. Visit /qr-codes for test QR codes');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.sequelize.close();
  }
}

// Run the test
testQRScanner();
