import os
import re
import time
import requests
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANALYZE_API_URL = os.environ.get("ANALYZE_API_URL", "https://analisaangka.online/api/analyze")
INTERNAL_API_SECRET = os.environ.get("INTERNAL_API_SECRET", "")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

MODES = {
    "ai": [4, 6, 8],
    "mati": [1, 2, 3, 4],
    "jumlah": [1, 2],
    "shio": [1, 2],
}

SHIO_TABLE = {}
for shio, values in [
    (1, [1, 13, 25, 37, 49, 61, 73, 85, 97]),
    (2, [2, 14, 26, 38, 50, 62, 74, 86, 98]),
    (3, [3, 15, 27, 39, 51, 63, 75, 87, 99]),
    (4, [4, 16, 28, 40, 52, 64, 76, 88, 0]),
    (5, [5, 17, 29, 41, 53, 65, 77, 89]),
    (6, [6, 18, 30, 42, 54, 66, 78, 90]),
    (7, [7, 19, 31, 43, 55, 67, 79, 91]),
    (8, [8, 20, 32, 44, 56, 68, 80, 92]),
    (9, [9, 21, 33, 45, 57, 69, 81, 93]),
    (10, [10, 22, 34, 46, 58, 70, 82, 94]),
    (11, [11, 23, 35, 47, 59, 71, 83, 95]),
    (12, [12, 24, 36, 48, 60, 72, 84, 96]),
]:
    for value in values:
        SHIO_TABLE[value] = shio


def now_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def j2d(a, b):
    total = int(a) + int(b)
    return total - 9 if total >= 10 else total


def parse_history(raw, limit=200):
    return re.findall(r"\b\d{4}\b", str(raw or ""))[-limit:]


def get_payload_data(payload):
    if isinstance(payload, dict) and isinstance(payload.get("data"), dict):
        return payload["data"]
    return payload


def normalize_digit_list(value):
    if not isinstance(value, list):
        return []

    output = []
    for item in value:
        text = str(item).strip()
        if text.isdigit():
            output.append(str(int(text)))
    return sorted(set(output), key=lambda x: int(x))


def normalize_mati_result(payload):
    positions = ["AS", "KOP", "KEPALA", "EKOR"]
    return {
        pos: normalize_digit_list((payload.get(pos) or {}).get("result") if isinstance(payload, dict) else None)
        for pos in positions
    }


def normalize_simple_result(payload):
    if isinstance(payload, dict):
        if isinstance(payload.get("result"), list):
            return normalize_digit_list(payload.get("result"))
        if isinstance(payload.get("data"), list):
            return normalize_digit_list(payload.get("data"))
    return []


def analyze_mode(history, mode, param):
    headers = {}
    if INTERNAL_API_SECRET:
        headers["x-internal-secret"] = INTERNAL_API_SECRET

    analyze_history = history

    response = requests.post(
        ANALYZE_API_URL,
        headers=headers,
        json={"type": mode, "data": analyze_history, "param": param},
        timeout=25,
    )
    response.raise_for_status()
    raw_payload = response.json()
    payload = get_payload_data(raw_payload)

    if mode == "mati":
        result = normalize_mati_result(payload)
        if not any(result.values()):
            raise RuntimeError(f"Empty mati result param={param}")
    else:
        result = normalize_simple_result(payload)
        if not result:
            raise RuntimeError(f"Empty {mode} result param={param}")

    return payload, result


def get_one(table, **filters):
    query = supabase.table(table).select("*")
    for key, value in filters.items():
        query = query.eq(key, value)
    result = query.limit(1).execute()
    rows = result.data or []
    return rows[0] if rows else None


def save_snapshot(market_id, market_name, mode, param, base_result, result, payload):
    row = {
        "market_id": market_id,
        "market_name": market_name,
        "mode": mode,
        "param": param,
        "base_result": base_result,
        "result": result,
        "payload": payload,
        "updated_at": now_iso(),
    }
    supabase.table("analysis_snapshots").upsert(
        row,
        on_conflict="market_id,mode,param",
    ).execute()


def calculate_shio(new_result):
    two_digit = int(new_result[-2:])
    return str(SHIO_TABLE.get(two_digit, SHIO_TABLE.get(two_digit % 100, 1)))


def evaluate_snapshot(mode, param, snapshot_result, new_result):
    target_2d = new_result[-2:]

    if mode == "ai":
        digits = normalize_digit_list(snapshot_result)
        target_set = set(target_2d)
        digit_set = set(digits)
        matched = sorted(target_set.intersection(digit_set), key=lambda x: int(x))
        if param == 8:
            is_hit = target_set.issubset(digit_set)
        else:
            is_hit = bool(matched)
        status = "MASUK" if is_hit else "TIDAK MASUK"
        return is_hit, target_2d, status, {
            "target_2d": target_2d,
            "digits": digits,
            "matched_digits": matched,
            "rule": "bbfs_all_2d_digits" if param == 8 else "ai_any_2d_digit",
        }

    if mode == "mati":
        positions = [
            ("AS", new_result[0]),
            ("KOP", new_result[1]),
            ("KEPALA", new_result[2]),
            ("EKOR", new_result[3]),
        ]
        detail = {}
        safe = {}
        for pos, target in positions:
            off_digits = normalize_digit_list((snapshot_result or {}).get(pos))
            is_safe = target not in set(off_digits)
            safe[pos] = is_safe
            detail[pos] = {"target": target, "off": off_digits, "safe": is_safe}

        if safe["AS"] and safe["KOP"] and safe["KEPALA"] and safe["EKOR"]:
            status = "4D"
        elif safe["KOP"] and safe["KEPALA"] and safe["EKOR"]:
            status = "3D"
        elif safe["KEPALA"] and safe["EKOR"]:
            status = "2D"
        else:
            status = "TIDAK MASUK"

        is_hit = status != "TIDAK MASUK"
        detail["status"] = status
        detail["rule"] = "4d_as_kop_kepala_ekor_3d_kop_kepala_ekor_2d_kepala_ekor"
        return is_hit, new_result, status, detail

    if mode == "jumlah":
        off_jumlah = normalize_digit_list(snapshot_result)
        target_sum = str(j2d(new_result[2], new_result[3]))
        is_hit = target_sum not in set(off_jumlah)
        status = "MASUK" if is_hit else "TIDAK MASUK"
        return is_hit, target_sum, status, {
            "target_2d": target_2d,
            "target_sum_2d": target_sum,
            "off_jumlah": off_jumlah,
        }

    if mode == "shio":
        off_shio = normalize_digit_list(snapshot_result)
        target_shio = calculate_shio(new_result)
        is_safe = target_shio not in set(off_shio)
        status = "MASUK" if is_safe else "TIDAK MASUK"
        return is_safe, target_shio, status, {
            "target_2d": target_2d,
            "target_shio": target_shio,
            "off_shio": off_shio,
            "safe": is_safe,
            "rule": "shio_mati_masuk_if_result_not_in_off_shio",
        }

    raise RuntimeError(f"Unknown mode={mode}")


def save_evaluation(market_id, market_name, mode, param, snapshot, new_result):
    from_result = str(snapshot.get("base_result") or "")
    if not from_result or from_result == new_result:
        return False

    duplicate = get_one(
        "analysis_evaluations",
        market_id=market_id,
        mode=mode,
        param=param,
        from_result=from_result,
        new_result=new_result,
    )
    if duplicate:
        print(f"ANALYSIS EVAL SKIP DUPLICATE: {market_id} {mode} {param} {from_result}->{new_result}")
        return False

    snapshot_result = snapshot.get("result")
    is_hit, target, status, detail = evaluate_snapshot(mode, param, snapshot_result, new_result)

    row = {
        "market_id": market_id,
        "market_name": market_name,
        "mode": mode,
        "param": param,
        "from_result": from_result,
        "new_result": new_result,
        "is_hit": is_hit,
        "status": status,
        "target": target,
        "result_snapshot": snapshot_result,
        "detail": detail,
        "evaluated_at": now_iso(),
    }

    supabase.table("analysis_evaluations").insert(row).execute()
    print(
        f"ANALYSIS EVAL OK: {market_id} {mode} {param} "
        f"{from_result}->{new_result} {status}"
    )
    return True


def process_market(market):
    market_id = market.get("id")
    market_name = market.get("name") or market_id
    history = parse_history(market.get("history_data"))

    if not market_id or len(history) < 17:
        print(f"ANALYSIS SKIP: {market_id or '-'} data kurang ({len(history)})")
        return False

    latest_result = history[-1]

    for mode, params in MODES.items():
        for param in params:
            snapshot = get_one(
                "analysis_snapshots",
                market_id=market_id,
                mode=mode,
                param=param,
            )

            try:
                payload, result = analyze_mode(history, mode, param)
            except Exception as error:
                print(f"ANALYSIS ERROR: {market_id} {mode} {param} {error}")
                continue

            if snapshot and snapshot.get("base_result") != latest_result:
                save_evaluation(market_id, market_name, mode, param, snapshot, latest_result)

            if not snapshot or snapshot.get("base_result") != latest_result:
                save_snapshot(market_id, market_name, mode, param, latest_result, result, payload)
                print(f"ANALYSIS SNAPSHOT OK: {market_id} {mode} {param} base={latest_result}")
            else:
                print(f"ANALYSIS NO CHANGE: {market_id} {mode} {param} result masih {latest_result}")

    return True


def main():
    result = supabase.table("markets").select("id,name,history_data").execute()
    markets = result.data or []
    processed = 0
    for market in markets:
        if process_market(market):
            processed += 1
    print(f"ANALYSIS DONE: {processed}/{len(markets)} market diproses")


if __name__ == "__main__":
    main()
        
