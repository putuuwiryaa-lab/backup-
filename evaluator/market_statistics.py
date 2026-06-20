from .client import supabase
from .utils import now_iso

SAMPLE_SIZE = 15
MIN_WINS_15 = 13
MIN_WINS_LAST_5 = 3
MAX_LOSS_STREAK_ALLOWED = 2
PAGE_SIZE = 1000
MAX_EVALUATION_ROWS = 70000
RANK_FALLBACK = 999999

POSITIONS = ("as", "kop", "kepala", "ekor")
POSITION_2D_PAIRS = {
    "depan": ("as", "kop"),
    "tengah": ("kop", "kepala"),
    "belakang": ("kepala", "ekor"),
}


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


def paired_loss_streak(samples):
    highest = 0
    current = 0
    for sample in samples:
        if sample.get("hit"):
            current = 0
        else:
            current += 1
            highest = max(highest, current)
    return highest


def date_key(value):
    if not value:
        return ""
    return str(value)[:10]


def group_label(group_key, mode=None):
    if group_key == "off_digit" and mode == "mati_2d":
        return "2D Posisi"
    labels = {
        "ai": "AI",
        "ai_parity": "AI Ganjil Genap",
        "ai_size": "AI Besar Kecil",
        "bbfs": "BBFS",
        "off_digit": "OFF Digit",
        "off_jumlah": "OFF Jumlah",
        "off_shio": "OFF Shio",
    }
    return labels.get(group_key, group_key)


def ai_param_is_valid(param, analysis_scope):
    if analysis_scope == "3d":
        return param in (1, 3, 5)
    if analysis_scope == "4d":
        return param in (1, 2, 4)
    return param in (2, 4, 6)


def group_key_for_row(row):
    mode = row.get("mode")
    param = int(row.get("param") or 0)
    analysis_scope = normalize_analysis_scope(row)
    if mode == "ai" and ai_param_is_valid(param, analysis_scope):
        return "ai"
    if mode == "ai_parity" and param == 1:
        return "ai_parity"
    if mode == "ai_size" and param == 1:
        return "ai_size"
    if mode == "bbfs" and param in (7, 8, 9, 10):
        return "bbfs"
    if mode == "mati":
        return "off_digit"
    if mode == "jumlah":
        return "off_jumlah"
    if mode == "shio":
        return "off_shio"
    return None


def normalize_position(row):
    mode = row.get("mode")
    position = row.get("position") or "all"
    if mode == "mati":
        return str(position).lower()
    return "all"


def normalize_target_pair(row):
    mode = row.get("mode")
    target_pair = row.get("target_pair") or "all"
    if mode in ("ai", "ai_parity", "ai_size", "bbfs", "jumlah", "shio"):
        return str(target_pair).lower()
    return "all"


def normalize_analysis_scope(row):
    scope = row.get("analysis_scope") or "default"
    return str(scope).lower()


def fetch_evaluation_rows():
    all_rows = []
    for start in range(0, MAX_EVALUATION_ROWS, PAGE_SIZE):
        end = start + PAGE_SIZE - 1
        result = (
            supabase.table("analysis_evaluations")
            .select("id,market_id,market_name,mode,param,position,target_pair,analysis_scope,is_hit,status,evaluated_at")
            .in_("mode", ["ai", "ai_parity", "ai_size", "bbfs", "mati", "jumlah", "shio"])
            .order("evaluated_at", desc=True)
            .range(start, end)
            .execute()
        )
        page = result.data or []
        all_rows.extend(page)
        if len(page) < PAGE_SIZE:
            break
    return all_rows


def stat_group_key(row):
    group_key = group_key_for_row(row)
    if not group_key:
        return None
    market_id = row.get("market_id")
    mode = row.get("mode")
    param = int(row.get("param") or 0)
    position = normalize_position(row)
    target_pair = normalize_target_pair(row)
    analysis_scope = normalize_analysis_scope(row)
    if not market_id or not param:
        return None
    return "|".join([str(market_id), group_key, str(mode), str(param), position, target_pair, analysis_scope])


def build_single_statistics(rows):
    groups = {}
    for row in rows:
        key = stat_group_key(row)
        if not key:
            continue
        groups.setdefault(key, []).append(row)

    output = []
    for key, group in groups.items():
        sample = sorted(group, key=lambda item: str(item.get("evaluated_at") or ""), reverse=True)[:SAMPLE_SIZE]
        if len(sample) < SAMPLE_SIZE:
            continue
        wins_15 = sum(1 for item in sample if is_success(item))
        wins_last_5 = sum(1 for item in sample[:5] if is_success(item))
        loss_streak = max_loss_streak(sample)
        if wins_15 < MIN_WINS_15 or wins_last_5 < MIN_WINS_LAST_5 or loss_streak > MAX_LOSS_STREAK_ALLOWED:
            continue
        latest = sample[0]
        latest_is_hit = is_success(latest)
        group_key = group_key_for_row(latest)
        mode = latest.get("mode")
        param = int(latest.get("param") or 0)
        position = normalize_position(latest)
        target_pair = normalize_target_pair(latest)
        analysis_scope = normalize_analysis_scope(latest)
        score = wins_15 * 100 + wins_last_5 * 25 - loss_streak * 40
        stat_key = "|".join([str(latest.get("market_id")), group_key, str(mode), str(param), position, target_pair, analysis_scope])
        output.append({
            "market_id": latest.get("market_id"),
            "market_name": latest.get("market_name") or latest.get("market_id"),
            "group_key": group_key,
            "group_label": group_label(group_key, mode),
            "mode": mode,
            "param": param,
            "position": position,
            "target_pair": target_pair,
            "analysis_scope": analysis_scope,
            "stat_key": stat_key,
            "wins_15": wins_15,
            "wins_last_5": wins_last_5,
            "max_loss_streak": loss_streak,
            "sample_size": len(sample),
            "score": score,
            "latest_is_hit": latest_is_hit,
            "latest_status": latest.get("status") or ("MASUK" if latest_is_hit else "ZONK"),
            "is_active": True,
            "updated_at": now_iso(),
        })
    return output


def build_position_2d_statistics(rows):
    day_map = {}
    market_names = {}
    for row in rows:
        if row.get("mode") != "mati":
            continue
        market_id = row.get("market_id")
        market_name = row.get("market_name") or market_id
        param = int(row.get("param") or 0)
        position = str(row.get("position") or "").lower()
        day = date_key(row.get("evaluated_at"))
        if not market_id or param not in (1, 2, 3) or position not in POSITIONS or not day:
            continue
        market_names.setdefault(str(market_id), market_name)
        key = (str(market_id), param, day)
        day_map.setdefault(key, {})
        if position not in day_map[key]:
            day_map[key][position] = is_success(row)

    grouped = {}
    for (market_id, param, day), position_hits in day_map.items():
        for target_pair, pair_positions in POSITION_2D_PAIRS.items():
            first, second = pair_positions
            if first not in position_hits or second not in position_hits:
                continue
            key = (market_id, target_pair, param)
            grouped.setdefault(key, []).append({"day": day, "hit": bool(position_hits[first] and position_hits[second])})

    output = []
    for (market_id, target_pair, param), samples in grouped.items():
        sample = sorted(samples, key=lambda item: item["day"], reverse=True)[:SAMPLE_SIZE]
        if len(sample) < SAMPLE_SIZE:
            continue
        wins_15 = sum(1 for item in sample if item.get("hit"))
        wins_last_5 = sum(1 for item in sample[:5] if item.get("hit"))
        loss_streak = paired_loss_streak(sample)
        if wins_15 < MIN_WINS_15 or wins_last_5 < MIN_WINS_LAST_5 or loss_streak > MAX_LOSS_STREAK_ALLOWED:
            continue
        latest_is_hit = bool(sample[0].get("hit"))
        first, second = POSITION_2D_PAIRS[target_pair]
        group_key = "off_digit"
        mode = "mati_2d"
        position = f"{first}_{second}"
        analysis_scope = "default"
        score = wins_15 * 100 + wins_last_5 * 25 - loss_streak * 40
        stat_key = "|".join([market_id, group_key, mode, str(param), position, target_pair, analysis_scope])
        output.append({
            "market_id": market_id,
            "market_name": market_names.get(market_id) or market_id,
            "group_key": group_key,
            "group_label": group_label(group_key, mode),
            "mode": mode,
            "param": param,
            "position": position,
            "target_pair": target_pair,
            "analysis_scope": analysis_scope,
            "stat_key": stat_key,
            "wins_15": wins_15,
            "wins_last_5": wins_last_5,
            "max_loss_streak": loss_streak,
            "sample_size": len(sample),
            "score": score,
            "latest_is_hit": latest_is_hit,
            "latest_status": "MASUK" if latest_is_hit else "TIDAK MASUK",
            "is_active": True,
            "updated_at": now_iso(),
        })
    return output


def clear_existing_statistics():
    supabase.table("market_statistics").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()


def insert_statistics(rows):
    if not rows:
        return
    supabase.table("market_statistics").insert(rows).execute()


def rebuild_market_statistics():
    rows = fetch_evaluation_rows()
    output = build_single_statistics(rows) + build_position_2d_statistics(rows)
    clear_existing_statistics()
    insert_statistics(output)
    print(f"MARKET STATISTICS DONE: {len(output)} rows")