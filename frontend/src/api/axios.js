import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://vmi1977988.contaboserver.net', // ✅ CORRECT ICI
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Intercepteurs ...
export default instance;
