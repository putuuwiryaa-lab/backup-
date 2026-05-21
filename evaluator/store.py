from .client import get_one, supabase
from .utils import now_iso


def save_snapshot(market_id, market_name, mode, param, target_pair, base_result, result, payload):
    row = {
        "market_id": market_id,
        "market_name": market_name,
        "mode": mode,
        "param": param,
        "target_pair": target_pair,
        "base_result": base_result,
        "result": result,
        "payload": payload,
        "updated_at": now_iso(),
    }
    supabase.table("analysis_snapshots").upsert(row, on_conflict="market_id,mode,param,target_pair").execute()


def insert_evaluation_row(market_id, market_name, mode, param, position, target_pair, from_result, new_result, is_hit, target, status, snapshot_result, detail):
    duplicate = get_one(
        "analysis_evaluations",
        market_id=market_id,
        mode=mode,
        param=param,
        position=position,
        target_pair=target_pair,
        from_result=from_result,
        new_result=new_result,
    )
    if duplicate:
        print(f"ANALYSIS EVAL SKIP DUPLICATE: {market_id} {mode} {param} {position} {target_pair} {from_result}->{new_result}")
        return False
    row = {
        "market_id": market_id,
        "market_name": market_name,
        "mode": mode,
        "param": param,
        "position": position,
        "target_pair": target_pair,
        "from_result": from_result,
        "new_result": new_result,
        "is_hit": is_hit,
        "status": status,
        "target": target,
        "result_snapshot": snapshot_result,
        "detail": detail,
        "evaluated_at": now_iso(),
    }
    supabase.table("analysis_evaluations").insert(row).execute()
    print(f"ANALYSIS EVAL OK: {market_id} {mode} {param} {position} {target_pair} {from_result}->{new_result} {status}")
    return True
