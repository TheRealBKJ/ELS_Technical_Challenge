const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function handleResponse(response) {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData?.detail) {
        message = errorData.detail;
      }
    } catch {
      // Ignore JSON parsing errors and fall back to the generic message.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function fetchMutualFunds() {
  const response = await fetch(`${API_BASE_URL}/api/mutual-funds`);
  return handleResponse(response);
}

export async function calculateFutureValue(payload) {
  const response = await fetch(`${API_BASE_URL}/api/future-value`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}
