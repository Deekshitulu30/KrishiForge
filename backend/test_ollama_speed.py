import time, httpx, json

url = "http://localhost:11434/api/generate"
payload = {
    "model": "phi3:mini",
    "prompt": 'Reply with exactly this JSON object: {"test":"ok","status":"working"}',
    "stream": False,
    "format": "json",
    "options": {"num_predict": 50, "num_ctx": 512, "temperature": 0.1}
}

t = time.time()
try:
    r = httpx.post(url, json=payload, timeout=60)
    r.raise_for_status()
    elapsed = time.time() - t
    print(f"phi3:mini response time: {elapsed:.1f}s")
    print("Output:", r.json().get("response", "")[:200])
    eval_tokens = r.json().get("eval_count", "?")
    print(f"Tokens generated: {eval_tokens}")
except Exception as e:
    print("ERROR:", e)
