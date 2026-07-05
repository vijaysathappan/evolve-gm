const isProd = import.meta.env.PROD;

export const API_BASE_URL = import.meta.env.VITE_API_URL || (isProd ? '' : 'http://localhost:5000');
export const LLM_API_URL = import.meta.env.VITE_LLM_API_URL || (isProd ? '' : 'http://localhost:8000');
export const NODE_API_URL = import.meta.env.VITE_NODE_API_URL || (isProd ? '' : 'http://localhost:5000');
