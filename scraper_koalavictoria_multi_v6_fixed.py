"""Scraper multi-market Koala Victoria.

Mengambil maksimal 170 result per market dari newest-first di situs,
lalu menghasilkan output oldest-first untuk kompatibilitas prediction engine.

Dependencies:
    pip install requests beautifulsoup4
"""

from __future__ import annotations

import csv
import json
import random
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE_URL = "https://koalavictoria.com/wap/keluaran/{market_id}"
HOME_URL = "https://koalavictoria.com/wap"
MARKET_IDS = [20, 26, 34, 41, 44, 58, 62, 64, 66, 67, 68, 70, 71, 74, 75, 76, 77, 81, 82]
OUTPUT_DIR = Path("koalavictoria_output")
HISTORY_LIMIT = 170
MAX_PAGES = 60
REQUEST_TIMEOUT = 30
PAGE_DELAY = 0.8
MARKET_DELAY = (2.0, 4.0)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Linux; Android 13; Mobile) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/126.0.0.0 Mobile Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

DATE_RE = re.compile(r"\b(\d{2}-\d{2}-\d{4})\b")
ROW_RE = re.compile(
    r"\b(\d{2}-\d{2}-\d{4})\b\s+"
    r"(Senin|Selasa|Rabu|Kamis|Jumat|Jum['’]?at|Sabtu|Minggu)\s+"
    r"(\d{4})\b",
    re.IGNORECASE,
)
RESULT_RE = re.compile(r"^\d{4}$")
DAYS = {
    "senin": "Senin", "selasa": "Selasa", "rabu": "Rabu",
    "kamis": "Kamis", "jumat": "Jumat", "jum'at": "Jumat",
    "jum’at": "Jumat", "sabtu": "Sabtu", "minggu": "Minggu",
}


@dataclass(frozen=True)
class DrawRecord:
    draw_date: str
    day_name: str
    result: str


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def normalize_day(value: str) -> str | None:
    value = clean(value).lower()
    if value in DAYS:
        return DAYS[value]
    for key, normalized in DAYS.items():
        if re.search(rf"\b{re.escape(key)}\b", value):
            return normalized
    return None


def valid_result(value: str, draw_date: str) -> str | None:
    value = clean(value)
    if not RESULT_RE.fullmatch(value):
        return None
    if value in re.findall(r"\d{4}", draw_date):
        return None
    return None if 1900 <= int(value) <= 2099 else value


def page_url(url: str, page: int) -> str:
    if page <= 1:
        return url
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query["page"] = str(page)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def create_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(HEADERS)
    retry = Retry(
        total=3,
        connect=3,
        read=3,
        status=3,
        backoff_factor=1.0,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({"GET"}),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def dedupe(records: Iterable[DrawRecord]) -> list[DrawRecord]:
    output: list[DrawRecord] = []
    seen: set[tuple[str, str]] = set()
    for record in records:
        key = (record.draw_date, record.result)
        if key not in seen:
            seen.add(key)
            output.append(record)
    return output


def parse_table(soup: BeautifulSoup) -> list[DrawRecord]:
    records: list[DrawRecord] = []
    for row in soup.select("tr"):
        cells = [clean(cell.get_text(" ", strip=True)) for cell in row.find_all(["td", "th"])]
        if len(cells) < 3:
            continue
        date = next((m.group(1) for cell in cells if (m := DATE_RE.search(cell))), None)
        day = next((day for cell in cells if (day := normalize_day(cell))), None)
        result = next((result for cell in reversed(cells) if date and (result := valid_result(cell, date))), None)
        if date and day and result:
            records.append(DrawRecord(date, day, result))
    return dedupe(records)


def parse_compact(soup: BeautifulSoup) -> list[DrawRecord]:
    records: list[DrawRecord] = []
    for element in soup.find_all(["tr", "li", "div", "p", "article"]):
        text = clean(element.get_text(" ", strip=True))
        if not text or len(text) > 300:
            continue
        match = ROW_RE.search(text)
        if match:
            date, day, result = match.groups()
            records.append(DrawRecord(date, normalize_day(day) or day, result))
    return dedupe(records)


def parse_sequence(soup: BeautifulSoup) -> list[DrawRecord]:
    lines = [clean(line) for line in soup.get_text("\n", strip=True).splitlines() if clean(line)]
    records: list[DrawRecord] = []
    index = 0
    while index < len(lines):
        match = DATE_RE.search(lines[index])
        if not match:
            index += 1
            continue
        date = match.group(1)
        day: str | None = normalize_day(lines[index])
        result: str | None = None
        cursor = index + 1
        while cursor < min(len(lines), index + 12):
            if DATE_RE.search(lines[cursor]):
                break
            day = day or normalize_day(lines[cursor])
            if day and not result:
                result = valid_result(lines[cursor], date)
            if day and result:
                break
            cursor += 1
        if day and result:
            records.append(DrawRecord(date, day, result))
            index = max(index + 1, cursor + 1)
        else:
            index += 1
    return dedupe(records)


def extract_records(html: str) -> tuple[list[DrawRecord], str]:
    soup = BeautifulSoup(html, "html.parser")
    candidates = [
        ("table", parse_table(soup)),
        ("strict-sequence", parse_sequence(soup)),
        ("compact", parse_compact(soup)),
    ]
    best = max(candidates, key=lambda item: len(item[1]))
    return best[1], best[0]


def detect_market_name(soup: BeautifulSoup, market_id: int) -> str:
    lines = [clean(line) for line in soup.get_text("\n", strip=True).splitlines() if clean(line)]
    ignored = {"TANGGAL", "HARI", "NOMOR", "BERANDA", "WEB", "MOBILE", "SELAMAT DATANG", "WITHDRAW", "DEPOSIT"}
    for index, line in enumerate(lines):
        if line.upper() != "TANGGAL":
            continue
        for candidate in reversed(lines[max(0, index - 12):index]):
            if candidate.upper() not in ignored and len(candidate) <= 40 and not any(ch.isdigit() for ch in candidate):
                return candidate
    return f"MARKET {market_id}"


def scrape_market(session: requests.Session, market_id: int) -> tuple[list[DrawRecord], str, int, str]:
    url = BASE_URL.format(market_id=market_id)
    collected: list[DrawRecord] = []
    seen: set[tuple[str, str]] = set()
    signatures: set[tuple[tuple[str, str], ...]] = set()
    market_name = f"MARKET {market_id}"
    pages_read = 0
    error = ""

    for page in range(1, MAX_PAGES + 1):
        current_url = page_url(url, page)
        print(f"[ID {market_id} PAGE {page}] {current_url}")
        try:
            response = session.get(current_url, headers={"Referer": HOME_URL}, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
        except requests.RequestException as exc:
            error = str(exc)
            print(f"[ERROR] {error}")
            break

        pages_read += 1
        soup = BeautifulSoup(response.text, "html.parser")
        if page == 1:
            market_name = detect_market_name(soup, market_id)

        page_records, method = extract_records(response.text)
        print(f"[PARSER] {method} records={len(page_records)}")
        if not page_records:
            break

        signature = tuple((r.draw_date, r.result) for r in page_records)
        if signature in signatures:
            print("[STOP] pagination mengulang data")
            break
        signatures.add(signature)

        for record in page_records:
            key = (record.draw_date, record.result)
            if key not in seen:
                seen.add(key)
                collected.append(record)

        if len(collected) >= HISTORY_LIMIT:
            break
        time.sleep(PAGE_DELAY)

    return list(reversed(collected))[-HISTORY_LIMIT:], market_name, pages_read, error


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", clean(value).lower()).strip("_") or "market"


def save_market(market_id: int, market_name: str, records: list[DrawRecord]) -> tuple[str, str, str]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    base = f"{market_id}_{slugify(market_name)}"
    history_path = OUTPUT_DIR / f"{base}_history.txt"
    csv_path = OUTPUT_DIR / f"{base}_records.csv"
    history = " ".join(record.result for record in records)
    history_path.write_text(history, encoding="utf-8")
    with csv_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["market_id", "market_name", "date", "day", "result"])
        for record in records:
            writer.writerow([market_id, market_name, record.draw_date, record.day_name, record.result])
    return str(history_path), str(csv_path), history


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    session = create_session()
    summary: list[dict] = []

    try:
        warmup = session.get(HOME_URL, timeout=REQUEST_TIMEOUT)
        print(f"[WARM-UP] status={warmup.status_code} cookies={len(session.cookies)}")

        for index, market_id in enumerate(dict.fromkeys(MARKET_IDS), start=1):
            print("\n" + "=" * 72)
            print(f"MARKET {index}/{len(MARKET_IDS)} | ID {market_id}")
            records, market_name, pages_read, error = scrape_market(session, market_id)
            item = {
                "market_id": market_id,
                "market_name": market_name,
                "url": BASE_URL.format(market_id=market_id),
                "status": "OK" if records else "ERROR/DATA KOSONG",
                "total": len(records),
                "pages_read": pages_read,
                "error": error,
            }
            if records:
                history_file, records_file, history = save_market(market_id, market_name, records)
                item.update({
                    "oldest": asdict(records[0]),
                    "latest": asdict(records[-1]),
                    "history_file": history_file,
                    "records_file": records_file,
                    "history_data": history,
                })
                print(f"[OK] {market_name}: total={len(records)} latest={records[-1].result}")
            summary.append(item)
            (OUTPUT_DIR / "koalavictoria_all_markets.json").write_text(
                json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            if index < len(MARKET_IDS):
                time.sleep(random.uniform(*MARKET_DELAY))
    finally:
        session.close()

    with (OUTPUT_DIR / "koalavictoria_summary.csv").open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["market_id", "market_name", "status", "total", "pages_read", "url", "error"])
        for item in summary:
            writer.writerow([item[key] for key in ("market_id", "market_name", "status", "total", "pages_read", "url", "error")])

    success = sum(item["status"] == "OK" for item in summary)
    print(f"\nSelesai: {success} berhasil, {len(summary) - success} gagal/kosong")


if __name__ == "__main__":
    main()
