from .config import MATI_POSITIONS, SHIO_TABLE, TARGET_PAIR_LABELS
from .utils import get_target_2d, j2d, normalize_digit_list


def calculate_shio_from_2d(two_digit):
    value = int(str(two_digit).zfill(2)[-2:])
    return str(SHIO_TABLE.get(value, SHIO_TABLE.get(value % 100, 1)))


def get_bbfs_target_digits(result, analysis_scope):
    text = str(result or "").zfill(4)[-4:]
    if analysis_scope == "4d":
        return list(text)
    if analysis_scope == "3d":
        return list(text[1:4])
    if analysis_scope == "2d_depan":
        return list(text[0:2])
    if analysis_scope == "2d_tengah":
        return list(text[1:3])
    if analysis_scope == "2d_belakang":
        return list(text[2:4])
    raise RuntimeError(f"Unknown bbfs scope={analysis_scope}")


def evaluate_mati_position(snapshot_result, new_result, position_key, position_label, index):
    target = new_result[index]
    off_digits = normalize_digit_list((snapshot_result or {}).get(position_label))
    is_hit = target not in set(off_digits)
    status = "MASUK" if is_hit else "TIDAK MASUK"
    return is_hit, target, status, {
        "position": position_key,
        "position_label": position_label,
        "target": target,
        "off": off_digits,
        "safe": is_hit,
        "rule": "angka_mati_position_masuk_if_actual_digit_not_in_off_digits",
    }


def evaluate_snapshot(mode, param, snapshot_result, new_result, target_pair="belakang", analysis_scope="default"):
    target_2d = get_target_2d(new_result, target_pair)
    if mode == "bbfs":
        digits = normalize_digit_list(snapshot_result)
        target_digits = get_bbfs_target_digits(new_result, analysis_scope)
        digit_set = set(digits)
        target_set = set(target_digits)
        matched = sorted(target_set.intersection(digit_set), key=lambda x: int(x))
        is_hit = target_set.issubset(digit_set)
        status = "MASUK" if is_hit else "TIDAK MASUK"
        return is_hit, "".join(target_digits), status, {
            "analysis_scope": analysis_scope,
            "target_digits": target_digits,
            "digits": digits,
            "matched_digits": matched,
            "rule": "bbfs_all_scope_digits",
        }
    if mode == "ai":
        digits = normalize_digit_list(snapshot_result)
        target_set = set(target_2d)
        digit_set = set(digits)
        matched = sorted(target_set.intersection(digit_set), key=lambda x: int(x))
        is_hit = bool(matched)
        status = "MASUK" if is_hit else "TIDAK MASUK"
        return is_hit, target_2d, status, {
            "target_pair": target_pair,
            "target_pair_label": TARGET_PAIR_LABELS.get(target_pair, "KEPALA-EKOR"),
            "target_2d": target_2d,
            "digits": digits,
            "matched_digits": matched,
            "rule": "ai_any_2d_digit",
        }
    if mode == "jumlah":
        off_jumlah = normalize_digit_list(snapshot_result)
        target_sum = str(j2d(target_2d[0], target_2d[1]))
        is_hit = target_sum not in set(off_jumlah)
        status = "MASUK" if is_hit else "TIDAK MASUK"
        return is_hit, target_sum, status, {
            "target_pair": target_pair,
            "target_pair_label": TARGET_PAIR_LABELS.get(target_pair, "KEPALA-EKOR"),
            "target_2d": target_2d,
            "target_sum_2d": target_sum,
            "off_jumlah": off_jumlah,
        }
    if mode == "shio":
        off_shio = normalize_digit_list(snapshot_result)
        target_shio = calculate_shio_from_2d(target_2d)
        is_safe = target_shio not in set(off_shio)
        status = "MASUK" if is_safe else "TIDAK MASUK"
        return is_safe, target_shio, status, {
            "target_pair": target_pair,
            "target_pair_label": TARGET_PAIR_LABELS.get(target_pair, "KEPALA-EKOR"),
            "target_2d": target_2d,
            "target_shio": target_shio,
            "off_shio": off_shio,
            "safe": is_safe,
            "rule": "shio_mati_masuk_if_result_not_in_off_shio",
        }
    raise RuntimeError(f"Unknown mode={mode}")
