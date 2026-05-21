import os

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANALYZE_API_URL = os.environ.get("ANALYZE_API_URL", "https://analisaangka.online/api/analyze")
INTERNAL_API_SECRET = os.environ.get("INTERNAL_API_SECRET", "")

MODES = {
    "ai": [2, 4, 6, 8],
    "mati": [1, 2, 3],
    "jumlah": [1, 2, 3],
    "shio": [1, 2, 3],
}

TARGET_PAIRS = ["depan", "tengah", "belakang"]
TARGET_PAIR_LABELS = {
    "depan": "AS-KOP",
    "tengah": "KOP-KEPALA",
    "belakang": "KEPALA-EKOR",
}

MATI_POSITIONS = [
    ("as", "AS", 0),
    ("kop", "KOP", 1),
    ("kepala", "KEPALA", 2),
    ("ekor", "EKOR", 3),
]

SHIO_TABLE = {}
for shio, values in [
    (1, [1, 13, 25, 37, 49, 61, 73, 85, 97]),
    (2, [2, 14, 26, 38, 50, 62, 74, 86, 98]),
    (3, [3, 15, 27, 39, 51, 63, 75, 87, 99]),
    (4, [4, 16, 28, 40, 52, 64, 76, 88, 0]),
    (5, [5, 17, 29, 41, 53, 65, 77, 89]),
    (6, [6, 18, 30, 42, 54, 66, 78, 90]),
    (7, [7, 19, 31, 43, 55, 67, 79, 91]),
    (8, [8, 20, 32, 44, 56, 68, 80, 92]),
    (9, [9, 21, 33, 45, 57, 69, 81, 93]),
    (10, [10, 22, 34, 46, 58, 70, 82, 94]),
    (11, [11, 23, 35, 47, 59, 71, 83, 95]),
    (12, [12, 24, 36, 48, 60, 72, 84, 96]),
]:
    for value in values:
        SHIO_TABLE[value] = shio
