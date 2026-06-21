from evaluator.processor import run_all_markets
from evaluator.market_statistics import rebuild_market_statistics


if __name__ == "__main__":
    run_all_markets()
    rebuild_market_statistics()
