import os
import time
import random
import urllib3
from supabase import create_client

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

os.environ.setdefault("SUPABASE_ANON_KEY", os.environ.get("SUPABASE_" + "SERVICE_ROLE_KEY", ""))

from scraper import MARKETS, PRIORITY_ORDER, scrape_market

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_" + "SERVICE_ROLE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

POSITION_WINDOW = 60
TREND_WINDOW = 10
GAP_CAP = 40
TOP_LINE_POSITION_LIMIT = 5

WEIGHT_RECENT_FREQUENCY = 0.35
WEIGHT_GAP = 0.25
WEIGHT_HEAD_TAIL_PRESSURE = 0.25
WEIGHT_SHORT_TREND = 0.15


def parse_history(raw, limit=169):
    if not raw:
        return []

    tokens = []
    for item in raw.split():
        item = item.strip()
        if item.isdigit() and len(item) == 4:
            tokens.append(item)

    return tokens[-limit:]


def normalize_score_map(values):
    max_value = max(values.values()) if values else 0

    if max_value <= 0:
        return {d: 0.0 for d in range(10)}

    return {d: values[d] / max_value for d in range(10)}


def add_weighted_digit(scores, digit, weight):
    if digit.isdigit() and len(digit) == 1:
        scores[int(digit)] += weight


def compute_recent_frequency(results, pos_out, window=POSITION_WINDOW):
    scores = {d: 0.0 for d in range(10)}
    recent = results[-window:]

    for offset, result in enumerate(reversed(recent)):
        weight = 1 / (1 + offset * 0.08)
        add_weighted_digit(scores, result[pos_out], weight)

    return normalize_score_map(scores)


def compute_gap_score(results, pos_out, cap=GAP_CAP):
    scores = {d: 0.0 for d in range(10)}

    for digit in range(10):
        target = str(digit)
        gap = cap

        for offset, result in enumerate(reversed(results)):
            if result[pos_out] == target:
                gap = min(offset, cap)
                break

        scores[digit] = gap / cap

    return normalize_score_map(scores)


def compute_head_tail_pressure(results, pos_out, window=POSITION_WINDOW):
    scores = {d: 0.0 for d in range(10)}
    recent = results[-window:]

    pressure_positions = [2, 3]
    if pos_out in (0, 1):
        pressure_positions = [0, 1, 2, 3]

    for offset, result in enumerate(reversed(recent)):
        weight = 1 / (1 + offset * 0.10)
        for pos in pressure_positions:
            add_weighted_digit(scores, result[pos], weight)

    return normalize_score_map(scores)


def compute_short_trend(results, pos_out, window=TREND_WINDOW):
    scores = {d: 0.0 for d in range(10)}
    recent = results[-window:]

    for offset, result in enumerate(reversed(recent)):
        weight = window - offset
        add_weighted_digit(scores, result[pos_out], weight)

    return normalize_score_map(scores)


def compute_position(results, pos_out):
    if not results:
        normalized = {d: 1.0 for d in range(10)}
        return [str(d) for d in range(10)], normalized

    recent_frequency = compute_recent_frequency(results, pos_out)
    gap_score = compute_gap_score(results, pos_out)
    head_tail_pressure = compute_head_tail_pressure(results, pos_out)
    short_trend = compute_short_trend(results, pos_out)

    scores = {}
    for digit in range(10):
        scores[digit] = (
            recent_frequency[digit] * WEIGHT_RECENT_FREQUENCY
            + gap_score[digit] * WEIGHT_GAP
            + head_tail_pressure[digit] * WEIGHT_HEAD_TAIL_PRESSURE
            + short_trend[digit] * WEIGHT_SHORT_TREND
        )

    max_score = max(scores.values()) or 1
    normalized = {d: (scores[d] / max_score) * 10 for d in range(10)}

    sorted_digits = [
        str(digit)
        for digit, score in sorted(normalized.items(), key=lambda x: (x[1], -x[0]), reverse=True)
    ]

    return sorted_digits, normalized


def build_top_line(poltar_kepala, poltar_ekor, bbfs8, ai4, limit=TOP_LINE_POSITION_LIMIT):
    kepala = [str(x) for x in (poltar_kepala or [])[:limit]]
    ekor = [str(x) for x in (poltar_ekor or [])[:limit]]
    bbfs = set(str(x) for x in (bbfs8 or []))
    ai = set(str(x) for x in (ai4 or []))

    candidates = []

    for k_index, k in enumerate(kepala):
        for e_index, e in enumerate(ekor):
            if k not in bbfs or e not in bbfs:
                continue

            if k not in ai and e not in ai:
                continue

            line = f"{k}{e}"
            ai_score = (2 if k in ai else 0) + (2 if e in ai else 0)
            rank_score = (limit - k_index) + (limit - e_index)

            candidates.append({
                "line": line,
                "score": rank_score + ai_score,
                "ai_score": ai_score,
                "k_index": k_index,
                "e_index": e_index,
            })

    unique = {}
    for item in candidates:
        line = item["line"]
        if line not in unique or item["score"] > unique[line]["score"]:
            unique[line] = item

    lines = [item["line"] for item in unique.values()]

    return sorted(lines, key=lambda x: int(x))


def run_engine(results):
    pos_digits = []
    pos_normalized = []

    for pos_out in range(4):
        sorted_digits, normalized = compute_position(results, pos_out)
        pos_digits.append(sorted_digits)
        pos_normalized.append(normalized)

    combined = {}

    for d in range(10):
        combined[d] = (pos_normalized[2][d] + pos_normalized[3][d]) / 2

    strongest = [
        str(digit)
        for digit, score in sorted(combined.items(), key=lambda x: x[1], reverse=True)
    ]

    bbfs8 = sorted(str(d) for d in strongest[:8])
    ai4 = sorted(str(d) for d in strongest[:4])
    ai6 = sorted(str(d) for d in strongest[:6])

    top_line = build_top_line(
        poltar_kepala=pos_digits[2],
        poltar_ekor=pos_digits[3],
        bbfs8=bbfs8,
        ai4=ai4,
        limit=TOP_LINE_POSITION_LIMIT,
    )

    return {
        "bbfs8": bbfs8,
        "ai4": ai4,
        "ai6": ai6,
        "poltar_as": pos_digits[0],
        "poltar_kop": pos_digits[1],
        "poltar_kepala": pos_digits[2],
        "poltar_ekor": pos_digits[3],
        "top_line": top_line,
    }


def normalize_json_list(value):
    if value is None:
        return []

    if isinstance(value, list):
        return [str(x) for x in value]

    return []


def get_existing_snapshot(market_id):
    result = (
        supabase
        .table("prediction_snapshots")
        .select("*")
        .eq("market_id", market_id)
        .limit(1)
        .execute()
    )

    rows = result.data or []

    if not rows:
        return None

    return rows[0]


def save_prediction_snapshot(market_id, market_name, base_result, prediction):
    row = {
        "market_id": market_id,
        "market_name": market_name,
        "base_result": base_result,
        "bbfs8": prediction["bbfs8"],
        "ai4": prediction["ai4"],
        "ai6": prediction["ai6"],
        "poltar_as": prediction["poltar_as"],
        "poltar_kop": prediction["poltar_kop"],
        "poltar_kepala": prediction["poltar_kepala"],
        "poltar_ekor": prediction["poltar_ekor"],
        "top_line": prediction.get("top_line", []),
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    supabase.table("prediction_snapshots").upsert(row).execute()


def evaluate_bbfs(bbfs8, result):
    bbfs_set = set(str(x) for x in bbfs8)

    as_hit = result[0] in bbfs_set
    kop_hit = result[1] in bbfs_set
    kepala_hit = result[2] in bbfs_set
    ekor_hit = result[3] in bbfs_set

    if as_hit and kop_hit and kepala_hit and ekor_hit:
        return "4D"

    if kop_hit and kepala_hit and ekor_hit:
        return "3D"

    if kepala_hit and ekor_hit:
        return "2D"

    return "ZONK"


def evaluate_ai(ai_digits, result):
    ai_set = set(str(x) for x in ai_digits)

    for digit in result[2:4]:
        if digit in ai_set:
            return "MASUK"

    return "ZONK"


def find_rank(digits, target):
    digits = [str(x) for x in digits]

    try:
        return digits.index(str(target)) + 1
    except ValueError:
        return None


def evaluation_already_exists(market_id, from_result, new_result):
    result = (
        supabase
        .table("prediction_evaluations")
        .select("id")
        .eq("market_id", market_id)
        .eq("from_result", from_result)
        .eq("new_result", new_result)
        .limit(1)
        .execute()
    )

    rows = result.data or []
    return len(rows) > 0


def save_evaluation(market_id, market_name, old_snapshot, new_result):
    from_result = old_snapshot["base_result"]

    if evaluation_already_exists(market_id, from_result, new_result):
        print(f"EVALUATION SKIP DUPLICATE: {market_name} {from_result}->{new_result}")
        return False

    bbfs8 = normalize_json_list(old_snapshot.get("bbfs8"))
    ai4 = normalize_json_list(old_snapshot.get("ai4"))
    ai6 = normalize_json_list(old_snapshot.get("ai6"))

    poltar_as = normalize_json_list(old_snapshot.get("poltar_as"))
    poltar_kop = normalize_json_list(old_snapshot.get("poltar_kop"))
    poltar_kepala = normalize_json_list(old_snapshot.get("poltar_kepala"))
    poltar_ekor = normalize_json_list(old_snapshot.get("poltar_ekor"))

    row = {
        "market_id": market_id,
        "market_name": market_name,
        "from_result": from_result,
        "new_result": new_result,
        "bbfs_status": evaluate_bbfs(bbfs8, new_result),
        "ai_status": evaluate_ai(ai4, new_result),
        "ai6_status": evaluate_ai(ai6, new_result),
        "rank_as": find_rank(poltar_as, new_result[0]),
        "rank_kop": find_rank(poltar_kop, new_result[1]),
        "rank_kepala": find_rank(poltar_kepala, new_result[2]),
        "rank_ekor": find_rank(poltar_ekor, new_result[3]),
    }

    supabase.table("prediction_evaluations").insert(row).execute()

    print(
        f"EVALUATION OK: {market_name} "
        f"{from_result}->{new_result} "
        f"BBFS={row['bbfs_status']} AI={row['ai_status']} AI6={row['ai6_status']} "
        f"AS=#{row['rank_as']} KOP=#{row['rank_kop']} "
        f"KEPALA=#{row['rank_kepala']} EKOR=#{row['rank_ekor']}"
    )

    return True


def process_prediction_flow(market_id, market_name, history_data):
    results = parse_history(history_data, 169)

    if len(results) < 21:
        print(f"PREDICTION SKIP: {market_name} data kurang ({len(results)})")
        return False

    latest_result = results[-1]
    old_snapshot = get_existing_snapshot(market_id)

    new_prediction = run_engine(results)

    if not old_snapshot:
        save_prediction_snapshot(
            market_id=market_id,
            market_name=market_name,
            base_result=latest_result,
            prediction=new_prediction,
        )
        print(f"SNAPSHOT INITIAL OK: {market_name} base_result={latest_result}")
        return True

    old_base_result = old_snapshot.get("base_result")

    if old_base_result == latest_result:
        print(f"NO CHANGE: {market_name} result masih {latest_result}")
        return True

    save_evaluation(
        market_id=market_id,
        market_name=market_name,
        old_snapshot=old_snapshot,
        new_result=latest_result,
    )

    save_prediction_snapshot(
        market_id=market_id,
        market_name=market_name,
        base_result=latest_result,
        prediction=new_prediction,
    )

    print(f"SNAPSHOT UPDATED: {market_name} base_result={latest_result}")
    return True


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

        delay = random.uniform(2, 4)
        time.sleep(delay)

    print(
        f"\nSelesai: {success} OK, "
        f"{errors} skip/error, "
        f"{processed} prediction flow diproses"
    )


if __name__ == "__main__":
    main()
