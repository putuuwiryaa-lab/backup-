from .client import analyze_mode, get_one, supabase
from .config import BBFS_SCOPES, MATI_POSITIONS, MODES, TARGET_PAIRS
from .rules import evaluate_mati_position, evaluate_snapshot
from .store import insert_evaluation_row, save_snapshot
from .utils import parse_history


def get_mode_target_pairs(mode):
    return TARGET_PAIRS if mode in ["ai", "jumlah", "shio"] else ["belakang"]


def get_mode_scopes(mode):
    return BBFS_SCOPES if mode == "bbfs" else ["default"]


def save_evaluation(market_id, market_name, mode, param, target_pair, analysis_scope, snapshot, new_result):
    from_result = str(snapshot.get("base_result") or "")
    if not from_result or from_result == new_result:
        return False
    snapshot_result = snapshot.get("result")
    if mode == "mati":
        saved = False
        for position_key, position_label, index in MATI_POSITIONS:
            is_hit, target, status, detail = evaluate_mati_position(snapshot_result, new_result, position_key, position_label, index)
            saved = insert_evaluation_row(
                market_id,
                market_name,
                mode,
                param,
                position_key,
                "belakang",
                analysis_scope,
                from_result,
                new_result,
                is_hit,
                target,
                status,
                snapshot_result,
                detail,
            ) or saved
        return saved
    is_hit, target, status, detail = evaluate_snapshot(mode, param, snapshot_result, new_result, target_pair, analysis_scope)
    return insert_evaluation_row(
        market_id,
        market_name,
        mode,
        param,
        "all",
        target_pair,
        analysis_scope,
        from_result,
        new_result,
        is_hit,
        target,
        status,
        snapshot_result,
        detail,
    )


def process_market(market):
    market_id = market.get("id")
    market_name = market.get("name") or market_id
    history = parse_history(market.get("history_data"))
    if not market_id or len(history) < 17:
        print(f"ANALYSIS SKIP: {market_id or '-'} data kurang ({len(history)})")
        return False
    latest_result = history[-1]
    for mode, params in MODES.items():
        for analysis_scope in get_mode_scopes(mode):
            for target_pair in get_mode_target_pairs(mode):
                for param in params:
                    snapshot = get_one(
                        "analysis_snapshots",
                        market_id=market_id,
                        mode=mode,
                        param=param,
                        target_pair=target_pair,
                        analysis_scope=analysis_scope,
                    )
                    try:
                        payload, result = analyze_mode(history, mode, param, target_pair, analysis_scope)
                    except Exception as error:
                        print(f"ANALYSIS ERROR: {market_id} {mode} {param} {target_pair} {analysis_scope} {error}")
                        continue
                    if snapshot and snapshot.get("base_result") != latest_result:
                        save_evaluation(market_id, market_name, mode, param, target_pair, analysis_scope, snapshot, latest_result)
                    if not snapshot or snapshot.get("base_result") != latest_result:
                        save_snapshot(market_id, market_name, mode, param, target_pair, analysis_scope, latest_result, result, payload)
                        print(f"ANALYSIS SNAPSHOT OK: {market_id} {mode} {param} {target_pair} {analysis_scope} base={latest_result}")
                    else:
                        print(f"ANALYSIS NO CHANGE: {market_id} {mode} {param} {target_pair} {analysis_scope} result masih {latest_result}")
    return True


def run_all_markets():
    result = supabase.table("markets").select("id,name,history_data").execute()
    markets = result.data or []
    processed = 0
    for market in markets:
        if process_market(market):
            processed += 1
    print(f"ANALYSIS DONE: {processed}/{len(markets)} market diproses")
