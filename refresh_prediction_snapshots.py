from scraper_with_predictions import (
    MIN_HISTORY_SIZE,
    parse_history,
    run_engine_v2,
    save_prediction_snapshot,
    supabase,
)


def main():
    result = (
        supabase
        .table("markets")
        .select("id,name,history_data")
        .execute()
    )

    markets = result.data or []
    refreshed = 0
    skipped = 0

    for market in markets:
        market_id = market.get("id")
        market_name = market.get("name") or market_id
        results = parse_history(market.get("history_data"))

        if len(results) < MIN_HISTORY_SIZE:
            print(f"SKIP: {market_name} data kurang ({len(results)})")
            skipped += 1
            continue

        latest_result = results[-1]
        prediction = run_engine_v2(results)
        save_prediction_snapshot(market_id, market_name, latest_result, prediction)

        print(
            f"REFRESH OK: {market_name} "
            f"base_result={latest_result} "
            f"BBFS9={''.join(prediction['bbfs9'])}"
        )
        refreshed += 1

    print(f"Selesai refresh snapshot: {refreshed} OK, {skipped} skip")


if __name__ == "__main__":
    main()
