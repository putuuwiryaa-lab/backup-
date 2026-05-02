import os
import re
import time
import requests
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANALYZE_API_URL = os.environ.get("ANALYZE_API_URL", "https://analisaangka.online/api/analyze")
INTERNAL_API_SECRET = os.environ.get("INTERNAL_API_SECRET", "")
MAX_KEEP = int(os.environ.get("MAX_REKAP_EVALUATIONS", "14"))

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def now_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def parse_history(raw, limit=169):
    return re.findall(r"\b\d{4}\b", str(raw or ""))[-limit:]


def normalize_lines(value):
    if not isinstance(value, list):
        return []

    lines = []
    for item in value:
        text = str(item).strip()
        if text.isdigit():
            lines.append(text.zfill(2)[-2:])

    return sorted(set(lines), key=lambda x: int(x))


def get_payload_data(payload):
    if isinstance(payload, dict) and isinstance(payload.get("data"), dict):
        return payload["data"]
    return payload


def analyze_rekap(history, mode):
    param = 1 if mode == "invest" else 2

    # UI Analisa Angka mengirim data newest-first ke /api/analyze.
    # Data di Supabase tersimpan oldest-first, jadi harus dibalik agar hasil rekap tidak kosong.
    analyze_history = list(reversed(history))

    headers = {}
    if INTERNAL_API_SECRET:
        headers["x-internal-secret"] = INTERNAL_API_SECRET

    response = requests.post(
        ANALYZE_API_URL,
        headers=headers,
        json={
            "type": "rekap",
            "data": analyze_history,
            "param": param,
        },
        timeout=25,
    )

    response.raise_for_status()
    raw_payload = response.json()

    if not isinstance(raw_payload, dict):
        raise RuntimeError(f"Invalid response: {raw_payload}")

    payload = get_payload_data(raw_payload)
    lines = normalize_lines(payload.get("lines") if isinstance(payload, dict) else None)

    if not lines:
        raise RuntimeError(f"Empty rekap lines for mode={mode}")

    return payload, lines


def get_one(table, **filters):
    query = supabase.table(table).select("*")

    for key, value in filters.items():
        query = query.eq(key, value)

    result = query.limit(1).execute()
    rows = result.data or []

    return rows[0] if rows else None


def save_snapshot(market_id, market_name, mode, base_result, lines, payload):
    row = {
        "market_id": market_id,
        "market_name": market_name,
        "mode": mode,
        "base_result": base_result,
        "lines": lines,
        "payload": payload,
        "updated_at": now_iso(),
    }

    supabase.table("rekap_line_snapshots").upsert(
        row,
        on_conflict="market_id,mode",
    ).execute()


def save_evaluation(market_id, market_name, mode, snapshot, new_result):
    from_result = str(snapshot.get("base_result") or "")

    if not from_result or from_result == new_result:
        return False

    duplicate = get_one(
        "rekap_line_evaluations",
        market_id=market_id,
        mode=mode,
        from_result=from_result,
        new_result=new_result,
    )

    if duplicate:
        print(f"REKAP EVAL SKIP DUPLICATE: {market_id} {mode} {from_result}->{new_result}")
        return False

    old_lines = normalize_lines(snapshot.get("lines"))
    target_2d = new_result[-2:]
    is_hit = target_2d in set(old_lines)

    row = {
        "market_id": market_id,
        "market_name": market_name,
        "mode": mode,
        "from_result": from_result,
        "new_result": new_result,
        "is_hit": is_hit,
        "line_count": len(old_lines),
        "evaluated_at": now_iso(),
    }

    supabase.table("rekap_line_evaluations").insert(row).execute()

    print(
        f"REKAP EVAL OK: {market_id} {mode} "
        f"{from_result}->{new_result} "
        f"{'MASUK' if is_hit else 'TIDAK MASUK'}"
    )

    return True


def cleanup_old_evaluations(market_id, mode):
    result = (
        supabase
        .table("rekap_line_evaluations")
        .select("id")
        .eq("market_id", market_id)
        .eq("mode", mode)
        .order("evaluated_at", desc=True)
        .execute()
    )

    rows = result.data or []

    if len(rows) <= MAX_KEEP:
        return

    old_rows = rows[MAX_KEEP:]

    for row in old_rows:
        supabase.table("rekap_line_evaluations").delete().eq("id", row["id"]).execute()

    print(f"REKAP CLEANUP OK: {market_id} {mode} hapus {len(old_rows)} data lama")


def process_market(market):
    market_id = market.get("id")
    market_name = market.get("name") or market_id
    history = parse_history(market.get("history_data"))

    if not market_id or len(history) < 17:
        print(f"REKAP SKIP: {market_id or '-'} data kurang ({len(history)})")
        return False

    latest_result = history[-1]

    for mode in ("invest", "top"):
        snapshot = get_one(
            "rekap_line_snapshots",
            market_id=market_id,
            mode=mode,
        )

        try:
            payload, lines = analyze_rekap(history, mode)
        except Exception as error:
            print(f"REKAP ANALYZE ERROR: {market_id} {mode} {error}")
            continue

        if snapshot and snapshot.get("base_result") != latest_result:
            save_evaluation(
                market_id=market_id,
                market_name=market_name,
                mode=mode,
                snapshot=snapshot,
                new_result=latest_result,
            )

            cleanup_old_evaluations(market_id, mode)

        if not snapshot or snapshot.get("base_result") != latest_result:
            save_snapshot(
                market_id=market_id,
                market_name=market_name,
                mode=mode,
                base_result=latest_result,
                lines=lines,
                payload=payload,
            )

            print(
                f"REKAP SNAPSHOT OK: {market_id} {mode} "
                f"base={latest_result} lines={len(lines)}"
            )
        else:
            print(f"REKAP NO CHANGE: {market_id} {mode} result masih {latest_result}")

    return True


def main():
    result = supabase.table("markets").select("id,name,history_data").execute()
    markets = result.data or []

    processed = 0

    for market in markets:
        if process_market(market):
            processed += 1

    print(f"REKAP DONE: {processed}/{len(markets)} market diproses")


if __name__ == "__main__":
    main()
