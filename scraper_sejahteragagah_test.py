import argparse
import re
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

import requests
from bs4 import BeautifulSoup

DEFAULT_URL = "https://sejahteragagah.com/mobile/togel/pasaran-18"
DAYS = "Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday"
DATE_PATTERN = r"\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b"
RESULT_PATTERN = r"\b\d{4}\b"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Linux; Android 10; Mobile) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/121.0.0.0 Mobile Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Referer": "https://sejahteragagah.com/",
}


def page_url(base_url: str, page: int) -> str:
    if page <= 1:
        return base_url

    parts = urlsplit(base_url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query["page"] = str(page)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def clean_result(value: str) -> str | None:
    text = str(value or "").strip()
    match = re.fullmatch(r"\d{4}", text)
    return match.group(0) if match else None


def extract_from_tables(soup: BeautifulSoup) -> list[str]:
    """Ambil result dari baris tabel/list. Aman untuk layout mobile yang pakai table atau div."""
    results: list[str] = []

    row_nodes = soup.select("tr, li, .row, .list-group-item, .card, .panel, .result, .keluaran")
    for row in row_nodes:
        cells = [cell.get_text(" ", strip=True) for cell in row.select("td, th, div, span")]
        row_text = " ".join(cells) if cells else row.get_text(" ", strip=True)
        row_text = re.sub(r"\s+", " ", row_text).strip()
        if not row_text:
            continue

        has_date = re.search(DATE_PATTERN, row_text)
        has_day = re.search(rf"\b(?:{DAYS})\b", row_text, flags=re.IGNORECASE)
        candidates = re.findall(RESULT_PATTERN, row_text)

        if not candidates:
            continue

        # Kalau ada tanggal/hari, biasanya angka result adalah 4 digit terakhir di baris itu.
        # Ini menghindari tahun tanggal seperti 2026 ikut diambil sebagai result.
        if has_date or has_day:
            results.append(candidates[-1])
            continue

        # Fallback untuk table yang result berada di cell sendiri.
        exact_cells = [clean_result(cell) for cell in cells]
        exact_cells = [item for item in exact_cells if item]
        if exact_cells:
            results.append(exact_cells[-1])

    return results


def extract_from_text(text: str) -> list[str]:
    """Fallback regex untuk pola mirip TOTOGP: tanggal + hari + result."""
    compact = re.sub(r"\s+", " ", text or " ").strip()

    patterns = [
        rf"{DATE_PATTERN}\s+(?:{DAYS})\s+(\d{{4}})",
        rf"(?:{DAYS})\s+{DATE_PATTERN}\s+(\d{{4}})",
        rf"{DATE_PATTERN}\s+(\d{{4}})",
    ]

    results: list[str] = []
    for pattern in patterns:
        results.extend(re.findall(pattern, compact, flags=re.IGNORECASE))

    return results


def unique_keep_order(items: list[str]) -> list[str]:
    cleaned: list[str] = []
    seen: set[str] = set()
    for item in items:
        result = clean_result(item)
        if not result or result in seen:
            continue
        cleaned.append(result)
        seen.add(result)
    return cleaned


def scrape_sejahteragagah_market(
    url: str = DEFAULT_URL,
    limit: int = 170,
    max_pages: int = 20,
    debug_html: str | None = None,
) -> str:
    session = requests.Session()
    results: list[str] = []

    for page in range(1, max_pages + 1):
        current_url = page_url(url, page)
        print(f"FETCH {current_url}")

        try:
            response = session.get(current_url, headers=HEADERS, timeout=30, allow_redirects=True)
            response.raise_for_status()
        except Exception as error:
            print(f"ERROR fetching {current_url}: {error}")
            break

        if debug_html and page == 1:
            with open(debug_html, "w", encoding="utf-8") as file:
                file.write(response.text)
            print(f"DEBUG HTML saved: {debug_html}")

        soup = BeautifulSoup(response.text, "html.parser")
        text = soup.get_text(" ", strip=True)

        page_results = extract_from_tables(soup)
        if not page_results:
            page_results = extract_from_text(text)

        page_results = unique_keep_order(page_results)
        print(f"PAGE {page}: found={len(page_results)}")

        if not page_results:
            break

        before = len(results)
        results.extend(page_results)
        results = unique_keep_order(results)
        added = len(results) - before

        if len(results) >= limit:
            break

        # Kalau halaman berikutnya mengulang isi yang sama, hentikan.
        if page > 1 and added <= 0:
            break

    # Asumsi umum situs keluaran: terbaru tampil paling atas.
    # App/evaluator butuh urutan lama -> baru.
    ordered = list(reversed(unique_keep_order(results)))
    return " ".join(ordered[-limit:])


def main():
    parser = argparse.ArgumentParser(description="Test scraper Sejahtera Gagah pasaran mobile.")
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--limit", type=int, default=170)
    parser.add_argument("--max-pages", type=int, default=20)
    parser.add_argument("--debug-html", default="sejahteragagah_debug.html")
    args = parser.parse_args()

    data = scrape_sejahteragagah_market(
        url=args.url,
        limit=args.limit,
        max_pages=args.max_pages,
        debug_html=args.debug_html,
    )
    items = data.split()

    print("\nSEJAHTERA_GAGAH_TEST")
    print("URL:", args.url)
    print("TOTAL:", len(items))
    print("OLDEST:", items[0] if items else "KOSONG")
    print("LATEST:", items[-1] if items else "KOSONG")
    print("DATA:")
    print(data)


if __name__ == "__main__":
    main()
