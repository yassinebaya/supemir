import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000', // ✅ CORRECT ICI
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Intercepteurs ...
export default instance;
