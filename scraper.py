import requests
import re
import time
import random
import os
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_ANON_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

BASE = "https://159.65.133.131"

MARKETS = {
  "MAGNUM CAMBODIA": "/data-pengeluaran-togel-magnum-cambodia/",
  "BULLSEYE": "/data-pengeluaran-togel-bullseye/",
  "SYDNEY LOTTO": "/data-pengeluaran-togel-sdlotto/",
  "SYDNEY POOLS": "/data-pengeluaran-togel-sydney-pools/",
  "SYDNEY LOTTERY": "/data-pengeluaran-togel-sydney/",
  "CHINA POOLS": "/data-pengeluaran-togel-chinapools/",
  "SAO PAULO": "/data-pengeluaran-togel-sao-paulo/",
  "JAPAN": "/data-pengeluaran-togel-japan/",
  "SINGAPORE": "/data-pengeluaran-togel-singapore/",
  "TAIWAN": "/data-pengeluaran-togel-taiwan/",
  "HONGKONG LOTTERY": "/data-pengeluaran-togel-hongkong/",
  "HONGKONG POOLS": "/data-pengeluaran-togel-hongkong-pools/",
  "HONGKONG LOTTO": "/data-pengeluaran-togel-hklotto/",
  "TOTO MACAU 00": "/data-pengeluaran-togel-toto-macau-5/",
  "GRANADA": "/data-pengeluaran-togel-granada/",
  "MALAWI": "/data-pengeluaran-togel-malawi/",
  "MARYLAND MIDDAY": "/data-pengeluaran-togel-maryland-midday/",
  "GEORGIA MIDDAY": "/data-pengeluaran-togel-georgia-midday/",
  "MOROCCO 23:59": "/data-pengeluaran-togel-morocco-quatro-23-59-wib/",
  "MURCIA": "/data-pengeluaran-togel-murcia/",
  "MICHIGAN MIDDAY": "/data-pengeluaran-togel-michigan-midday/",
  "NEW JERSEY MIDDAY": "/data-pengeluaran-togel-new-jersey-midday/",
  "GERMANY PLUS5": "/data-pengeluaran-togel-germany-plus5/",
  "MARBELLA": "/data-pengeluaran-togel-marbella/",
  "INDIANA MIDDAY": "/data-pengeluaran-togel-indiana-midday/",
  "TENNESSE MIDDAY": "/data-pengeluaran-togel-tennesse-midday/",
  "KENTUCKY MID": "/data-pengeluaran-togel-kentucky-midday/",
  "TEXAS DAY": "/data-pengeluaran-togel-texas-day/",
  "FLORIDA MID": "/data-pengeluaran-togel-florida-midday/",
  "MILWAUKEE MIDDAY": "/data-pengeluaran-togel-milwaukee-midday/",
  "ILLINOIS MIDDAY": "/data-pengeluaran-togel-illinois-midday/",
  "MILAN": "/data-pengeluaran-togel-milan/",
  "MISSOURI MIDDAY": "/data-pengeluaran-togel-missouri-midday/",
  "WASHINGTON DC MIDDAY": "/data-pengeluaran-togel-washington-dc-midday/",
  "CONNECTICUT DAY": "/data-pengeluaran-togel-connecticut-day/",
  "VIRGINIA DAY": "/data-pengeluaran-togel-virginia-day/",
  "VENICE": "/data-pengeluaran-togel-venice/",
  "NEW YORK MID": "/data-pengeluaran-togel-new-york-midday/",
  "PISA": "/data-pengeluaran-togel-pisa/",
  "MOROCCO 03:00": "/data-pengeluaran-togel-morocco-quatro-03-00-wib/",
  "CAROLINA DAY": "/data-pengeluaran-togel-north-carolina-day/",
  "NAPLES": "/data-pengeluaran-togel-naples/",
  "SIENA": "/data-pengeluaran-togel-siena/",
  "MISSISSAUGA DAY": "/data-pengeluaran-togel-mississauga-day/",
  "OREGON 4": "/data-pengeluaran-togel-oregon-04-00-wib/",
  "ST PETERSBURG": "/data-pengeluaran-togel-st-petersburg/",
  "VLADIMIR": "/data-pengeluaran-togel-vladimir/",
  "SOCHI": "/data-pengeluaran-togel-sochi/",
  "HAMBURG": "/data-pengeluaran-togel-hamburg/",
  "BOCHUM": "/data-pengeluaran-togel-bochum/",
  "ROSTOCK": "/data-pengeluaran-togel-rostock/",
  "WEST VIRGINIA": "/data-pengeluaran-togel-west-virginia/",
  "GEORGIA EVE": "/data-pengeluaran-togel-georgia-evening/",
  "OREGON 7": "/data-pengeluaran-togel-oregon-07-00-wib/",
  "TEXAS EVE": "/data-pengeluaran-togel-texas-evening/",
  "WEIMAR": "/data-pengeluaran-togel-weimar/",
  "TENNESSE EVE": "/data-pengeluaran-togel-tennesse-evening/",
  "MICHIGAN EVE": "/data-pengeluaran-togel-michigan-evening/",
  "MUNSTER": "/data-pengeluaran-togel-munster/",
  "MARYLAND EVE": "/data-pengeluaran-togel-maryland-evening/",
  "WASHINGTON DC EVE": "/data-pengeluaran-togel-washington-dc-evening/",
  "MISSISSAUGA EVE": "/data-pengeluaran-togel-mississauga-evening/",
  "LYON": "/data-pengeluaran-togel-lyon/",
  "PARIS": "/data-pengeluaran-togel-paris/",
  "METZ": "/data-pengeluaran-togel-metz/",
  "MUENCHEN": "/data-pengeluaran-togel-muenchen/",
  "VERSAILLES": "/data-pengeluaran-togel-versailles/",
  "CALIFORNIA": "/data-pengeluaran-togel-california/",
  "MONTREAL": "/data-pengeluaran-togel-montreal/",
  "FLORIDA EVE": "/data-pengeluaran-togel-florida-evening/",
  "REIMS": "/data-pengeluaran-togel-reims/",
  "MISSOURI EVE": "/data-pengeluaran-togel-missouri-evening/",
  "GLASGOW": "/data-pengeluaran-togel-glasgow/",
  "OREGON 10": "/data-pengeluaran-togel-oregon-10-00-wib/",
  "WISCONSIN EVE": "/data-pengeluaran-togel-wisconsin-evening/",
  "TROYES": "/data-pengeluaran-togel-troyes/",
  "ILLINOIS EVE": "/data-pengeluaran-togel-illinois-evening/",
  "CONNECTICUT NIGHT": "/data-pengeluaran-togel-connecticut-night/",
  "MARSEILLE": "/data-pengeluaran-togel-marseille/",
  "NEW YORK EVE": "/data-pengeluaran-togel-new-york-evening/",
  "ISTANBUL": "/data-pengeluaran-togel-istanbul/",
  "INDIANA EVE": "/data-pengeluaran-togel-indiana-evening/",
  "NEW JERSEY EVE": "/data-pengeluaran-togel-new-jersey-evening/",
  "KENTUCKY EVE": "/data-pengeluaran-togel-kentucky-evening/",
  "LISBON": "/data-pengeluaran-togel-lisbon/",
  "VIRGINIA NIGHT": "/data-pengeluaran-togel-virginia-night/",
  "TEXAS NIGHT": "/data-pengeluaran-togel-texas-night/",
  "BUENOS AIRES": "/data-pengeluaran-togel-buenos-aires/",
  "CAROLINA EVE": "/data-pengeluaran-togel-north-carolina-evening/",
  "MISSISSAUGA NIGHT": "/data-pengeluaran-togel-mississauga-night/",
  "GEORGIA NIGHT": "/data-pengeluaran-togel-georgia-night/",
  "RIO DE JANEIRO": "/data-pengeluaran-togel-rio-de-janeiro/",
  "MUMBAI": "/data-pengeluaran-togel-mumbai/",
  "SAN DIEGO": "/data-pengeluaran-togel-san-diego/",
  "BEIJING": "/data-pengeluaran-togel-beijing/",
  "SANTIAGO": "/data-pengeluaran-togel-santiago/",
  "NEW DELHI": "/data-pengeluaran-togel-new-delhi/",
  "OREGON 13": "/data-pengeluaran-togel-oregon-13-00-wib/",
  "TOTO MACAU 13": "/data-pengeluaran-togel-toto-macau-1/",
  "BOGOTA": "/data-pengeluaran-togel-bogota/",
  "MELBOURNE": "/data-pengeluaran-togel-melbourne/",
  "JOHOR": "/data-pengeluaran-togel-johor/",
  "SAPPORO": "/data-pengeluaran-togel-sapporo/",
  "SHANGHAI": "/data-pengeluaran-togel-shanghai/",
  "SAITAMA": "/data-pengeluaran-togel-saitama/",
  "MISSISSAUGA MIDNIGHT": "/data-pengeluaran-togel-mississauga-midnight/",
  "FUKUOKA": "/data-pengeluaran-togel-fukuoka/",
  "NANJING": "/data-pengeluaran-togel-nanjing/",
  "BANGKOK": "/data-pengeluaran-togel-bangkok/",
  "TOTO MACAU 16": "/data-pengeluaran-togel-toto-macau-2/",
  "TAIYUAN": "/data-pengeluaran-togel-taiyuan/",
  "TOKYO": "/data-pengeluaran-togel-tokyo/",
  "LUZHOU": "/data-pengeluaran-togel-luzhou/",
  "GUANG ZHOU": "/data-pengeluaran-togel-guang-zhou/",
  "HUIZHOU": "/data-pengeluaran-togel-huizhou/",
  "OSAKA": "/data-pengeluaran-togel-osaka/",
  "PHOENIX": "/data-pengeluaran-togel-phoenix/",
  "MOROCCO 18:00": "/data-pengeluaran-togel-morocco-quatro-18-00-wib/",
  "INCHEON": "/data-pengeluaran-togel-incheon/",
  "SEOUL": "/data-pengeluaran-togel-seoul/",
  "SUWON": "/data-pengeluaran-togel-suwon/",
  "HANOI": "/data-pengeluaran-togel-hanoi/",
  "TOTO MACAU 19": "/data-pengeluaran-togel-toto-macau-3/",
  "GUNPO": "/data-pengeluaran-togel-gunpo/",
  "YOKOHAMA": "/data-pengeluaran-togel-toto-macau-3/",
  "PAJU": "/data-pengeluaran-togel-paju/",
  "NAGOYA": "/data-pengeluaran-togel-nagoya/",
  "PCSO": "/data-pengeluaran-togel-pcso/",
  "LINCOLN": "/data-pengeluaran-togel-lincoln/",
  "MILWAUKEE MORNING": "/data-pengeluaran-togel-milwaukee-morning/",
  "BIRMINGHAM": "/data-pengeluaran-togel-birmingham/",
  "LAS VEGAS": "/data-pengeluaran-togel-las-vegas/",
  "MOROCCO 21:00": "/data-pengeluaran-togel-morocco-quatro-21-00-wib/",
  "ROTTERDAM": "/data-pengeluaran-togel-rotterdam/",
  "PERTH": "/data-pengeluaran-togel-perth/",
  "DARLINGTON": "/data-pengeluaran-togel-darlington/",
  "MALDIVES": "/data-pengeluaran-togel-maldives/",
  "TOTO MACAU 22": "/data-pengeluaran-togel-toto-macau-4/",
  "GREENWICH": "/data-pengeluaran-togel-greenwich/",
  "TENNESSE MORNING": "/data-pengeluaran-togel-tennesse-morning/",
  "MEXICO CITY": "/data-pengeluaran-togel-mexico-city/",
  "JENEWA": "/data-pengeluaran-togel-jenewa/",
  "MISSISSAUGA MORNING": "/data-pengeluaran-togel-mississauga-morning/",
  "TAIPEI": "/data-pengeluaran-togel-taipei/",
  "TEXAS MORNING": "/data-pengeluaran-togel-texas-morning/",
  "ZURICH": "/data-pengeluaran-togel-zurich/",
  "WARSAW": "/data-pengeluaran-togel-warsaw/",
  "LUCERNE": "/data-pengeluaran-togel-lucerne/",
}

PRIORITY_ORDER = {
  "MAGNUM CAMBODIA": 1,
  "SYDNEY POOLS": 2,
  "SYDNEY LOTTO": 3,
  "CHINA POOLS": 4,
  "JAPAN": 5,
  "SINGAPORE": 6,
  "PCSO": 7,
  "TAIWAN": 8,
  "HONGKONG POOLS": 9,
  "HONGKONG LOTTO": 10,
}

def scrape_market(url):
    try:
        res = requests.get(
            BASE + url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
            timeout=15,
            verify=False
        )
        html = res.text

        start_idx = html.find('Tema Terang')
        end_idx = html.find('RESET')

        if start_idx == -1 or end_idx == -1:
            return ''

        section = html[start_idx:end_idx]
        digits = re.findall(r'class="paito-digit">(\d)</span>', section)

        results = []
        for i in range(0, len(digits) - 3, 4):
            results.append(digits[i] + digits[i+1] + digits[i+2] + digits[i+3])

        return ' '.join(results[-170:])
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return ''

def main():
    next_order = 11
    success = 0
    errors = 0

    for market_id, url in MARKETS.items():
        data = scrape_market(url)
        if data:
            current_order = PRIORITY_ORDER.get(market_id, next_order)
            if market_id not in PRIORITY_ORDER:
                next_order += 1

            result = supabase.table('markets').upsert({
                'id': market_id,
                'name': market_id,
                'history_data': data,
                'order': current_order,
                'updated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            }).execute()

            print(f"OK: {market_id}")
            success += 1
        else:
            print(f"SKIP: {market_id} (data kosong)")
            errors += 1

        # Delay random 2-4 detik
        delay = random.uniform(2, 4)
        time.sleep(delay)

    print(f"\nSelesai: {success} OK, {errors} skip/error")

if __name__ == "__main__":
    main()
