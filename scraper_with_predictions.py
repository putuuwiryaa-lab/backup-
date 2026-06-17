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

ENGINE_VERSION = "2d-belakang-core-v2"
BACKTEST_WINDOW = 30
MIN_TRAIN_SIZE = 40
TOP_LINE_V2_LIMIT = 8
TOP_LINE_V2_OUTPUT_LIMIT = 16

WEIGHT_PROFILES = [
    {"name": "balance", "self": 0.28, "opposite_back": 0.16, "cop": 0.10, "as": 0.04, "global": 0.10, "markov": 0.16, "gap": 0.04, "trend": 0.06, "pair_digit": 0.06},
    {"name": "markov_focus", "self": 0.20, "opposite_back": 0.12, "cop": 0.08, "as": 0.03, "global": 0.07, "markov": 0.32, "gap": 0.03, "trend": 0.05, "pair_digit": 0.10},
    {"name": "pair_pressure", "self": 0.22, "opposite_back": 0.18, "cop": 0.10, "as": 0.03, "global": 0.07, "markov": 0.12, "gap": 0.03, "trend": 0.05, "pair_digit": 0.20},
    {"name": "fast_trend", "self": 0.24, "opposite_back": 0.12, "cop": 0.08, "as": 0.03, "global": 0.08, "markov": 0.16, "gap": 0.03, "trend": 0.18, "pair_digit": 0.08},
    {"name": "stable_back", "self": 0.34, "opposite_back": 0.18, "cop": 0.10, "as": 0.04, "global": 0.12, "markov": 0.08, "gap": 0.04, "trend": 0.04, "pair_digit": 0.06},
]


def parse_history(raw, limit=169):
    if not raw:
        return []
    return [item.strip() for item in raw.split() if item.strip().isdigit() and len(item.strip()) == 4][-limit:]


def normalize_score_map(values):
    max_value = max(values.values()) if values else 0
    if max_value <= 0:
        return {d: 0.0 for d in range(10)}
    return {d: values[d] / max_value for d in range(10)}


def empty_digit_scores():
    return {str(d): 0.0 for d in range(10)}


def normalize_string_score_map(values):
    max_value = max(values.values()) if values else 0
    if max_value <= 0:
        return {str(d): 0.0 for d in range(10)}
    return {str(d): values.get(str(d), 0.0) / max_value for d in range(10)}


def add_score_map(target, source, weight):
    for digit, score in source.items():
        key = str(digit)
        if key in target:
            target[key] += float(score) * weight


def rank_from_scores(scores):
    return [str(digit) for digit, score in sorted(scores.items(), key=lambda x: (x[1], -int(x[0])), reverse=True)]


def int_score_map_to_string(values):
    return {str(d): values.get(d, 0.0) for d in range(10)}


def add_weighted_digit(scores, digit, weight):
    if digit.isdigit() and len(digit) == 1:
        scores[int(digit)] += weight


def compute_recent_frequency(results, pos_out, window=POSITION_WINDOW):
    scores = {d: 0.0 for d in range(10)}
    for offset, result in enumerate(reversed(results[-window:])):
        add_weighted_digit(scores, result[pos_out], 1 / (1 + offset * 0.08))
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
    pressure_positions = [0, 1, 2, 3] if pos_out in (0, 1) else [2, 3]
    for offset, result in enumerate(reversed(results[-window:])):
        weight = 1 / (1 + offset * 0.10)
        for pos in pressure_positions:
            add_weighted_digit(scores, result[pos], weight)
    return normalize_score_map(scores)


def compute_short_trend(results, pos_out, window=TREND_WINDOW):
    scores = {d: 0.0 for d in range(10)}
    for offset, result in enumerate(reversed(results[-window:])):
        add_weighted_digit(scores, result[pos_out], window - offset)
    return normalize_score_map(scores)


def compute_position(results, pos_out):
    if not results:
        return [str(d) for d in range(10)], {d: 1.0 for d in range(10)}
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
    sorted_digits = [str(digit) for digit, score in sorted(normalized.items(), key=lambda x: (x[1], -x[0]), reverse=True)]
    return sorted_digits, normalized


def build_top_line(poltar_kepala, poltar_ekor, bbfs8, ai4, limit=TOP_LINE_POSITION_LIMIT):
    kepala = [str(x) for x in (poltar_kepala or [])[:limit]]
    ekor = [str(x) for x in (poltar_ekor or [])[:limit]]
    bbfs = set(str(x) for x in (bbfs8 or []))
    ai = set(str(x) for x in (ai4 or []))
    unique = {}
    for k_index, k in enumerate(kepala):
        for e_index, e in enumerate(ekor):
            if k not in bbfs or e not in bbfs or (k not in ai and e not in ai):
                continue
            line = f"{k}{e}"
            score = (limit - k_index) + (limit - e_index) + (2 if k in ai else 0) + (2 if e in ai else 0)
            if line not in unique or score > unique[line]:
                unique[line] = score
    return sorted(unique.keys(), key=int)


def run_engine(results):
    pos_digits = []
    pos_normalized = []
    for pos_out in range(4):
        sorted_digits, normalized = compute_position(results, pos_out)
        pos_digits.append(sorted_digits)
        pos_normalized.append(normalized)
    combined = {d: (pos_normalized[2][d] + pos_normalized[3][d]) / 2 for d in range(10)}
    strongest = [str(digit) for digit, score in sorted(combined.items(), key=lambda x: x[1], reverse=True)]
    bbfs8 = sorted(str(d) for d in strongest[:8])
    ai4 = sorted(str(d) for d in strongest[:4])
    ai6 = sorted(str(d) for d in strongest[:6])
    top_line = build_top_line(pos_digits[2], pos_digits[3], bbfs8, ai4, TOP_LINE_POSITION_LIMIT)
    return {"bbfs8": bbfs8, "ai4": ai4, "ai6": ai6, "poltar_as": pos_digits[0], "poltar_kop": pos_digits[1], "poltar_kepala": pos_digits[2], "poltar_ekor": pos_digits[3], "top_line": top_line}


def compute_markov_position(results, pos_out):
    scores = empty_digit_scores()
    if len(results) < 3:
        return scores
    last_digit = results[-1][pos_out]
    transitions = {}
    for i in range(len(results) - 1):
        current_digit = results[i][pos_out]
        next_digit = results[i + 1][pos_out]
        transitions.setdefault(current_digit, {})
        transitions[current_digit][next_digit] = transitions[current_digit].get(next_digit, 0) + 1
    for digit, count in transitions.get(last_digit, {}).items():
        scores[str(digit)] += count
    return normalize_string_score_map(scores)


def compute_global_pressure(results, window=30):
    scores = empty_digit_scores()
    for offset, result in enumerate(reversed(results[-window:])):
        weight = 1 / (1 + offset * 0.08)
        for digit in result:
            scores[digit] += weight
        scores[result[2]] += weight * 0.75
        scores[result[3]] += weight * 0.75
    return normalize_string_score_map(scores)


def compute_pair_transition_scores(results):
    scores = {}
    if len(results) < 3:
        return {}
    last_pair = results[-1][2:4]
    pair_transitions = {}
    for i in range(len(results) - 1):
        current_pair = results[i][2:4]
        next_pair = results[i + 1][2:4]
        pair_transitions.setdefault(current_pair, {})
        pair_transitions[current_pair][next_pair] = pair_transitions[current_pair].get(next_pair, 0) + 1
    for pair, count in pair_transitions.get(last_pair, {}).items():
        scores[pair] = scores.get(pair, 0) + count
    last_kpl = results[-1][2]
    last_ekr = results[-1][3]
    for i in range(len(results) - 1):
        current = results[i]
        nxt = results[i + 1]
        if current[2] == last_kpl:
            for e in range(10):
                scores[f"{nxt[2]}{e}"] = scores.get(f"{nxt[2]}{e}", 0) + 0.12
        if current[3] == last_ekr:
            for k in range(10):
                scores[f"{k}{nxt[3]}"] = scores.get(f"{k}{nxt[3]}", 0) + 0.12
    max_score = max(scores.values()) if scores else 0
    if max_score <= 0:
        return {}
    return {pair: score / max_score for pair, score in scores.items()}


def compute_pair_digit_pressure(results):
    scores = empty_digit_scores()
    for pair, score in compute_pair_transition_scores(results).items():
        if len(pair) == 2 and pair[0].isdigit() and pair[1].isdigit():
            scores[pair[0]] += score
            scores[pair[1]] += score
    return normalize_string_score_map(scores)


def compute_target_back_position(results, target_pos, profile):
    scores = empty_digit_scores()
    opposite_pos = 3 if target_pos == 2 else 2
    add_score_map(scores, int_score_map_to_string(compute_recent_frequency(results, target_pos)), profile["self"])
    add_score_map(scores, int_score_map_to_string(compute_recent_frequency(results, opposite_pos)), profile["opposite_back"])
    add_score_map(scores, int_score_map_to_string(compute_recent_frequency(results, 1)), profile["cop"])
    add_score_map(scores, int_score_map_to_string(compute_recent_frequency(results, 0)), profile["as"])
    add_score_map(scores, compute_global_pressure(results), profile["global"])
    add_score_map(scores, compute_markov_position(results, target_pos), profile["markov"])
    add_score_map(scores, int_score_map_to_string(compute_gap_score(results, target_pos)), profile["gap"])
    add_score_map(scores, int_score_map_to_string(compute_short_trend(results, target_pos)), profile["trend"])
    add_score_map(scores, compute_pair_digit_pressure(results), profile["pair_digit"])
    return normalize_string_score_map(scores)


def combine_back_scores(kpl_scores, ekr_scores, global_scores):
    scores = empty_digit_scores()
    add_score_map(scores, kpl_scores, 0.45)
    add_score_map(scores, ekr_scores, 0.45)
    add_score_map(scores, global_scores, 0.10)
    return normalize_string_score_map(scores)


def build_top_line_2d_belakang(results, poltar_kpl, poltar_ekr, bbfs8, ai4, limit=TOP_LINE_V2_LIMIT):
    pair_scores = compute_pair_transition_scores(results)
    candidates = {}
    bbfs = set(str(x) for x in bbfs8)
    ai = set(str(x) for x in ai4)
    for k_index, k in enumerate([str(x) for x in poltar_kpl[:limit]]):
        for e_index, e in enumerate([str(x) for x in poltar_ekr[:limit]]):
            line = f"{k}{e}"
            if k not in bbfs or e not in bbfs or (k not in ai and e not in ai):
                continue
            rank_score = (limit - k_index) + (limit - e_index)
            ai_score = (4 if k in ai else 0) + (4 if e in ai else 0)
            pair_score = pair_scores.get(line, 0) * 12
            candidates[line] = rank_score + ai_score + pair_score
    ranked = [line for line, score in sorted(candidates.items(), key=lambda x: (x[1], -int(x[0])), reverse=True)]
    return sorted(ranked[:TOP_LINE_V2_OUTPUT_LIMIT], key=int)


def run_engine_profile_v2(results, profile):
    poltar_as, _ = compute_position(results, 0)
    poltar_cop, _ = compute_position(results, 1)
    kpl_scores = compute_target_back_position(results, 2, profile)
    ekr_scores = compute_target_back_position(results, 3, profile)
    poltar_kpl = rank_from_scores(kpl_scores)
    poltar_ekr = rank_from_scores(ekr_scores)
    back_scores = combine_back_scores(kpl_scores, ekr_scores, compute_global_pressure(results))
    back_ranked = rank_from_scores(back_scores)
    ai4 = sorted(back_ranked[:4], key=int)
    ai6 = sorted(back_ranked[:6], key=int)
    bbfs8 = sorted(back_ranked[:8], key=int)
    top_line = build_top_line_2d_belakang(results, poltar_kpl, poltar_ekr, bbfs8, ai4, TOP_LINE_V2_LIMIT)
    return {"bbfs8": bbfs8, "ai4": ai4, "ai6": ai6, "poltar_as": poltar_as, "poltar_kop": poltar_cop, "poltar_kepala": poltar_kpl, "poltar_ekor": poltar_ekr, "top_line": top_line, "engine_profile": profile["name"], "engine_version": ENGINE_VERSION}


def score_prediction_v2(prediction, actual):
    score = 0.0
    as_digit, cop_digit, kpl_digit, ekr_digit = actual[0], actual[1], actual[2], actual[3]
    if actual[2:4] in prediction["top_line"]:
        score += 10
    if kpl_digit in prediction["ai4"]:
        score += 4
    if ekr_digit in prediction["ai4"]:
        score += 4
    if kpl_digit in prediction["ai6"]:
        score += 2
    if ekr_digit in prediction["ai6"]:
        score += 2
    if kpl_digit in prediction["poltar_kepala"][:8]:
        score += 3
    if ekr_digit in prediction["poltar_ekor"][:8]:
        score += 3
    if kpl_digit in prediction["bbfs8"]:
        score += 2
    if ekr_digit in prediction["bbfs8"]:
        score += 2
    if as_digit in prediction["bbfs8"]:
        score += 0.5
    if cop_digit in prediction["bbfs8"]:
        score += 0.5
    if cop_digit in prediction["bbfs8"] and kpl_digit in prediction["bbfs8"] and ekr_digit in prediction["bbfs8"]:
        score += 1
    if all(d in prediction["bbfs8"] for d in actual):
        score += 2
    return score


def select_best_profile_v2(results):
    if len(results) < MIN_TRAIN_SIZE + 5:
        return WEIGHT_PROFILES[0]
    start = max(MIN_TRAIN_SIZE, len(results) - BACKTEST_WINDOW)
    profile_scores = []
    for profile in WEIGHT_PROFILES:
        total_score = 0.0
        top_line_hits = ai4_hits = ai6_hits = bbfs_back_hits = 0
        for i in range(start, len(results)):
            train = results[:i]
            actual = results[i]
            prediction = run_engine_profile_v2(train, profile)
            total_score += score_prediction_v2(prediction, actual)
            kpl, ekr = actual[2], actual[3]
            if actual[2:4] in prediction["top_line"]:
                top_line_hits += 1
            if kpl in prediction["ai4"] or ekr in prediction["ai4"]:
                ai4_hits += 1
            if kpl in prediction["ai6"] or ekr in prediction["ai6"]:
                ai6_hits += 1
            if kpl in prediction["bbfs8"] and ekr in prediction["bbfs8"]:
                bbfs_back_hits += 1
        profile_scores.append({"profile": profile, "score": total_score, "top_line_hits": top_line_hits, "ai4_hits": ai4_hits, "ai6_hits": ai6_hits, "bbfs_back_hits": bbfs_back_hits})
    profile_scores.sort(key=lambda x: (x["top_line_hits"], x["bbfs_back_hits"], x["ai4_hits"], x["ai6_hits"], x["score"]), reverse=True)
    return profile_scores[0]["profile"]


def run_engine_v2(results):
    if len(results) < MIN_TRAIN_SIZE:
        prediction = run_engine(results)
        prediction["engine_profile"] = "legacy_fallback"
        prediction["engine_version"] = "legacy-v1"
        return prediction
    best_profile = select_best_profile_v2(results)
    prediction = run_engine_profile_v2(results, best_profile)
    print(f"ENGINE V2: profile={prediction['engine_profile']} AI4={''.join(prediction['ai4'])} AI6={''.join(prediction['ai6'])} BBFS8={''.join(prediction['bbfs8'])} TOPLINE={len(prediction['top_line'])}")
    return prediction


def normalize_json_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x) for x in value]
    return []


def get_existing_snapshot(market_id):
    result = supabase.table("prediction_snapshots").select("*").eq("market_id", market_id).limit(1).execute()
    rows = result.data or []
    return rows[0] if rows else None


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
    return "MASUK" if any(digit in ai_set for digit in result[2:4]) else "ZONK"


def find_rank(digits, target):
    digits = [str(x) for x in digits]
    try:
        return digits.index(str(target)) + 1
    except ValueError:
        return None


def evaluation_already_exists(market_id, from_result, new_result):
    result = supabase.table("prediction_evaluations").select("id").eq("market_id", market_id).eq("from_result", from_result).eq("new_result", new_result).limit(1).execute()
    return len(result.data or []) > 0


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
    print(f"EVALUATION OK: {market_name} {from_result}->{new_result} BBFS={row['bbfs_status']} AI={row['ai_status']} AI6={row['ai6_status']} AS=#{row['rank_as']} KOP=#{row['rank_kop']} KEPALA=#{row['rank_kepala']} EKOR=#{row['rank_ekor']}")
    return True


def process_prediction_flow(market_id, market_name, history_data):
    results = parse_history(history_data, 169)
    if len(results) < 21:
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
            supabase.table("markets").upsert({"id": market_id, "name": market_id, "history_data": data, "order": current_order, "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}).execute()
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
