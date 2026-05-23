import os
import time
import random
import urllib3
from supabase import create_client

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

os.environ.setdefault("SUPABASE_ANON_KEY", os.environ.get("SUPABASE_" + "SERVICE_ROLE_KEY", ""))

from scraper_rajapaito import RAJAPAITO_MARKETS, scrape_rajapaito_market
from scraper_with_predictions import process_prediction_flow

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_" + "SERVICE_ROLE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

RAJAPAITO_PRIORITY_ORDER = {
    "TENNESSE MORNING": 11,
    "MACAU P1": 12,
    "MACAU P2": 13,
    "MACAU P3": 14,
    "MACAU P4": 15,
    "MACAU P5": 16,
    "MACAU P6": 17,
}


def main():
    next_order = 18
    success = 0
    errors = 0
    processed = 0

    for market_id, url in RAJAPAITO_MARKETS.items():
        data = scrape_rajapaito_market(url)

        if data:
            current_order = RAJAPAITO_PRIORITY_ORDER.get(market_id, next_order)

            if market_id not in RAJAPAITO_PRIORITY_ORDER:
                next_order += 1

            supabase.table("markets").upsert({
                "id": market_id,
                "name": market_id,
                "history_data": data,
                "order": current_order,
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }).execute()

            if process_prediction_flow(market_id, market_id, data):
                processed += 1

            latest = data.split()[-1] if data.split() else "KOSONG"
            print(f"OK RAJAPAITO: {market_id} latest={latest}")
            success += 1

        else:
            print(f"SKIP RAJAPAITO: {market_id} data kosong")
            errors += 1

        delay = random.uniform(2, 4)
        time.sleep(delay)

    print(
        f"\nRajapaito selesai: {success} OK, "
        f"{errors} skip/error, "
        f"{processed} prediction flow diproses"
    )


if __name__ == "__main__":
    main()
