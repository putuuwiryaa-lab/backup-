from .client import supabase
from .utils import now_iso

SAMPLE_SIZE = 15
MIN_WINS_15 = 13
MIN_WINS_LAST_5 = 3
MAX_LOSS_STREAK_ALLOWED = 2
PAGE_SIZE = 1000
MAX_EVALUATION_ROWS = 70000

TARGET_PAIRS = ("depan", "tengah", "belakang")
POSITIONS = ("as", "kop", "kepala", "ekor")


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


def group_label(group_key):
    labels = {
        "ai": "AI",
        "bbfs": "BBFS",
        "off_digit": "OFF Digit",
        "off_jumlah": "OFF Jumlah",
        "off_shio": "OFF Shio",
    }
    return labels.get(group_key, group_key)


def group_key_for_row(row):
    mode = row.get("mode")
    param = int(row.get("param") or 0)
    if mode == "ai" and param in (2, 4, 6):
        return "ai"
    if mode == "ai" and param == 8:
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
    if mode in ("ai", "jumlah", "shio"):
        return str(target_pair).lower()
    return "all"


def fetch_evaluation_rows():
    all_rows = []
    for start in range(0, MAX_EVALUATION_ROWS, PAGE_SIZE):
        end = start + PAGE_SIZE - 1
        result = (
            supabase.table("analysis_evaluations")
            .select("id,market_id,market_name,mode,param,position,target_pair,is_hit,status,evaluated_at")
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


def stat_group_key(row):
    group_key = group_key_for_row(row)
    if not group_key:
        return None
    market_id = row.get("market_id")
    mode = row.get("mode")
    param = int(row.get("param") or 0)
    position = normalize_position(row)
    target_pair = normalize_target_pair(row)
    if not market_id or not param:
        return None
    return "|".join([str(market_id), group_key, str(mode), str(param), position, target_pair])


def build_market_statistics(rows):
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
        group_key = group_key_for_row(latest)
        mode = latest.get("mode")
        param = int(latest.get("param") or 0)
        position = normalize_position(latest)
        target_pair = normalize_target_pair(latest)
        score = wins_15 * 100 + wins_last_5 * 25 - loss_streak * 40
        stat_key = "|".join([str(latest.get("market_id")), group_key, str(mode), str(param), position, target_pair])
        output.append({
            "market_id": latest.get("market_id"),
            "market_name": latest.get("market_name") or latest.get("market_id"),
            "group_key": group_key,
            "group_label": group_label(group_key),
            "mode": mode,
            "param": param,
            "position": position,
            "target_pair": target_pair,
            "stat_key": stat_key,
            "wins_15": wins_15,
            "wins_last_5": wins_last_5,
            "max_loss_streak": loss_streak,
            "sample_size": len(sample),
            "score": score,
            "is_active": True,
            "updated_at": now_iso(),
        })
    return sorted(output, key=lambda item: item["score"], reverse=True)


def is_missing_statistics_table(error):
    text = str(error)
    return "market_statistics" in text and ("PGRST205" in text or "schema cache" in text or "Could not find the table" in text)


def refresh_market_statistics():
    rows = fetch_evaluation_rows()
    stats = build_market_statistics(rows)
    try:
        supabase.table("market_statistics").update({"is_active": False, "updated_at": now_iso()}).neq("stat_key", "").execute()
        if stats:
            supabase.table("market_statistics").upsert(stats, on_conflict="stat_key").execute()
        supabase.table("market_statistics").delete().eq("is_active", False).execute()
    except Exception as error:
        if is_missing_statistics_table(error):
            print("MARKET STATISTICS SKIP: tabel market_statistics belum ada. Jalankan supabase_market_statistics.sql sekali di Supabase SQL Editor.")
            return []
        raise
    print(f"MARKET STATISTICS DONE: source_rows={len(rows)} stats_rows={len(stats)}")
    return stats


if __name__ == "__main__":
    refresh_market_statistics()
