"""
Koala Victoria production wrapper.

- Scrapes all configured Koala Victoria markets.
- Resolves market names for every Koala ID from the site's market links.
- Rejects generic navigation labels before writing to Supabase.
- Stores history_data in Supabase and runs prediction flow.
"""

import random
import re
import time

from bs4 import BeautifulSoup

from prediction_storage import process_prediction_flow, supabase
from scraper_koalavictoria_multi_v6_fixed import (
    BASE_URL,
    HOME_URL,
    MARKET_DELAY,
    MARKET_IDS,
    REQUEST_TIMEOUT,
    create_session,
    scrape_market,
)


KOALA_ORDER_START = 34

# Only names already verified independently are hard-coded. Every other market
# is resolved from the official KoalaVictoria market links or page heading.
VERIFIED_MARKET_NAMES = {
    20: "Swedia",
    68: "Kingkong 4D 1",
    76: "Beijing",
    81: "Kingkong 4D 2",
}

GENERIC_MARKET_NAMES = {
    "",
    "DAFTAR",
    "DAFTAR PASARAN",
    "DATA",
    "DATA KELUARAN",
    "HASIL",
    "HOME",
    "KELUARAN",
    "MARKET",
    "MOBILE",
    "NOMOR",
    "PASARAN",
    "RESULT",
    "WEB",
}

MARKET_LINK_RE = re.compile(r"/(?:wap/)?keluaran/(\d+)(?:$|[/?#])", re.I)
MARKET_WRAPPER_RE = re.compile(
    r"^(?:(?:daftar|data|hasil|result)\s+)?(?:keluaran|pasaran|market)\s*[:\-]?\s*",
    re.I,
)


def clean_name(value) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip(" \t\r\n-|:")


def normalize_market_name(value) -> str:
    name = clean_name(value)
    previous = None
    while name and name != previous:
        previous = name
        name = MARKET_WRAPPER_RE.sub("", name).strip(" \t\r\n-|:")
    return clean_name(name)


def is_valid_market_name(value) -> bool:
    name = normalize_market_name(value)
    if not name or name.upper() in GENERIC_MARKET_NAMES:
        return False
    if re.fullmatch(r"\d+", name):
        return False
    return any(character.isalpha() for character in name)


def discover_market_names(html: str) -> dict[int, str]:
    """Build an ID-to-name map from official /keluaran/<id> links."""
    soup = BeautifulSoup(html or "", "html.parser")
    discovered: dict[int, str] = {}

    for link in soup.find_all("a", href=True):
        match = MARKET_LINK_RE.search(str(link.get("href") or ""))
        if not match:
            continue

        market_id = int(match.group(1))
        candidate = normalize_market_name(link.get_text(" ", strip=True))
        if market_id in MARKET_IDS and is_valid_market_name(candidate):
            discovered.setdefault(market_id, candidate)

    return discovered


def resolve_market_name(
    source_id: int,
    detected_name: str,
    discovered_names: dict[int, str],
) -> tuple[str, str]:
    if source_id in VERIFIED_MARKET_NAMES:
        return VERIFIED_MARKET_NAMES[source_id], "verified"

    discovered_name = discovered_names.get(source_id)
    if is_valid_market_name(discovered_name):
        return normalize_market_name(discovered_name), "market-list"

    if is_valid_market_name(detected_name):
        return normalize_market_name(detected_name), "page-heading"

    raise RuntimeError(
        f"nama market Koala ID {source_id} tidak valid: {detected_name!r}"
    )


def build_history_data(records) -> str:
    return " ".join(record.result for record in records)


def main() -> None:
    unique_market_ids = list(dict.fromkeys(MARKET_IDS))

    success = 0
    errors = 0
    processed = 0
    discovered_names: dict[int, str] = {}

    session = create_session()

    try:
        try:
            warmup = session.get(HOME_URL, timeout=REQUEST_TIMEOUT)
            warmup.raise_for_status()
            discovered_names = discover_market_names(warmup.text)
            print(
                f"[KOALA WARM-UP] status={warmup.status_code} "
                f"cookies={len(session.cookies)} "
                f"names={len(discovered_names)}/{len(unique_market_ids)}"
            )
            if discovered_names:
                mapping = ", ".join(
                    f"{market_id}={discovered_names[market_id]}"
                    for market_id in unique_market_ids
                    if market_id in discovered_names
                )
                print(f"[KOALA NAME MAP] {mapping}")

            missing = [
                market_id
                for market_id in unique_market_ids
                if market_id not in discovered_names
                and market_id not in VERIFIED_MARKET_NAMES
            ]
            if missing:
                print(f"[KOALA NAME MAP WARNING] missing={missing}")
        except Exception as error:
            # Individual pages can still provide a valid heading. Invalid names
            # are rejected later rather than written into Supabase.
            print(f"[KOALA WARM-UP WARNING] {error}")

        for index, source_id in enumerate(unique_market_ids):
            url = BASE_URL.format(market_id=source_id)
            stable_market_id = f"KOALA_{source_id}"
            current_order = KOALA_ORDER_START + index

            print("\n" + "=" * 72)
            print(
                f"KOALA MARKET {index + 1}/{len(unique_market_ids)} "
                f"| source_id={source_id} "
                f"| database_id={stable_market_id}"
            )
            print("=" * 72)

            try:
                records, detected_name, pages_read, scrape_error = scrape_market(
                    session,
                    source_id,
                )

                resolved_name, name_source = resolve_market_name(
                    source_id,
                    detected_name,
                    discovered_names,
                )
                print(
                    f"[KOALA NAME] source_id={source_id} "
                    f"detected={detected_name!r} "
                    f"resolved={resolved_name!r} source={name_source}"
                )

                history_data = build_history_data(records)
                if not history_data:
                    print(
                        f"SKIP KOALA: {stable_market_id} "
                        f"({resolved_name}) data kosong "
                        f"error={scrape_error or '-'}"
                    )
                    errors += 1
                    continue

                latest = records[-1].result
                total = len(records)

                supabase.table("markets").upsert(
                    {
                        "id": stable_market_id,
                        "name": resolved_name,
                        "history_data": history_data,
                        "order": current_order,
                        "updated_at": time.strftime(
                            "%Y-%m-%dT%H:%M:%SZ",
                            time.gmtime(),
                        ),
                    }
                ).execute()

                if process_prediction_flow(
                    stable_market_id,
                    resolved_name,
                    history_data,
                ):
                    processed += 1

                print(
                    f"OK KOALA: id={stable_market_id} "
                    f"name={resolved_name} "
                    f"total={total} "
                    f"latest={latest} "
                    f"pages={pages_read}"
                )
                success += 1

            except Exception as error:
                # One market must not stop the remaining markets.
                print(
                    f"ERROR KOALA: id={stable_market_id} "
                    f"url={url} error={error}"
                )
                errors += 1

            if index < len(unique_market_ids) - 1:
                time.sleep(random.uniform(*MARKET_DELAY))

    finally:
        session.close()

    print(
        f"\nKoala Victoria selesai: "
        f"{success} OK, "
        f"{errors} skip/error, "
        f"{processed} prediction flow diproses"
    )


if __name__ == "__main__":
    main()
