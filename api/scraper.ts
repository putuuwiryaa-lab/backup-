import { createClient } from '@supabase/supabase-js';

// Inisialisasi Client Supabase menggunakan Environment Variables dari Vercel
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE = "https://159.65.133.131";

const MARKETS: Record<string, string> = {
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
  "MACAU": "/data-pengeluaran-togel-macau/",
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
};

const PRIORITY_ORDER: Record<string, number> = {
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
};

async function scrapeMarket(url: string): Promise<string> {
  try {
    const res = await fetch(BASE + url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await res.text();

    const startIdx = html.indexOf('Tema Terang');
    const endIdx = html.indexOf('RESET');

    if (startIdx === -1 || endIdx === -1) return '';

    const section = html.substring(startIdx, endIdx);

    const digitMatches = [...section.matchAll(/class="paito-digit">(\d)<\/span>/g)];
    const digits = digitMatches.map(m => m[1]);

    const results: string[] = [];
    for (let i = 0; i <= digits.length - 4; i += 4) {
      results.push(digits[i] + digits[i+1] + digits[i+2] + digits[i+3]);
    }

    // Mengembalikan 169 data terakhir dipisah spasi untuk engine prediksiv3
    return results.slice(-169).join(" ");
  } catch (err) {
    console.error("Scrape Error:", err);
    return '';
  }
}

export default async function handler(req: any, res: any) {
  const secret = req.headers["x-scraper-secret"];
  if (secret !== process.env.SCRAPER_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const results: Record<string, string> = {};
    const errors: Record<string, string> = {};

    let nextAvailableOrder = 11; 

    for (const [marketId, url] of Object.entries(MARKETS)) {
      try {
        const data = await scrapeMarket(url);
        if (data) {
          const currentOrder = PRIORITY_ORDER[marketId] || nextAvailableOrder++;

          // Pindah ke Supabase menggunakan .upsert()
          const { error } = await supabase
            .from('markets')
            .upsert({ 
              id: marketId, 
              name: marketId, 
              history_data: data, // Sesuai kolom SQL history_data
              order: currentOrder,
              updated_at: new Date().toISOString()
            });

          if (error) {
            errors[marketId] = error.message;
          } else {
            results[marketId] = "OK";
          }
        } else {
          errors[marketId] = "Data kosong dari sumber";
        }
      } catch (e: any) {
        errors[marketId] = e.message;
      }
    }

    res.json({
      success: true,
      updated: Object.keys(results).length,
      results,
      errors
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
                            }
    
