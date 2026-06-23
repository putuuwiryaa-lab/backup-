import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

SEJAHTERA_MARKETS = {
    "MONGOLIA": "https://sejahteragagah.com/mobile/togel/pasaran-18",
    "NEW MEXICO DAY": "https://sejahteragagah.com/mobile/togel/pasaran-78",
    "NEW MEXICO EVE": "https://sejahteragagah.com/mobile/togel/pasaran-79",
}

DAYS = "Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu"
DATE_PATTERN = r"\d{1,2}/\d{1,2}/\d{4}"

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


def make_page_url(base_url: str, page: int) -> str:
    if page <= 1:
        return base_url

    parts = urlsplit(base_url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query["page"] = str(page)

    return urlunsplit((
        parts.scheme,
        parts.netloc,
        parts.path,
        urlencode(query),
        parts.fragment,
    ))


def parse_sejahtera_results(html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text)

    results = []

    # Format situs:
    # Mongolia Senin 22/06/2026 7 8 0 6
    pattern = rf"(?:{DAYS})\s+{DATE_PATTERN}\s+(\d)\s+(\d)\s+(\d)\s+(\d)"
    for match in re.findall(pattern, text, flags=re.IGNORECASE):
        results.append("".join(match))

    # Fallback:
    # 22/06/2026 7 8 0 6
    if not results:
        fallback_pattern = rf"{DATE_PATTERN}\s+(\d)\s+(\d)\s+(\d)\s+(\d)"
        for match in re.findall(fallback_pattern, text, flags=re.IGNORECASE):
            results.append("".join(match))

    cleaned = []
    seen = set()

    for item in results:
        if re.fullmatch(r"\d{4}", item) and item not in seen:
            cleaned.append(item)
            seen.add(item)

    return cleaned


def scrape_sejahtera_market(url: str, limit: int = 170, max_pages: int = 25) -> str:
    all_results = []

    for page in range(1, max_pages + 1):
        page_url = make_page_url(url, page)

        try:
            response = requests.get(
                page_url,
                headers=HEADERS,
                timeout=30,
                allow_redirects=True,
            )
            response.raise_for_status()
        except Exception as error:
            print(f"Error scraping Sejahtera {page_url}: {error}")
            break

        page_results = parse_sejahtera_results(response.text)

        if not page_results:
            break

        before = len(all_results)

        for item in page_results:
            if item not in all_results:
                all_results.append(item)

        added = len(all_results) - before

        if len(all_results) >= limit:
            break

        if page > 1 and added == 0:
            break

    # Sejahtera lists newest result first. The app/evaluator expects oldest to newest.
    ordered = list(reversed(all_results))
    return " ".join(ordered[-limit:])


if __name__ == "__main__":
    for market_id, url in SEJAHTERA_MARKETS.items():
        data = scrape_sejahtera_market(url)
        items = data.split()
        print(market_id)
        print("TOTAL:", len(items))
        print("OLDEST:", items[0] if items else "KOSONG")
        print("LATEST:", items[-1] if items else "KOSONG")
        print(data)
