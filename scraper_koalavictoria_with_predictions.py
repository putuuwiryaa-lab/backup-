"""
Koala Victoria production wrapper.

Koala follows the same identity convention as the other production scrapers:
market.id and market.name are the same canonical market name. The numeric
Koala source ID is used only to build the source URL.
"""

import random
import time

from prediction_storage import process_prediction_flow, supabase
from scraper_koalavictoria_multi_v6_fixed import (
    BASE_URL,
    HOME_URL,
    MARKET_DELAY,
    REQUEST_TIMEOUT,
    create_session,
    scrape_market,
)


KOALA_ORDER_START = 34

# Source ID -> canonical database identity.
# The canonical name is used for both markets.id and markets.name.
KOALA_MARKETS = {
    20: "Swedia",
    26: "GERMANY",
    34: "MEXICO",
    41: "GREENDLAND",
    44: "NEVADAMID",
    58: "SWITZERLAND",
    62: "NEVADAEVE",
    64: "LISBOA",
    66: "NEVADANIGHT",
    67: "POIPET",
    68: "Kingkong 4D 1",
    70: "TASMANIA",
    71: "THAILAND",
    74: "NEVADAMOR",
    75: "MIAMI",
    76: "Beijing",
    77: "TAIPEI",
    81: "Kingkong 4D 2",
    82: "BRUNEI",
}


def build_history_data(records) -> str:
    return " ".join(record.result for record in records)


def main() -> None:
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
            print(f"[KOALA WARM-UP WARNING] {error}")

        market_items = list(KOALA_MARKETS.items())

        for index, (source_id, canonical_name) in enumerate(market_items):
            url = BASE_URL.format(market_id=source_id)
            market_id = canonical_name
            market_name = canonical_name
            current_order = KOALA_ORDER_START + index

            print("\n" + "=" * 72)
            print(
                f"KOALA MARKET {index + 1}/{len(market_items)} "
                f"| source_id={source_id} "
                f"| id={market_id!r} "
                f"| name={market_name!r}"
            )
            print("=" * 72)

            try:
                records, detected_name, pages_read, scrape_error = scrape_market(
                    session,
                    source_id,
                )

                if str(detected_name or "").strip().casefold() != canonical_name.casefold():
                    print(
                        f"[KOALA NAME CHECK] source_id={source_id} "
                        f"detected={detected_name!r} "
                        f"canonical={canonical_name!r}"
                    )

                history_data = build_history_data(records)
                if not history_data:
                    print(
                        f"SKIP KOALA: id={market_id} "
                        f"data kosong error={scrape_error or '-'}"
                    )
                    errors += 1
                    continue

                latest = records[-1].result
                total = len(records)

                supabase.table("markets").upsert(
                    {
                        "id": market_id,
                        "name": market_name,
                        "history_data": history_data,
                        "order": current_order,
                        "updated_at": time.strftime(
                            "%Y-%m-%dT%H:%M:%SZ",
                            time.gmtime(),
                        ),
                    }
                ).execute()

                if process_prediction_flow(
                    market_id,
                    market_name,
                    history_data,
                ):
                    processed += 1

                print(
                    f"OK KOALA: id={market_id} "
                    f"name={market_name} "
                    f"source_id={source_id} "
                    f"total={total} "
                    f"latest={latest} "
                    f"pages={pages_read}"
                )
                success += 1

            except Exception as error:
                print(
                    f"ERROR KOALA: id={market_id} "
                    f"source_id={source_id} "
                    f"url={url} error={error}"
                )
                errors += 1

            if index < len(market_items) - 1:
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
