from datetime import date

from app.services.terms import current_term_id, term_label


def test_current_term_calendar_boundaries():
    assert current_term_id(date(2026, 2, 1)) == "202601"
    assert current_term_id(date(2026, 6, 1)) == "202605"
    assert current_term_id(date(2026, 8, 25)) == "202608"
    assert current_term_id(date(2026, 12, 22)) == "202612"


def test_term_labels():
    assert term_label("202701") == "Spring 2027"
    assert term_label("202608") == "Fall 2026"
