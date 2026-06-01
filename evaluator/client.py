import requests
from supabase import create_client

from .config import ANALYZE_API_URL, INTERNAL_API_SECRET, SUPABASE_KEY, SUPABASE_URL
from .utils import get_payload_data, normalize_mati_result, normalize_simple_result

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def analyze_mode(history, mode, param, target_pair="belakang", analysis_scope="default"):
    headers = {}
    if INTERNAL_API_SECRET:
        headers["x-internal-secret"] = INTERNAL_API_SECRET

    response = requests.post(
        ANALYZE_API_URL,
        headers=headers,
        json={
            "type": mode,
            "data": history,
            "param": param,
            "target_pair": target_pair,
            "analysis_scope": analysis_scope,
        },
        timeout=25,
    )
    response.raise_for_status()

    raw_payload = response.json()
    payload = get_payload_data(raw_payload)

    if mode == "mati":
        result = normalize_mati_result(payload)
        if not any(result.values()):
            raise RuntimeError(f"Empty mati result param={param}")
    else:
        result = normalize_simple_result(payload)
        if not result:
            raise RuntimeError(
                f"Empty {mode} result param={param} target_pair={target_pair} analysis_scope={analysis_scope}"
            )

    return payload, result


def get_one(table, **filters):
    query = supabase.table(table).select("*")
    for key, value in filters.items():
        query = query.eq(key, value)
    result = query.limit(1).execute()
    rows = result.data or []
    return rows[0] if rows else None
