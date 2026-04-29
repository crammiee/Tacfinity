import axios from 'axios';

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiError';
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => ({ ...response, data: response.data.data }),
  (err) => {
    const apiErr = err.response?.data?.error;
    return Promise.reject(
      new ApiError(
        apiErr?.code ?? 'INTERNAL',
        apiErr?.message ?? 'Network error',
        err.response?.status ?? 0
      )
    );
  }
);

export { api as apiClient };
