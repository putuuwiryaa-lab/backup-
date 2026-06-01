import time
import random

from scraper_totogp import TOTOGP_MARKETS, scrape_totogp_market
from scraper_with_predictions import process_prediction_flow, supabase


def main():
    success = 0
    errors = 0
    processed = 0

    for market_id, url in TOTOGP_MARKETS.items():
        data = scrape_totogp_market(url)

        if data:
            supabase.table("markets").upsert({
                "id": market_id,
                "name": market_id,
                "history_data": data,
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }).execute()

            if process_prediction_flow(market_id, market_id, data):
                processed += 1

            latest = data.split()[-1] if data.split() else "KOSONG"
            total = len(data.split())

            print(f"OK TOTOGP: {market_id} total={total} latest={latest}")
            success += 1

        else:
            print(f"SKIP TOTOGP: {market_id} data kosong")
            errors += 1

        time.sleep(random.uniform(2, 4))

    print(
        f"\nTOTOGP selesai: {success} OK, "
        f"{errors} skip/error, "
        f"{processed} prediction flow diproses"
    )


if __name__ == "__main__":
    main()
