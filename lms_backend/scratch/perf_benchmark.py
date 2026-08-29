import time
import urllib.request
import json
import concurrent.futures

BASE_URL = "http://localhost:8000/api"

def get_auth_token():
    req = urllib.request.Request(
        f"{BASE_URL}/auth/login/",
        data=json.dumps({"username": "admin", "password": "admin123"}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode('utf-8'))
    return data['access']

def make_request(token, endpoint):
    start = time.time()
    req = urllib.request.Request(
        f"{BASE_URL}/{endpoint}",
        headers={'Authorization': f'Bearer {token}'}
    )
    res = urllib.request.urlopen(req)
    latency = (time.time() - start) * 1000 # ms
    return res.status, latency

def run_performance_test():
    print("[*] Starting Performance & Latency Benchmark (100 Concurrent Requests)...")
    token = get_auth_token()
    
    endpoints = ["books/", "categories/", "users/", "reports/"]
    latencies = []
    
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_request, token, endpoints[i % len(endpoints)]) for i in range(100)]
        for f in concurrent.futures.as_completed(futures):
            status, lat = f.result()
            if status == 200:
                latencies.append(lat)
                
    total_time = time.time() - start_time
    avg_latency = sum(latencies) / len(latencies)
    max_latency = max(latencies)
    min_latency = min(latencies)
    rps = 100 / total_time

    print(f"\n[+] PERFORMANCE AUDIT RESULTS:")
    print(f"----------------------------------------")
    print(f"Total Requests Processed: 100")
    print(f"Total Duration:           {total_time:.2f} seconds")
    print(f"Throughput (RPS):         {rps:.2f} requests/sec")
    print(f"Avg API Latency:          {avg_latency:.2f} ms")
    print(f"Min API Latency:          {min_latency:.2f} ms")
    print(f"Max API Latency:          {max_latency:.2f} ms")
    print(f"----------------------------------------")

if __name__ == '__main__':
    run_performance_test()
