const API_BASE_URL = 'http://127.0.0.1:8000';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function createFarmer(name, phone) {
  const res = await fetch(`${API_BASE_URL}/farmers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone }),
  });
  if (!res.ok) throw new Error('Failed to create farmer');
  return res.json();
}

export async function createFarmPlot(plotData) {
  const res = await fetch(`${API_BASE_URL}/plots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plotData),
  });
  if (!res.ok) throw new Error('Failed to create farm plot');
  return res.json();
}

export async function fetchFarmPlots() {
  const res = await fetch(`${API_BASE_URL}/plots`);
  if (!res.ok) throw new Error('Failed to fetch plots');
  return res.json();
}

export async function analyzeImage(imageFile) {
  const formData = new FormData();
  formData.append('file', imageFile);
  const res = await fetch(`${API_BASE_URL}/analyze/image`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Image CV analysis failed');
  }
  return res.json();
}

export async function fetchPlotWeather(plotId) {
  const res = await fetch(`${API_BASE_URL}/weather/${plotId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Weather API call failed');
  }
  return res.json();
}

/**
 * Blocking plan generation (kept for fallback).
 */
export async function generatePlan(submissionId) {
  const res = await fetch(`${API_BASE_URL}/generate/plan/${submissionId}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Plan generation failed');
  }
  return res.json();
}

/**
 * Streaming plan generation via SSE.
 * @param {number} submissionId
 * @param {(token: string) => void} onToken - called with each new token
 * @param {(planId: number) => void} onDone - called when Ollama finishes with the saved plan ID
 * @param {(error: string) => void} onError
 * @returns {EventSource} — call .close() to cancel
 */
export function generatePlanStreaming(submissionId, onToken, onDone, onError) {
  const es = new EventSource(`${API_BASE_URL}/generate/plan/${submissionId}/stream`);

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.error) {
        onError(data.error);
        es.close();
        return;
      }
      if (data.token) {
        onToken(data.token);
      }
      if (data.done && data.plan_id) {
        onDone(data.plan_id);
        es.close();
      }
    } catch {
      // Ignore malformed chunks
    }
  };

  es.onerror = () => {
    onError('Lost connection to streaming plan endpoint. Ensure the backend is running.');
    es.close();
  };

  return es;
}

export async function submitFeedback(planId, rating, outcomeNotes) {
  const res = await fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_id: planId, rating, outcome_notes: outcomeNotes }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Feedback submission failed');
  }
  return res.json();
}
