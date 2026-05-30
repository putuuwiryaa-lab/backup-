from evaluator.processor import run_all_markets
from evaluator.rekap_watch import refresh_rekap_watchlist
from evaluator.market_statistics import refresh_market_statistics


if __name__ == "__main__":
    run_all_markets()
    refresh_rekap_watchlist()
    refresh_market_statistics()
