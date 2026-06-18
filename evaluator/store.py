from .client import execute_with_retry, get_one, supabase
from .utils import now_iso


def _is_duplicate_key_error(error):
    text = str(error).lower()
    return "23505" in text or "duplicate key value violates unique constraint" in text


def save_snapshot(market_id, market_name, mode, param, target_pair, analysis_scope, base_result, result, payload):
    row = {
        "market_id": market_id,
        "market_name": market_name,
        "mode": mode,
        "param": param,
        "target_pair": target_pair,
        "analysis_scope": analysis_scope,
        "base_result": base_result,
        "result": result,
        "payload": payload,
        "updated_at": now_iso(),
    }
    execute_with_retry(
        lambda: supabase.table("analysis_snapshots").upsert(
            row,
            on_conflict="market_id,mode,param,target_pair,analysis_scope",
        ),
        f"upsert analysis_snapshots {market_id} {mode} {param} {target_pair} {analysis_scope}",
    )


def insert_evaluation_row(market_id, market_name, mode, param, position, target_pair, analysis_scope, from_result, new_result, is_hit, target, status, snapshot_result, detail):
    duplicate = get_one(
        "analysis_evaluations",
        market_id=market_id,
        mode=mode,
        param=param,
        position=position,
        target_pair=target_pair,
        analysis_scope=analysis_scope,
        from_result=from_result,
        new_result=new_result,
    )
    if duplicate:
        print(f"ANALYSIS EVAL SKIP DUPLICATE: {market_id} {mode} {param} {position} {target_pair} {analysis_scope}")
        return False
    row = {
        "market_id": market_id,
        "market_name": market_name,
        "mode": mode,
        "param": param,
        "position": position,
        "target_pair": target_pair,
        "analysis_scope": analysis_scope,
        "from_result": from_result,
        "new_result": new_result,
        "is_hit": is_hit,
        "status": status,
        "target": target,
        "result_snapshot": snapshot_result,
        "detail": detail,
        "evaluated_at": now_iso(),
    }
    try:
        execute_with_retry(
            lambda: supabase.table("analysis_evaluations").insert(row),
            f"insert analysis_evaluations {market_id} {mode} {param} {position} {target_pair} {analysis_scope}",
        )
    except Exception as error:
        if _is_duplicate_key_error(error):
            print(f"ANALYSIS EVAL SKIP DUPLICATE AFTER RETRY: {market_id} {mode} {param} {position} {target_pair} {analysis_scope}")
            return False
        raise
    print(f"ANALYSIS EVAL OK: {market_id} {mode} {param} {position} {target_pair} {analysis_scope} {status}")
    return True
