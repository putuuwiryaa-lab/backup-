import os
import time
import math
import random
from supabase import create_client

# scraper.py lama masih membaca SUPABASE_ANON_KEY saat di-import.
# Karena sekarang workflow memakai SERVICE_ROLE, kita arahkan ANON_KEY ke SERVICE_ROLE agar import aman.
os.environ.setdefault("SUPABASE_ANON_KEY", os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""))

from scraper import MARKETS, PRIORITY_ORDER, scrape_market

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

WEIGHTS = {
    "markov": 0.40,
    "recency": 0.35,
    "momentum": 0.15,
    "frequency": 0.07,
    "gap": 0.03,
}

MARKOV_ALPHA = 0.35
RECENCY_DECAY = 22
MOMENTUM_WINDOW = 12


def parse_history(raw, limit=169):
    if not raw:
        return []

    tokens = []
    for item in raw.split():
        item = item.strip()
        if item.isdigit() and len(item) == 4:
            tokens.append(item)

    return tokens[-limit:]


def normalize_scores(raw_scores):
    if not raw_scores:
        return {d: 0 for d in range(10)}

    max_score = max(raw_scores.values()) or 1

    normalized = {}
    for d in range(10):
        normalized[d] = raw_scores.get(d, 0) / max_score

    return normalized


def compute_position(results, pos_out):
    n = len(results)
    transitions = n - 1
    scores = {d: 0 for d in range(10)}

    # 1. Multi-source smoothed Markov
    markov_raw = {d: 0 for d in range(10)}
    total_source_strength = 0

    for pos_pat in range(4):
        freq_map = {k: {} for k in range(10)}

        for i in range(transitions):
            pat = int(results[i][pos_pat])
            nxt = int(results[i + 1][pos_out])
            freq_map[pat][nxt] = freq_map[pat].get(nxt, 0) + 1

        last_pat = int(results[n - 1][pos_pat])
        counter = freq_map.get(last_pat, {})
        total = sum(counter.values())

        candidate = {}
        for d in range(10):
            candidate[d] = (counter.get(d, 0) + MARKOV_ALPHA) / (total + MARKOV_ALPHA * 10)

        sorted_candidate = sorted(candidate.items(), key=lambda x: x[1], reverse=True)
        edge = sorted_candidate[0][1] - sorted_candidate[1][1]
        source_strength = max(0.15, total * edge)
        total_source_strength += source_strength

        for d in range(10):
            markov_raw[d] += candidate[d] * source_strength

    if total_source_strength > 0:
        for d in range(10):
            markov_raw[d] /= total_source_strength

    markov_score = normalize_scores(markov_raw)

    # 2. Position recency
    recency_raw = {d: 0 for d in range(10)}

    for i in range(n):
        digit = int(results[i][pos_out])
        age = n - 1 - i
        weight = math.exp(-age / RECENCY_DECAY)
        recency_raw[digit] += weight

    recency_score = normalize_scores(recency_raw)

    # 3. Short momentum
    momentum_raw = {d: 0 for d in range(10)}
    start_momentum = max(0, n - MOMENTUM_WINDOW)

    for i in range(start_momentum, n):
        digit = int(results[i][pos_out])
        age = n - 1 - i
        weight = (MOMENTUM_WINDOW - age) / MOMENTUM_WINDOW
        momentum_raw[digit] += max(weight, 0.1)

    momentum_score = normalize_scores(momentum_raw)

    # 4. Long-term frequency
    frequency_raw = {d: 0 for d in range(10)}

    for item in results:
        frequency_raw[int(item[pos_out])] += 1

    frequency_score = normalize_scores(frequency_raw)

    # 5. Controlled gap
    last_seen = {d: -1 for d in range(10)}
    gap_raw = {d: 0 for d in range(10)}

    for i, item in enumerate(results):
        last_seen[int(item[pos_out])] = i

    for d in range(10):
        gap = n if last_seen[d] == -1 else (n - 1 - last_seen[d])
        gap_raw[d] = math.log1p(gap) / math.log1p(n)

    gap_score = normalize_scores(gap_raw)

    # Final score
    for d in range(10):
        scores[d] += markov_score[d] * WEIGHTS["markov"]
        scores[d] += recency_score[d] * WEIGHTS["recency"]
        scores[d] += momentum_score[d] * WEIGHTS["momentum"]
        scores[d] += frequency_score[d] * WEIGHTS["frequency"]
        scores[d] += gap_score[d] * WEIGHTS["gap"]

    max_score = max(scores.values()) or 1

    normalized = {}
    for d in range(10):
        normalized[d] = (scores[d] / max_score) * 10

    # Reverse extreme: skor rendah dianggap paling kuat
    sorted_digits = [
        str(digit)
        for digit, score in sorted(normalized.items(), key=lambda x: x[1])
    ]

    return sorted_digits, normalized


def run_engine(results):
    pos_digits = []
    pos_normalized = []

    for pos_out in range(4):
        sorted_digits, normalized = compute_position(results, pos_out)
        pos_digits.append(sorted_digits)
        pos_normalized.append(normalized)

    # BBFS dan AI dari gabungan KEPALA + EKOR
    combined = {}

    for d in range(10):
        combined[d] = (pos_normalized[2][d] + pos_normalized[3][d]) / 2

    strongest = [
        str(digit)
        for digit, score in sorted(combined.items(), key=lambda x: x[1])
    ]

    bbfs8 = sorted(str(d) for d in strongest[:8])
    ai4 = sorted(str(d) for d in strongest[:4])

    return {
        "bbfs8": bbfs8,
        "ai4": ai4,
        "poltar_as": pos_digits[0],
        "poltar_kop": pos_digits[1],
        "poltar_kepala": pos_digits[2],
        "poltar_ekor": pos_digits[3],
    }


def save_prediction_snapshot(market_id, market_name, base_result, prediction):
    row = {
        "market_id": market_id,
        "market_name": market_name,
        "base_result": base_result,
        "bbfs8": prediction["bbfs8"],
        "ai4": prediction["ai4"],
        "poltar_as": prediction["poltar_as"],
        "poltar_kop": prediction["poltar_kop"],
        "poltar_kepala": prediction["poltar_kepala"],
        "poltar_ekor": prediction["poltar_ekor"],
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    supabase.table("prediction_snapshots").upsert(row).execute()


def process_snapshot(market_id, market_name, history_data):
    results = parse_history(history_data, 169)

    if len(results) < 21:
        print(f"SNAPSHOT SKIP: {market_name} data kurang ({len(results)})")
        return False

    latest_result = results[-1]
    prediction = run_engine(results)

    save_prediction_snapshot(
        market_id=market_id,
        market_name=market_name,
        base_result=latest_result,
        prediction=prediction,
    )

    print(f"SNAPSHOT OK: {market_name} base_result={latest_result}")
    return True


def main():
    next_order = 11
    success = 0
    errors = 0
    snapshots = 0

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

            if process_snapshot(market_id, market_id, data):
                snapshots += 1

            print(f"OK: {market_id}")
            success += 1

        else:
            print(f"SKIP: {market_id} data kosong")
            errors += 1

        delay = random.uniform(2, 4)
        time.sleep(delay)

    print(f"\nSelesai: {success} OK, {errors} skip/error, {snapshots} snapshot diproses")


if __name__ == "__main__":
    main()
