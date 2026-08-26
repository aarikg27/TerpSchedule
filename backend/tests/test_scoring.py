import pytest
from app.services.scoring import (
    professor_quality,
    compactness,
    campus_days,
    transit_ease,
    compute_total_score,
)
from app.services.optimizer import SolverSection, SolverMeeting
from app.utils.bitmask import empty_day_masks, build_mask


def build_test_schedule(sections_data):
    schedule = []
    for s_id, meetings, rating, gpa in sections_data:
        masks = empty_day_masks()
        for m in meetings:
            if m.day != "ONLINE":
                masks[m.day] |= build_mask(m.start_min, m.end_min)
        section = SolverSection(
            section_id=s_id,
            course_id=s_id,
            instructor="Prof",
            avg_rating=rating,
            avg_gpa=gpa,
            meetings=meetings,
            day_masks=masks,
        )
        schedule.append(section)
    return schedule


def test_professor_quality_perfect():
    sched = build_test_schedule([
        ("S1", [SolverMeeting("M", 540, 590, "B1", "R1")], 5.0, 4.0),
        ("S2", [SolverMeeting("W", 600, 650, "B1", "R1")], 5.0, 4.0),
    ])
    score = professor_quality(sched)
    assert score == 1.0


def test_professor_quality_default():
    sched = build_test_schedule([
        ("S1", [SolverMeeting("M", 540, 590, "B1", "R1")], 3.0, 3.0),
    ])
    score = professor_quality(sched)
    assert 0.0 <= score <= 1.0


def test_compactness_no_gaps():
    sched = build_test_schedule([
        ("S1", [SolverMeeting("M", 540, 590, "B1", "R1")], 5.0, 4.0),
        ("S2", [SolverMeeting("M", 590, 640, "B1", "R1")], 5.0, 4.0),
    ])
    score = compactness(sched)
    assert score >= 0.9


def test_compactness_large_gap():
    sched = build_test_schedule([
        ("S1", [SolverMeeting("M", 540, 590, "B1", "R1")], 5.0, 4.0),
        ("S2", [SolverMeeting("M", 1000, 1050, "B1", "R1")], 5.0, 4.0),
    ])
    score = compactness(sched)
    assert score < 0.5


def test_campus_days_exact_match():
    sched = build_test_schedule([
        ("S1", [SolverMeeting("M", 540, 590, "B1", "R1")], 5.0, 4.0),
        ("S2", [SolverMeeting("Tu", 600, 650, "B1", "R1")], 5.0, 4.0),
    ])
    score = campus_days(sched, target=2)
    assert score == 1.0


def test_campus_days_mismatch():
    sched = build_test_schedule([
        ("S1", [SolverMeeting("M", 540, 590, "B1", "R1")], 5.0, 4.0),
        ("S2", [SolverMeeting("Tu", 600, 650, "B1", "R1")], 5.0, 4.0),
    ])
    score = campus_days(sched, target=5)
    assert round(score, 2) == 0.4


def test_transit_ease_same_building():
    sched = build_test_schedule([
        ("S1", [SolverMeeting("M", 540, 590, "B1", "R1")], 5.0, 4.0),
        ("S2", [SolverMeeting("M", 590, 640, "B1", "R2")], 5.0, 4.0),
    ])
    score = transit_ease(sched, distances={}, default_walk=10)
    assert score == 1.0


def test_total_score_range():
    sched = build_test_schedule([
        ("S1", [SolverMeeting("M", 540, 590, "B1", "R1")], 5.0, 4.0),
    ])
    weights = {
        "professor_quality": 0.25,
        "compactness": 0.25,
        "campus_days": 0.25,
        "transit_ease": 0.25,
    }
    score, metrics = compute_total_score(
        schedule=sched,
        weights=weights,
        target_campus_days=3,
        building_distances={},
        default_walk=10,
    )
    assert 0 <= score <= 100
    assert "avg_professor_rating" in metrics
    assert "avg_gpa" in metrics


def test_displayed_gpa_excludes_fallbacks_and_credits_are_totaled():
    schedule = [
        SolverSection("S1", "C1", avg_gpa=3.6, gpa_is_estimated=False, credits=4),
        SolverSection("S2", "C2", avg_gpa=3.0, gpa_is_estimated=True, credits=3),
    ]
    _, metrics = compute_total_score(
        schedule=schedule,
        weights={"professor_quality": 1.0},
        target_campus_days=3,
        building_distances={},
    )
    assert metrics["avg_gpa"] == 3.6
    assert metrics["gpa_sections_with_data"] == 1
    assert metrics["gpa_sections_total"] == 2
    assert metrics["total_credits"] == 7


def test_empty_schedule():
    sched = build_test_schedule([])
    weights = {
        "professor_quality": 0.25,
        "compactness": 0.25,
        "campus_days": 0.25,
        "transit_ease": 0.25,
    }
    score, metrics = compute_total_score(
        schedule=sched,
        weights=weights,
        target_campus_days=3,
        building_distances={},
        default_walk=10,
    )
    assert score >= 0


def test_all_zero_weights():
    sched = build_test_schedule([
        ("S1", [SolverMeeting("M", 540, 590, "B1", "R1")], 5.0, 4.0),
    ])
    weights = {
        "professor_quality": 0.0,
        "compactness": 0.0,
        "campus_days": 0.0,
        "transit_ease": 0.0,
    }
    score, metrics = compute_total_score(
        schedule=sched,
        weights=weights,
        target_campus_days=3,
        building_distances={},
        default_walk=10,
    )
    assert score == 0.0
