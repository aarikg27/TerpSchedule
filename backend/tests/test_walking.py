from app.services.walking import estimate_walk


def test_walk_estimate_uses_route_factor_and_rounds_up():
    meters, minutes = estimate_walk(100)
    assert meters == 128
    assert minutes == 2


def test_walk_estimate_has_one_minute_minimum_for_distinct_buildings():
    assert estimate_walk(1)[1] == 1
