import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://195.179.229.230:5000', // ✅ CORRECT ICI
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Intercepteurs ...
export default instance;
