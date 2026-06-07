import time

import requests
from supabase import create_client

from .config import ANALYZE_API_URL, INTERNAL_API_SECRET, SUPABASE_KEY, SUPABASE_URL
from .utils import get_payload_data, normalize_mati_result, normalize_simple_result, normalize_text_result

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def execute_with_retry(operation, label, attempts=4):
    last_error = None
    for attempt in range(1, attempts + 1):
        try:
            return operation().execute()
        except Exception as error:
            last_error = error
            if attempt >= attempts:
                raise
            wait_seconds = attempt * 2
            print(f"SUPABASE RETRY: {label} attempt={attempt}/{attempts} error={error}")
            time.sleep(wait_seconds)
    raise last_error


def analyze_mode(history, mode, param, target_pair="belakang", analysis_scope="default"):
    headers = {}
    if INTERNAL_API_SECRET:
        headers["x-internal-api-secret"] = INTERNAL_API_SECRET

    api_mode = mode
    api_param = param

    if mode == "ai_parity":
        api_mode = "ai"
        api_param = 7
    elif mode == "ai_size":
        api_mode = "ai"
        api_param = 8

    response = requests.post(
        ANALYZE_API_URL,
        headers=headers,
        json={
            "type": api_mode,
            "data": history,
            "param": api_param,
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

    elif mode in ["ai_parity", "ai_size"]:
        result = normalize_text_result(payload)
        valid_values = ["GENAP", "GANJIL"] if mode == "ai_parity" else ["BESAR", "KECIL"]
        if result not in valid_values:
            raise RuntimeError(
                f"Empty {mode} result param={param} target_pair={target_pair} analysis_scope={analysis_scope}"
            )

    else:
        result = normalize_simple_result(payload)
        if not result:
            raise RuntimeError(
                f"Empty {mode} result param={param} target_pair={target_pair} analysis_scope={analysis_scope}"
            )

    return payload, result


def get_one(table, **filters):
    def operation():
        query = supabase.table(table).select("*")
        for key, value in filters.items():
            query = query.eq(key, value)
        return query.limit(1)

    result = execute_with_retry(operation, f"select {table}")
    rows = result.data or []
    return rows[0] if rows else None
