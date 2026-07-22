"""
Koala Victoria production wrapper.

- Scrapes all configured Koala Victoria markets.
- Stores history_data in Supabase.
- Runs prediction evaluation/snapshot flow.
- Uses stable IDs such as KOALA_20 to avoid collisions with markets
  provided by other scraper sources.
"""

import random
import time

from prediction_storage import process_prediction_flow, supabase
from scraper_koalavictoria_multi_v6_fixed import (
    BASE_URL,
    HOME_URL,
    MARKET_DELAY,
    MARKET_IDS,
    REQUEST_TIMEOUT,
    create_session,
    scrape_market,
)


KOALA_ORDER_START = 34
MARKET_NAME_OVERRIDES = {
    76: "Beijing",
}


def build_history_data(records) -> str:
    return " ".join(record.result for record in records)


def main() -> None:
    unique_market_ids = list(dict.fromkeys(MARKET_IDS))

    success = 0
    errors = 0
    processed = 0

    session = create_session()

    try:
        try:
            warmup = session.get(HOME_URL, timeout=REQUEST_TIMEOUT)
            print(
                f"[KOALA WARM-UP] status={warmup.status_code} "
                f"cookies={len(session.cookies)}"
            )
        except Exception as error:
            # Warm-up membantu stabilitas sesi, tetapi kegagalannya tidak boleh
            # menghentikan seluruh scraper.
            print(f"[KOALA WARM-UP WARNING] {error}")

        for index, source_id in enumerate(unique_market_ids):
            url = BASE_URL.format(market_id=source_id)
            stable_market_id = f"KOALA_{source_id}"
            current_order = KOALA_ORDER_START + index

            print("\n" + "=" * 72)
            print(
                f"KOALA MARKET {index + 1}/{len(unique_market_ids)} "
                f"| source_id={source_id} "
                f"| database_id={stable_market_id}"
            )
            print("=" * 72)

            try:
                records, detected_name, pages_read, scrape_error = scrape_market(
                    session,
                    source_id,
                )

                resolved_name = MARKET_NAME_OVERRIDES.get(source_id, detected_name)
                if resolved_name != detected_name:
                    print(
                        f"[KOALA NAME OVERRIDE] source_id={source_id} "
                        f"detected={detected_name!r} resolved={resolved_name!r}"
                    )
                detected_name = resolved_name

                history_data = build_history_data(records)
                if not history_data:
                    print(
                        f"SKIP KOALA: {stable_market_id} "
                        f"({detected_name}) data kosong "
                        f"error={scrape_error or '-'}"
                    )
                    errors += 1
                    continue

                latest = records[-1].result
                total = len(records)

                supabase.table("markets").upsert(
                    {
                        "id": stable_market_id,
                        "name": detected_name,
                        "history_data": history_data,
                        "order": current_order,
                        "updated_at": time.strftime(
                            "%Y-%m-%dT%H:%M:%SZ",
                            time.gmtime(),
                        ),
                    }
                ).execute()

                if process_prediction_flow(
                    stable_market_id,
                    detected_name,
                    history_data,
                ):
                    processed += 1

                print(
                    f"OK KOALA: id={stable_market_id} "
                    f"name={detected_name} "
                    f"total={total} "
                    f"latest={latest} "
                    f"pages={pages_read}"
                )
                success += 1

            except Exception as error:
                # Satu market gagal tidak boleh menghentikan market berikutnya.
                print(
                    f"ERROR KOALA: id={stable_market_id} "
                    f"url={url} error={error}"
                )
                errors += 1

            if index < len(unique_market_ids) - 1:
                time.sleep(random.uniform(*MARKET_DELAY))

    finally:
        session.close()

    print(
        f"\nKoala Victoria selesai: "
        f"{success} OK, "
        f"{errors} skip/error, "
        f"{processed} prediction flow diproses"
    )


if __name__ == "__main__":
    main()
