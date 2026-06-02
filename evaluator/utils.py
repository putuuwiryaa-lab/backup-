import re
import time


def now_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def parse_history(raw, limit=200):
    return re.findall(r"\b\d{4}\b", str(raw or ""))[-limit:]


def j2d(a, b):
    total = int(a) + int(b)
    return total - 9 if total >= 10 else total


def get_target_2d(result, target_pair="belakang"):
    text = str(result or "").zfill(4)[-4:]
    if target_pair == "depan":
        return text[0:2]
    if target_pair == "tengah":
        return text[1:3]
    return text[2:4]


def normalize_digit_list(value):
    if not isinstance(value, list):
        return []
    output = []
    for item in value:
        text = str(item).strip()
        if text.isdigit():
            output.append(str(int(text)))
    return sorted(set(output), key=lambda x: int(x))


def get_payload_data(payload):
    if isinstance(payload, dict) and isinstance(payload.get("data"), dict):
        return payload["data"]
    return payload


def normalize_mati_result(payload):
    positions = ["AS", "KOP", "KEPALA", "EKOR"]
    return {
        pos: normalize_digit_list((payload.get(pos) or {}).get("result") if isinstance(payload, dict) else None)
        for pos in positions
    }


def normalize_simple_result(payload):
    if isinstance(payload, dict):
        if isinstance(payload.get("result"), list):
            return normalize_digit_list(payload.get("result"))
        if isinstance(payload.get("data"), list):
            return normalize_digit_list(payload.get("data"))
    return []


def normalize_text_result(payload):
    if isinstance(payload, dict):
        result = payload.get("result")
        if isinstance(result, list) and result:
            return str(result[0]).strip().upper()
        if isinstance(result, str):
            return result.strip().upper()
    return ""
