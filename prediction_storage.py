import os
import time
import urllib3
from supabase import create_client

from prediction_engine import MIN_HISTORY_SIZE, parse_history, run_engine_v2

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
os.environ.setdefault("SUPABASE_ANON_KEY", os.environ.get("SUPABASE_" + "SERVICE_ROLE_KEY", ""))

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_" + "SERVICE_ROLE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def normalize_json_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x) for x in value]
    return []


def has_digit_list(value, limit):
    return len(normalize_json_list(value)) >= limit


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
    return rows[0] if rows else None


def save_prediction_snapshot(market_id, market_name, base_result, prediction):
    row = {
        "market_id": market_id,
        "market_name": market_name,
        "base_result": base_result,
        "bbfs8": prediction["bbfs8"],
        "bbfs9": prediction["bbfs9"],
        "ai4": prediction["ai4"],
        "ai6": prediction["ai6"],
        "poltar_as": prediction["poltar_as"],
        "poltar_kop": prediction["poltar_kop"],
        "poltar_kepala": prediction["poltar_kepala"],
        "poltar_ekor": prediction["poltar_ekor"],
        "top_line": prediction.get("top_line", []),
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    (
        supabase
        .table("prediction_snapshots")
        .upsert(row, on_conflict="market_id")
        .execute()
    )


def evaluate_bbfs(bbfs_digits, result):
    bbfs_set = set(str(x) for x in bbfs_digits)

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
    return "MASUK" if any(digit in ai_set for digit in result[2:4]) else "ZONK"


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

    return len(result.data or []) > 0


def save_evaluation(market_id, market_name, old_snapshot, new_result):
    from_result = old_snapshot["base_result"]

    if evaluation_already_exists(market_id, from_result, new_result):
        print(f"EVALUATION SKIP DUPLICATE: {market_name} {from_result}->{new_result}")
        return False

    bbfs8 = normalize_json_list(old_snapshot.get("bbfs8"))
    bbfs9 = normalize_json_list(old_snapshot.get("bbfs9"))
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
        "bbfs9_status": evaluate_bbfs(bbfs9, new_result),
        "ai_status": evaluate_ai(ai4, new_result),
        "ai6_status": evaluate_ai(ai6, new_result),
        "rank_as": find_rank(poltar_as, new_result[0]),
        "rank_kop": find_rank(poltar_kop, new_result[1]),
        "rank_kepala": find_rank(poltar_kepala, new_result[2]),
        "rank_ekor": find_rank(poltar_ekor, new_result[3]),
    }

    supabase.table("prediction_evaluations").insert(row).execute()

    print(
        f"EVALUATION OK: {market_name} {from_result}->{new_result} "
        f"BBFS8={row['bbfs_status']} "
        f"BBFS9={row['bbfs9_status']} "
        f"AI={row['ai_status']} "
        f"AI6={row['ai6_status']} "
        f"AS=#{row['rank_as']} "
        f"KOP=#{row['rank_kop']} "
        f"KEPALA=#{row['rank_kepala']} "
        f"EKOR=#{row['rank_ekor']}"
    )

    return True


def process_prediction_flow(market_id, market_name, history_data):
    results = parse_history(history_data)

    if len(results) < MIN_HISTORY_SIZE:
        print(f"PREDICTION SKIP: {market_name} data kurang ({len(results)})")
        return False

    latest_result = results[-1]
    old_snapshot = get_existing_snapshot(market_id)
    new_prediction = run_engine_v2(results)

    if not old_snapshot:
        save_prediction_snapshot(market_id, market_name, latest_result, new_prediction)
        print(f"SNAPSHOT INITIAL OK: {market_name} base_result={latest_result}")
        return True

    old_base_result = old_snapshot.get("base_result")

    if old_base_result == latest_result:
        if not has_digit_list(old_snapshot.get("bbfs9"), 9):
            save_prediction_snapshot(market_id, market_name, latest_result, new_prediction)
            print(f"SNAPSHOT BBFS9 BACKFILL OK: {market_name} base_result={latest_result}")
            return True

        print(f"NO CHANGE: {market_name} result masih {latest_result}")
        return True

    save_evaluation(market_id, market_name, old_snapshot, latest_result)
    save_prediction_snapshot(market_id, market_name, latest_result, new_prediction)

    print(f"SNAPSHOT UPDATED: {market_name} base_result={latest_result}")
    return True
