const BASE = import.meta.env.VITE_API_URL || '';
export async function api(path, { token, ...options } = {}) {
  const response = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) {
    const message = Array.isArray(body.detail) ? body.detail.map(item => `${item.loc.at(-1)}: ${item.msg}`).join('; ') : body.detail;
    const error = new Error(message || 'Something went wrong. Please try again.');
    error.status = response.status;
    throw error;
  }
  return body;
}
export const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: Number(value) % 1 ? 2 : 0 }).format(Number(value));
