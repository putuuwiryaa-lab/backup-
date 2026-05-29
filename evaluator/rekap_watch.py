from .client import supabase
from .config import SHIO_TABLE
from .utils import now_iso

TARGET_PAIR = "belakang"
MIN_LINE = 50
MAX_LINE = 60
SAMPLE_SIZE = 15
MIN_WINS_15 = 12
MIN_WINS_LAST_5 = 4
MAX_LOSS_STREAK = 1
MAX_COMPONENTS_PER_COMBO = 2
PAGE_SIZE = 1000
MAX_EVALUATION_ROWS = 70000


def normalize_numbers(value):
    if not isinstance(value, list):
        return []
    output = []
    for item in value:
        try:
            output.append(int(item))
        except Exception:
            continue
    return sorted(set(output))


def safe_number_array(value):
    if isinstance(value, list):
        return normalize_numbers(value)
    if isinstance(value, dict):
        for key in ("result", "data", "digits"):
            if isinstance(value.get(key), list):
                return normalize_numbers(value.get(key))
    return []


def get_mati_position_digits(snapshot, position):
    if not isinstance(snapshot, dict):
        return []
    key = "KEPALA" if position == "kepala" else "EKOR"
    return safe_number_array(snapshot.get(key) or snapshot.get(position) or snapshot.get(key.lower()))


def jumlah_2d(a, b):
    total = int(a) + int(b)
    return total - 9 if total >= 10 else total


def shio_of_2d(value):
    return SHIO_TABLE.get(int(value), 1)


def build_2d_belakang_line_count(filters):
    count = 0
    ai = filters.get("ai") or []
    bbfs = filters.get("bbfs") or []
    off_kepala = filters.get("offKepala") or []
    off_ekor = filters.get("offEkor") or []
    off_jumlah = filters.get("offJumlah") or []
    off_shio = filters.get("offShio") or []

    for kepala in range(10):
        for ekor in range(10):
            if kepala in off_kepala:
                continue
            if ekor in off_ekor:
                continue
            if ai and kepala not in ai and ekor not in ai:
                continue
            if bbfs and (kepala not in bbfs or ekor not in bbfs):
                continue
            if jumlah_2d(kepala, ekor) in off_jumlah:
                continue
            if shio_of_2d(kepala * 10 + ekor) in off_shio:
                continue
            count += 1
    return count


def is_success(row):
    status = row.get("status")
    return status not in ("TIDAK MASUK", "ZONK") and row.get("is_hit") is not False


def max_loss_streak(rows):
    highest = 0
    current = 0
    for row in rows:
        if is_success(row):
            current = 0
        else:
            current += 1
            highest = max(highest, current)
    return highest


def fetch_evaluation_rows():
    all_rows = []
    for start in range(0, MAX_EVALUATION_ROWS, PAGE_SIZE):
        end = start + PAGE_SIZE - 1
        result = (
            supabase.table("analysis_evaluations")
            .select("id,market_id,market_name,mode,param,position,target_pair,is_hit,status,result_snapshot,detail,evaluated_at")
            .in_("mode", ["ai", "mati", "jumlah", "shio"])
            .order("evaluated_at", desc=True)
            .range(start, end)
            .execute()
        )
        page = result.data or []
        all_rows.extend(page)
        if len(page) < PAGE_SIZE:
            break
    return all_rows


def metric_key(market_id, mode, param, position="all", target_pair=TARGET_PAIR):
    return "|".join([str(market_id), str(mode), str(param), str(position), str(target_pair)])


def group_stable_metrics(rows):
    groups = {}
    for row in rows:
        market_id = row.get("market_id")
        mode = row.get("mode")
        param = row.get("param")
        if not market_id or not mode or not param:
            continue
        position = row.get("position") or "all"
        target_pair = row.get("target_pair") or "belakang"
        key = metric_key(market_id, mode, param, position, target_pair)
        groups.setdefault(key, []).append(row)

    stable = {}
    for key, group in groups.items():
        sorted_rows = sorted(group, key=lambda row: str(row.get("evaluated_at") or ""), reverse=True)
        sample = sorted_rows[:SAMPLE_SIZE]
        if len(sample) < SAMPLE_SIZE:
            continue
        wins_15 = sum(1 for row in sample if is_success(row))
        wins_last_5 = sum(1 for row in sample[:5] if is_success(row))
        loss_streak = max_loss_streak(sample)
        if wins_15 < MIN_WINS_15 or wins_last_5 < MIN_WINS_LAST_5 or loss_streak > MAX_LOSS_STREAK:
            continue
        latest = sample[0]
        stable[key] = {
            "market_id": latest.get("market_id"),
            "market_name": latest.get("market_name"),
            "mode": latest.get("mode"),
            "param": int(latest.get("param") or 0),
            "position": latest.get("position") or "all",
            "target_pair": latest.get("target_pair") or "belakang",
            "rows": sample,
            "result_snapshot": latest.get("result_snapshot") or {},
            "wins_15": wins_15,
            "wins_last_5": wins_last_5,
            "max_loss_streak": loss_streak,
            "score": wins_15 * 10 + wins_last_5 * 5 - loss_streak * 8,
        }
    return stable


def component_combos(components):
    combos = []
    sorted_components = sorted(
        components,
        key=lambda item: (-item["metric"]["score"], -item.get("ai_bonus", 0), item.get("off_weight", 0)),
    )

    def can_combine(next_item, current):
        if any(item["kind"] == next_item["kind"] for item in current):
            return False
        if next_item["kind"] == "ai" and any(item["kind"] == "bbfs" for item in current):
            return False
        if next_item["kind"] == "bbfs" and any(item["kind"] == "ai" for item in current):
            return False
        return True

    def walk(start, current):
        if current:
            combos.append(list(current))
        if len(current) >= MAX_COMPONENTS_PER_COMBO:
            return
        for index in range(start, len(sorted_components)):
            item = sorted_components[index]
            if not can_combine(item, current):
                continue
            current.append(item)
            walk(index + 1, current)
            current.pop()

    walk(0, [])
    return combos


def merge_numbers(*lists):
    output = []
    for values in lists:
        output.extend(values or [])
    return sorted(set(int(value) for value in output))


def line_filters_from_combo(combo):
    filters = {}
    for item in combo:
        kind = item["kind"]
        if kind == "ai":
            filters["ai"] = merge_numbers(filters.get("ai"), item["digits"])
        elif kind == "bbfs":
            filters["bbfs"] = merge_numbers(filters.get("bbfs"), item["digits"])
        elif kind == "offKepala":
            filters["offKepala"] = merge_numbers(filters.get("offKepala"), item["digits"])
        elif kind == "offEkor":
            filters["offEkor"] = merge_numbers(filters.get("offEkor"), item["digits"])
        elif kind == "offJumlah":
            filters["offJumlah"] = merge_numbers(filters.get("offJumlah"), item["digits"])
        elif kind == "offShio":
            filters["offShio"] = merge_numbers(filters.get("offShio"), item["digits"])
    return filters


def display_filters_from_combo(combo):
    filters = {}
    for item in combo:
        kind = item["kind"]
        if kind == "ai":
            filters["aiByPair"] = {"belakang": item["param"]}
        elif kind == "bbfs":
            filters["bbfsByPair"] = {"belakang": True}
        elif kind == "offKepala":
            filters["offKepala"] = item["param"]
        elif kind == "offEkor":
            filters["offEkor"] = item["param"]
        elif kind == "offJumlah":
            filters["jumlahByPair"] = {"belakang": item["param"]}
        elif kind == "offShio":
            filters["shioByPair"] = {"belakang": item["param"]}
    return filters


def combine_stats(metrics):
    return {
        "wins_15": min(item["wins_15"] for item in metrics),
        "wins_last_5": min(item["wins_last_5"] for item in metrics),
        "max_loss_streak": max(item["max_loss_streak"] for item in metrics),
    }


def combo_score(metrics, line_count, combo):
    stats = combine_stats(metrics)
    line_distance = abs(line_count - 55)
    ai_bonus = max([item.get("ai_bonus", 0) for item in combo] or [0])
    off_penalty = sum(item.get("off_weight", 0) for item in combo) * 7
    filter_count_penalty = max(0, len(combo) - 1) * 5
    stability_score = stats["wins_15"] * 100 + stats["wins_last_5"] * 24 - stats["max_loss_streak"] * 30
    stats["score"] = stability_score + ai_bonus - off_penalty - filter_count_penalty - line_distance * 2
    return stats


def build_components_for_market(stable, market_id):
    components = []
    for param in (2, 4, 6):
        metric = stable.get(metric_key(market_id, "ai", param))
        digits = safe_number_array(metric.get("result_snapshot")) if metric else []
        if metric and digits:
            components.append({
                "key": f"ai-{param}",
                "kind": "ai",
                "label": f"AI BELAKANG {param}D",
                "metric": metric,
                "digits": digits,
                "param": param,
                "ai_bonus": param * 8,
                "off_weight": 0,
            })

    bbfs = stable.get(metric_key(market_id, "ai", 8))
    bbfs_digits = safe_number_array(bbfs.get("result_snapshot")) if bbfs else []
    if bbfs and bbfs_digits:
        components.append({
            "key": "bbfs",
            "kind": "bbfs",
            "label": "BBFS BELAKANG",
            "metric": bbfs,
            "digits": bbfs_digits,
            "param": 8,
            "ai_bonus": 18,
            "off_weight": 0,
        })

    for param in (1, 2, 3):
        kepala = stable.get(metric_key(market_id, "mati", param, "kepala"))
        kepala_digits = get_mati_position_digits(kepala.get("result_snapshot"), "kepala") if kepala else []
        if kepala and kepala_digits:
            components.append({"key": f"offKepala-{param}", "kind": "offKepala", "label": f"OFF KEPALA {param}", "metric": kepala, "digits": kepala_digits, "param": param, "ai_bonus": 0, "off_weight": param})

        ekor = stable.get(metric_key(market_id, "mati", param, "ekor"))
        ekor_digits = get_mati_position_digits(ekor.get("result_snapshot"), "ekor") if ekor else []
        if ekor and ekor_digits:
            components.append({"key": f"offEkor-{param}", "kind": "offEkor", "label": f"OFF EKOR {param}", "metric": ekor, "digits": ekor_digits, "param": param, "ai_bonus": 0, "off_weight": param})

        jumlah = stable.get(metric_key(market_id, "jumlah", param))
        jumlah_digits = safe_number_array(jumlah.get("result_snapshot")) if jumlah else []
        if jumlah and jumlah_digits:
            components.append({"key": f"offJumlah-{param}", "kind": "offJumlah", "label": f"OFF JML BELAKANG {param}", "metric": jumlah, "digits": jumlah_digits, "param": param, "ai_bonus": 0, "off_weight": param})

        shio = stable.get(metric_key(market_id, "shio", param))
        shio_digits = safe_number_array(shio.get("result_snapshot")) if shio else []
        if shio and shio_digits:
            components.append({"key": f"offShio-{param}", "kind": "offShio", "label": f"OFF SHIO BELAKANG {param}", "metric": shio, "digits": shio_digits, "param": param, "ai_bonus": 0, "off_weight": param})

    return components


def build_watchlist_rows(rows):
    stable = group_stable_metrics(rows)
    market_ids = sorted(set(row.get("market_id") for row in rows if row.get("market_id")))
    output = []
    seen = set()

    for market_id in market_ids:
        components = build_components_for_market(stable, market_id)
        for combo in component_combos(components):
            line_filters = line_filters_from_combo(combo)
            line_count = build_2d_belakang_line_count(line_filters)
            if line_count < MIN_LINE or line_count > MAX_LINE:
                continue
            metrics = [item["metric"] for item in combo]
            stats = combo_score(metrics, line_count, combo)
            filter_label = " + ".join(item["label"] for item in combo)
            filter_key = f"{market_id}|belakang|" + "-".join(item["key"] for item in combo)
            if filter_key in seen:
                continue
            seen.add(filter_key)
            output.append({
                "market_id": market_id,
                "market_name": metrics[0].get("market_name") or market_id,
                "focus": TARGET_PAIR,
                "focus_label": "2D BELAKANG",
                "filter_key": filter_key,
                "filter_label": filter_label,
                "filters": display_filters_from_combo(combo),
                "line_count": line_count,
                "wins_15": stats["wins_15"],
                "wins_last_5": stats["wins_last_5"],
                "max_loss_streak": stats["max_loss_streak"],
                "score": stats["score"],
                "is_active": True,
                "updated_at": now_iso(),
            })

    return sorted(output, key=lambda item: item["score"], reverse=True)


def prune_inactive_watchlist_rows():
    supabase.table("rekap_watchlist").delete().eq("is_active", False).execute()


def refresh_rekap_watchlist():
    rows = fetch_evaluation_rows()
    watch_rows = build_watchlist_rows(rows)

    supabase.table("rekap_watchlist").update({"is_active": False, "updated_at": now_iso()}).neq("filter_key", "").execute()

    if watch_rows:
        supabase.table("rekap_watchlist").upsert(watch_rows, on_conflict="filter_key").execute()

    prune_inactive_watchlist_rows()

    print(f"REKAP WATCH DONE: source_rows={len(rows)} watch_rows={len(watch_rows)} inactive_pruned=True")
    return watch_rows


if __name__ == "__main__":
    refresh_rekap_watchlist()
