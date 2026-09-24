import urllib.request
import re

url = 'https://blinkit.com'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        matches = set(re.findall(r'https://cdn\.grofers\.com/[a-zA-Z0-9_\-\.\,\=\/]+', html))
        print(f"Found {len(matches)} grofers URLs:")
        for m in sorted(matches):
            if 'layout-engine' in m or 'category' in m or 'categories' in m or 'app/images' in m:
                print(m)
except Exception as e:
    print("Error:", e)
