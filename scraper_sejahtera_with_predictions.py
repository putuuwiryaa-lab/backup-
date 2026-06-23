import time
import random

from scraper_sejahtera import SEJAHTERA_MARKETS, scrape_sejahtera_market
from scraper_with_predictions import process_prediction_flow, supabase


SEJAHTERA_PRIORITY_ORDER = {
    "MONGOLIA": 31,
    "NEW MEXICO DAY": 32,
    "NEW MEXICO EVE": 33,
}


def main():
    next_order = 34
    success = 0
    errors = 0
    processed = 0

    for market_id, url in SEJAHTERA_MARKETS.items():
        data = scrape_sejahtera_market(url)

        if data:
            current_order = SEJAHTERA_PRIORITY_ORDER.get(market_id, next_order)

            if market_id not in SEJAHTERA_PRIORITY_ORDER:
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
            total = len(data.split())

            print(f"OK SEJAHTERA: {market_id} total={total} latest={latest}")
            success += 1

        else:
            print(f"SKIP SEJAHTERA: {market_id} data kosong")
            errors += 1

        time.sleep(random.uniform(2, 4))

    print(
        f"\nSejahtera selesai: {success} OK, "
        f"{errors} skip/error, "
        f"{processed} prediction flow diproses"
    )


if __name__ == "__main__":
    main()
