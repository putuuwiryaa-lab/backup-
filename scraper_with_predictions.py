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

ENGINE_VERSION = "full-cross-transition-score-v2-bbfs9"
HISTORY_LIMIT = 169
MIN_HISTORY_SIZE = 21
TOP_LINE_LIMIT = 8
TOP_LINE_OUTPUT_LIMIT = 16


def parse_history(raw, limit=HISTORY_LIMIT):
    if not raw:
        return []
    return [item.strip() for item in raw.split() if item.strip().isdigit() and len(item.strip()) == 4][-limit:]


def empty_digit_scores():
    return {str(d): 0 for d in range(10)}


def rank_from_scores(scores):
    return [
        str(digit)
        for digit, score in sorted(
            scores.items(),
            key=lambda item: (float(item[1]), -int(item[0])),
            reverse=True,
        )
    ]


def compute_cross_transition_scores(results, target_pos):
    scores = empty_digit_scores()
    if len(results) < 2:
        return scores

    last_result = results[-1]
    for source_pos in range(4):
        source_digit = last_result[source_pos]
        for i in range(len(results) - 1):
            current_result = results[i]
            next_result = results[i + 1]
            if current_result[source_pos] == source_digit:
                scores[next_result[target_pos]] += 1

    return scores


def build_invest_digits(kpl_scores, ekr_scores):
    invest_scores = empty_digit_scores()
    for digit in invest_scores:
        invest_scores[digit] = kpl_scores.get(digit, 0) + ekr_scores.get(digit, 0)

    ranked = rank_from_scores(invest_scores)
    return {
        "scores": invest_scores,
        "ai4": ranked[:4],
        "ai6": ranked[:6],
        "bbfs8": ranked[:8],
    }


def build_bbfs9_digits(kop_scores, kpl_scores, ekr_scores):
    scores = empty_digit_scores()
    for digit in scores:
        scores[digit] = kop_scores.get(digit, 0) + kpl_scores.get(digit, 0) + ekr_scores.get(digit, 0)

    ranked = rank_from_scores(scores)
    return {
        "scores": scores,
        "bbfs9": ranked[:9],
    }


def build_top_line_2d_belakang(poltar_kpl, poltar_ekr, bbfs8, ai4, limit=TOP_LINE_LIMIT):
    bbfs = set(str(x) for x in bbfs8)
    ai = set(str(x) for x in ai4)
    candidates = {}

    for k_index, k in enumerate([str(x) for x in poltar_kpl[:limit]]):
        for e_index, e in enumerate([str(x) for x in poltar_ekr[:limit]]):
            if k not in bbfs or e not in bbfs:
                continue
            if k not in ai and e not in ai:
                continue
            line = f"{k}{e}"
            rank_score = (limit - k_index) + (limit - e_index)
            ai_score = (4 if k in ai else 0) + (4 if e in ai else 0)
            candidates[line] = rank_score + ai_score

    ranked = [
        line
        for line, score in sorted(
            candidates.items(),
            key=lambda item: (float(item[1]), -int(item[0])),
            reverse=True,
        )
    ]
    return sorted(ranked[:TOP_LINE_OUTPUT_LIMIT], key=int)


def run_engine_v2(results):
    position_scores = [compute_cross_transition_scores(results, pos) for pos in range(4)]
    position_ranks = [rank_from_scores(scores) for scores in position_scores]

    invest = build_invest_digits(position_scores[2], position_scores[3])
    bbfs9_invest = build_bbfs9_digits(position_scores[1], position_scores[2], position_scores[3])

    top_line = build_top_line_2d_belakang(
        position_ranks[2],
        position_ranks[3],
        invest["bbfs8"],
        invest["ai4"],
        TOP_LINE_LIMIT,
    )

    prediction = {
        "bbfs8": invest["bbfs8"],
        "bbfs9": bbfs9_invest["bbfs9"],
        "ai4": invest["ai4"],
        "ai6": invest["ai6"],
        "poltar_as": position_ranks[0],
        "poltar_kop": position_ranks[1],
        "poltar_kepala": position_ranks[2],
        "poltar_ekor": position_ranks[3],
        "top_line": top_line,
        "engine_profile": "full_cross_transition_equal",
        "engine_version": ENGINE_VERSION,
    }

    print(
        "ENGINE MARKOV: "
        f"AI4={''.join(prediction['ai4'])} "
        f"CT6={''.join(prediction['ai6'])} "
        f"BBFS8={''.join(prediction['bbfs8'])} "
        f"BBFS9={''.join(prediction['bbfs9'])} "
        f"TOPLINE={len(prediction['top_line'])}"
    )
    return prediction


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
    supabase.table("prediction_snapshots").upsert(row).execute()


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
    results = parse_history(history_data, HISTORY_LIMIT)
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
        print(f"NO CHANGE: {market_name} result masih {latest_result}")
        return True

    save_evaluation(market_id, market_name, old_snapshot, latest_result)
    save_prediction_snapshot(market_id, market_name, latest_result, new_prediction)
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

        time.sleep(random.uniform(2, 4))

    print(f"\nSelesai: {success} OK, {errors} skip/error, {processed} prediction flow diproses")


if __name__ == "__main__":
    main()
