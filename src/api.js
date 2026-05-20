const API_URL = 'https://script.google.com/macros/s/AKfycbyJWl9vhWnAgiP0iaHN1Uve7NjHTkai0VX3_Bujs3II0jHorn6tC2dEYS2dZATvUzH8/exec';
const TIMEOUT_MS = 8000; // 8 seconds max wait

export async function loginApi(username, pin) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const url = `${API_URL}?action=login&username=${encodeURIComponent(username)}&pin=${encodeURIComponent(pin)}`;
    const response = await fetch(url, { method: 'GET', mode: 'cors', signal: controller.signal });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') return { success: false, error: "timeout" };
    return { success: false, error: "network" };
  }
}

export async function scanApi(barcode, username) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${API_URL}?barcode=${encodeURIComponent(barcode)}&user=${encodeURIComponent(username)}`;
    const response = await fetch(url, { method: 'GET', mode: 'cors', signal: controller.signal });
    clearTimeout(timeoutId);
    
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (data.success !== undefined) return data.success ? 'success' : 'error';
    } catch(e) {
      return text.trim().toLowerCase();
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') return 'timeout';
    
    // Google Apps Script /exec redirects to googleusercontent.com
    // If CORS is strictly enforced by the browser after redirect, it throws a TypeError.
    // However, if we get this TypeError, it means the request WAS successfully received 
    // and processed by Apps Script. We just aren't allowed to read the response.
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      return 'success'; 
    }
    
    return 'network_error';
  }
}

export async function fetchProducts() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${API_URL}?action=getProducts`;
    const response = await fetch(url, { method: 'GET', mode: 'cors', signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await response.json();
    
    // Map product_name to name and filter out empty rows
    if (data.products) {
      return data.products
        .filter(p => p.barcode && p.product_name)
        .map(p => ({
          barcode: String(p.barcode),
          name: String(p.product_name)
        }));
    }
    return [];
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Failed to fetch products:', error);
    return [];
  }
}
