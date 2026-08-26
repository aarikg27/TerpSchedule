from datetime import date


TERM_NAMES = {"01": "Spring", "05": "Summer", "08": "Fall", "12": "Winter"}


def term_label(term_id: str) -> str:
    return f"{TERM_NAMES.get(term_id[-2:], 'Term')} {term_id[:4]}"


def current_term_id(today: date | None = None) -> str:
    today = today or date.today()
    month_day = (today.month, today.day)
    if month_day < (5, 21):
        code = "01"
    elif month_day < (8, 20):
        code = "05"
    elif month_day < (12, 20):
        code = "08"
    else:
        code = "12"
    return f"{today.year}{code}"


def sort_key(term_id: str) -> tuple[int, int]:
    order = {"01": 1, "05": 2, "08": 3, "12": 4}
    return int(term_id[:4]), order.get(term_id[-2:], 0)
