// Simple test to verify message system
console.log('🧪 Testing Simple Message System...');

// Simulate the message state
let message = '';
let messageType = '';

function showMessage(msg, type) {
  console.log(`showMessage called with: "${msg}" (${type})`);
  message = msg;
  messageType = type;
  console.log(`Message state updated: "${message}" (${messageType})`);
}

// Test the function
console.log('\n1. Testing showMessage function...');
showMessage('Test error message', 'error');
console.log('Result:', { message, messageType });

console.log('\n2. Testing with restriction message...');
showMessage('Ameer Brown has already checked in. Please wait 57 minutes before checking in again', 'error');
console.log('Result:', { message, messageType });

console.log('\n3. Testing success message...');
showMessage('Check-in successful!', 'success');
console.log('Result:', { message, messageType });

console.log('\n✅ Simple message test complete!');
console.log('\n📱 Now test in the browser:');
console.log('   1. Click the test buttons on the main page');
console.log('   2. Check if messages appear');
console.log('   3. Try scanning a QR code for employee "90"');
console.log('   4. Look for restriction error message');
