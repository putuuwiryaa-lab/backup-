ENGINE_VERSION = "full-cross-transition-score-v2-bbfs9"
HISTORY_LIMIT = 169
MIN_HISTORY_SIZE = 21
TOP_LINE_LIMIT = 8
TOP_LINE_OUTPUT_LIMIT = 16


def parse_history(raw, limit=HISTORY_LIMIT):
    if not raw:
        return []
    return [
        item.strip()
        for item in raw.split()
        if item.strip().isdigit() and len(item.strip()) == 4
    ][-limit:]


def empty_digit_scores():
    return {str(d): 0 for d in range(10)}


def rank_from_scores(scores):
    return [
        str(digit)
        for digit, score in sorted(
            scores.items(),
            key=lambda item: (float(item[1]), -int(item[0])),
            reverse=True,
        )
    ]


def compute_cross_transition_scores(results, target_pos):
    scores = empty_digit_scores()
    if len(results) < 2:
        return scores

    last_result = results[-1]
    for source_pos in range(4):
        source_digit = last_result[source_pos]
        for i in range(len(results) - 1):
            current_result = results[i]
            next_result = results[i + 1]
            if current_result[source_pos] == source_digit:
                target_digit = next_result[target_pos]
                scores[target_digit] += 1

    return scores


def build_invest_digits(kpl_scores, ekr_scores):
    invest_scores = empty_digit_scores()

    for digit in invest_scores:
        invest_scores[digit] = (
            kpl_scores.get(digit, 0)
            + ekr_scores.get(digit, 0)
        )

    ranked = rank_from_scores(invest_scores)

    return {
        "scores": invest_scores,
        "ai4": ranked[:4],
        "ai6": ranked[:6],
        "bbfs8": ranked[:8],
    }


def build_bbfs9_digits(kop_scores, kpl_scores, ekr_scores):
    bbfs9_scores = empty_digit_scores()

    for digit in bbfs9_scores:
        bbfs9_scores[digit] = (
            kop_scores.get(digit, 0)
            + kpl_scores.get(digit, 0)
            + ekr_scores.get(digit, 0)
        )

    ranked = rank_from_scores(bbfs9_scores)

    return {
        "scores": bbfs9_scores,
        "bbfs9": ranked[:9],
    }


def build_top_line_2d_belakang(poltar_kpl, poltar_ekr, bbfs8, ai4, limit=TOP_LINE_LIMIT):
    bbfs = set(str(x) for x in bbfs8)
    ai = set(str(x) for x in ai4)
    candidates = {}

    for k_index, k in enumerate([str(x) for x in poltar_kpl[:limit]]):
        for e_index, e in enumerate([str(x) for x in poltar_ekr[:limit]]):
            if k not in bbfs or e not in bbfs:
                continue

            if k not in ai and e not in ai:
                continue

            line = f"{k}{e}"
            rank_score = (limit - k_index) + (limit - e_index)
            ai_score = (4 if k in ai else 0) + (4 if e in ai else 0)

            candidates[line] = rank_score + ai_score

    ranked = [
        line
        for line, score in sorted(
            candidates.items(),
            key=lambda item: (float(item[1]), -int(item[0])),
            reverse=True,
        )
    ]

    return sorted(ranked[:TOP_LINE_OUTPUT_LIMIT], key=int)


def run_engine_v2(results):
    position_scores = [
        compute_cross_transition_scores(results, pos)
        for pos in range(4)
    ]

    position_ranks = [
        rank_from_scores(scores)
        for scores in position_scores
    ]

    invest = build_invest_digits(
        position_scores[2],
        position_scores[3],
    )

    bbfs9_invest = build_bbfs9_digits(
        position_scores[1],
        position_scores[2],
        position_scores[3],
    )

    top_line = build_top_line_2d_belakang(
        position_ranks[2],
        position_ranks[3],
        invest["bbfs8"],
        invest["ai4"],
        TOP_LINE_LIMIT,
    )

    prediction = {
        "bbfs8": invest["bbfs8"],
        "bbfs9": bbfs9_invest["bbfs9"],
        "ai4": invest["ai4"],
        "ai6": invest["ai6"],
        "poltar_as": position_ranks[0],
        "poltar_kop": position_ranks[1],
        "poltar_kepala": position_ranks[2],
        "poltar_ekor": position_ranks[3],
        "top_line": top_line,
        "engine_profile": "full_cross_transition_equal",
        "engine_version": ENGINE_VERSION,
    }

    print(
        "ENGINE MARKOV: "
        f"AI4={''.join(prediction['ai4'])} "
        f"CT6={''.join(prediction['ai6'])} "
        f"BBFS8={''.join(prediction['bbfs8'])} "
        f"BBFS9={''.join(prediction['bbfs9'])} "
        f"TOPLINE={len(prediction['top_line'])}"
    )

    return prediction
