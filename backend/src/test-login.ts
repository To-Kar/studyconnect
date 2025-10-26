// Quick test to verify the login API is working
import axios from 'axios';

async function testLogin() {
  console.log('🧪 Testing Login API');
  console.log('==================');

  try {
    // Test the API root endpoint first
    console.log('\n1. Testing API root endpoint...');
    const rootResponse = await axios.get('http://localhost:3000/');
    console.log('✅ API Root Response:', rootResponse.data);

    // Test login with sample user
    console.log('\n2. Testing login with sample user...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'alice@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful!');
    console.log('User:', loginResponse.data.data.user);
    console.log('Token:', loginResponse.data.data.token ? 'Token received' : 'No token');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testLogin();