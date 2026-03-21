import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
    http_req_failed: ['rate<0.01'],   // Error rate less than 1%
  },
};

export default function () {
  // Login
  const loginRes = http.post('http://localhost:3000/api/auth/login', JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => JSON.parse(r.body).token !== undefined,
  });
  
  const token = JSON.parse(loginRes.body).token;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Get tasks
  const tasksRes = http.get('http://localhost:3000/api/tasks', { headers });
  check(tasksRes, {
    'tasks retrieved': (r) => r.status === 200,
  });
  
  // Create task
  const createRes = http.post('http://localhost:3000/api/tasks', JSON.stringify({
    title: `Load Test Task ${Date.now()}`,
    description: 'Created during load test',
    priority: 'medium'
  }), { headers });
  
  check(createRes, {
    'task created': (r) => r.status === 201,
  });
  
  sleep(1);
}