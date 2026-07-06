import random
import time

from scraper import MARKETS, PRIORITY_ORDER, scrape_market
from prediction_storage import process_prediction_flow, supabase


def main():
    next_order = 11
    success = 0
    errors = 0
    processed = 0

    for market_id, url in MARKETS.items():
        data = scrape_market(url)

        if data:
            current_order = PRIORITY_ORDER.get(market_id, next_order)

            if market_id not in PRIORITY_ORDER:
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

            print(f"OK: {market_id}")
            success += 1
        else:
            print(f"SKIP: {market_id} data kosong")
            errors += 1

        time.sleep(random.uniform(2, 4))

    print(f"\nSelesai: {success} OK, {errors} skip/error, {processed} prediction flow diproses")


if __name__ == "__main__":
    main()
