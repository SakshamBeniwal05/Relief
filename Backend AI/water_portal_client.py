"""
SIH26191 Technical Blueprint - CWC / NWDP Water Portal Ingestion Script
Interacts with the National Water Informatics Centre (NWIC) / CWC open telemetry APIs
for Uttarakhand districts: Chamoli, Uttarkashi, Bageshwar, Pithoragarh, Tehri Garhwal.
"""

import json
import urllib.request
import urllib.parse

NWDP_ENDPOINT = "https://nwdp.nwic.gov.in/api/3/action/datastore_search"
RESOURCE_ID = "43e4e098-065f-4288-a226-3ea1993a80e7"

UTTARAKHAND_DISTRICTS = [
    "Bageshwar",
    "Chamoli",
    "Pithoragarh",
    "Tehri Garhwal",
    "Uttarkashi"
]

def fetch_cwc_telemetry(district: str = "Chamoli", limit: int = 50):
    filters = {
        "State": "Uttarakhand",
        "District": district.upper(),
        "Agency": "CWC"
    }
    params = {
        "resource_id": RESOURCE_ID,
        "limit": limit,
        "offset": 0,
        "filters": json.dumps(filters)
    }
    query_string = urllib.parse.urlencode(params)
    url = f"{NWDP_ENDPOINT}?{query_string}"

    req = urllib.request.Request(url, headers={"User-Agent": "SIH26191-Relife-Command/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("result", {}).get("records", [])
    except Exception as e:
        print(f"Telemetry fetch notice for {district}: {e}")
        return []

if __name__ == "__main__":
    records = fetch_cwc_telemetry("Chamoli", limit=5)
    print(f"Ingested {len(records)} CWC telemetry records for Chamoli.")
