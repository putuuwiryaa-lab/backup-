import re
import requests
from bs4 import BeautifulSoup

TOTOGP_MARKETS = {
    "SINGAPORE6D": "https://totogpb.store/wap/keluaran/8",
    "NUSANTARA": "https://totogpb.store/wap/keluaran/109",
}

DAYS = "Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu"

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
}


def scrape_totogp_market(url: str, limit: int = 170, max_pages: int = 60) -> str:
    results = []

    for page in range(1, max_pages + 1):
        page_url = url if page == 1 else f"{url}?page={page}"

        try:
            response = requests.get(page_url, headers=HEADERS, timeout=25, allow_redirects=True)
            response.raise_for_status()
        except Exception as error:
            print(f"Error fetching TOTOGP {page_url}: {error}")
            break

        soup = BeautifulSoup(response.text, "html.parser")
        text = soup.get_text(" ", strip=True)

        matches = re.findall(
            rf"\b\d{{2}}-\d{{2}}-\d{{4}}\b\s+(?:{DAYS})\s+(\d{{4}})",
            text,
            flags=re.IGNORECASE,
        )

        if not matches:
            break

        results.extend(matches)

        if len(results) >= limit:
            break

    cleaned = []
    seen = set()

    for item in results:
        if re.fullmatch(r"\d{4}", item) and item not in seen:
            cleaned.append(item)
            seen.add(item)

    # TOTOGP lists newest result first. The app/evaluator expects oldest to newest.
    ordered = list(reversed(cleaned))

    return " ".join(ordered[-limit:])


if __name__ == "__main__":
    for market_id, url in TOTOGP_MARKETS.items():
        data = scrape_totogp_market(url)
        items = data.split()
        print(market_id)
        print("TOTAL:", len(items))
        print("OLDEST:", items[0] if items else "KOSONG")
        print("LATEST:", items[-1] if items else "KOSONG")
        print(data)
