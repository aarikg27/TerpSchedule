import pytest
from app.services.optimizer import ScheduleOptimizer, SolverSection, SolverMeeting


def test_basic_valid_schedule():
    sections = {
        "C1": [SolverSection("S1", "C1", "Prof A", meetings=[SolverMeeting("M", 540, 590, "B1", "R1")])],
        "C2": [SolverSection("S2", "C2", "Prof B", meetings=[SolverMeeting("M", 600, 650, "B1", "R2")])],
    }
    optimizer = ScheduleOptimizer(course_sections=sections)
    results = optimizer.solve()
    assert len(results) >= 1


def test_all_conflicting_zero_results():
    sections = {
        "C1": [SolverSection("S1", "C1", "Prof A", meetings=[SolverMeeting("M", 540, 600, "B1", "R1")])],
        "C2": [SolverSection("S2", "C2", "Prof B", meetings=[SolverMeeting("M", 540, 600, "B1", "R2")])],
    }
    optimizer = ScheduleOptimizer(course_sections=sections)
    results = optimizer.solve()
    assert len(results) == 0


def test_blocked_day_enforcement():
    sections = {
        "C1": [SolverSection("S1", "C1", "Prof A", meetings=[SolverMeeting("M", 540, 590, "B1", "R1")])],
    }
    optimizer = ScheduleOptimizer(course_sections=sections, blocked_days={"M"})
    results = optimizer.solve()
    assert len(results) == 0


def test_earliest_time_enforcement():
    sections = {
        "C1": [SolverSection("S1", "C1", "Prof A", meetings=[SolverMeeting("M", 480, 530, "B1", "R1")])],
    }
    optimizer = ScheduleOptimizer(course_sections=sections, earliest_start=540)
    results = optimizer.solve()
    assert len(results) == 0


def test_avoid_professor():
    sections = {
        "C1": [SolverSection("S1", "C1", "Dr. Bad", meetings=[SolverMeeting("M", 540, 590, "B1", "R1")])],
    }
    optimizer = ScheduleOptimizer(course_sections=sections, avoid_professors={"Dr. Bad"})
    results = optimizer.solve()
    assert len(results) == 0


def test_online_course_no_conflict():
    sections = {
        "C1": [SolverSection("S1", "C1", "Prof A", meetings=[SolverMeeting("ONLINE", 0, 0)])],
        "C2": [SolverSection("S2", "C2", "Prof B", meetings=[SolverMeeting("M", 540, 600, "B1", "R1")])],
    }
    optimizer = ScheduleOptimizer(course_sections=sections)
    results = optimizer.solve()
    assert len(results) >= 1


def test_max_gap_constraint():
    # 540-590 and 770-820 = 180 min gap, max_gap=60 should reject
    sections = {
        "C1": [SolverSection("S1", "C1", "Prof A", meetings=[SolverMeeting("M", 540, 590, "B1", "R1")])],
        "C2": [SolverSection("S2", "C2", "Prof B", meetings=[SolverMeeting("M", 770, 820, "B1", "R2")])],
    }
    optimizer = ScheduleOptimizer(course_sections=sections, max_gap_minutes=60)
    results = optimizer.solve()
    assert len(results) == 0


def test_combinations_counted():
    sections = {
        "C1": [SolverSection("S1", "C1", "Prof A", meetings=[SolverMeeting("M", 540, 590, "B1", "R1")])],
        "C2": [SolverSection("S2", "C2", "Prof B", meetings=[SolverMeeting("M", 600, 650, "B1", "R2")])],
    }
    optimizer = ScheduleOptimizer(course_sections=sections)
    optimizer.solve()
    assert optimizer.combinations_checked > 0


def test_empty_input():
    optimizer = ScheduleOptimizer(course_sections={})
    results = optimizer.solve()
    assert results == []


def test_open_only_excludes_full_sections():
    sections = {
        "C1": [
            SolverSection("FULL", "C1", "Prof A", open_seats=0, meetings=[SolverMeeting("M", 540, 590)]),
            SolverSection("OPEN", "C1", "Prof B", open_seats=4, meetings=[SolverMeeting("M", 600, 650)]),
        ]
    }
    results = ScheduleOptimizer(sections, availability="open_only").solve()
    assert [[section.section_id for section in schedule] for schedule in results] == [["OPEN"]]


def test_course_specific_preferred_instructor():
    sections = {
        "C1": [
            SolverSection("A", "C1", "Wanted Prof", meetings=[SolverMeeting("M", 540, 590)]),
            SolverSection("B", "C1", "Other Prof", meetings=[SolverMeeting("M", 600, 650)]),
        ],
        "C2": [SolverSection("C", "C2", "Different Department", meetings=[SolverMeeting("W", 540, 590)])],
    }
    results = ScheduleOptimizer(sections, preferred_instructors={"C1": {"wanted prof"}}).solve()
    assert len(results) == 1
    assert [section.section_id for section in results[0]] == ["A", "C"]


def test_multiple_sections_per_course():
    sections = {
        "C1": [
            SolverSection("S1", "C1", "Prof A", meetings=[SolverMeeting("M", 540, 590)]),
            SolverSection("S2", "C1", "Prof B", meetings=[SolverMeeting("M", 600, 650)]),
        ],
        "C2": [
            SolverSection("S3", "C2", "Prof C", meetings=[SolverMeeting("M", 540, 590)]),
            SolverSection("S4", "C2", "Prof D", meetings=[SolverMeeting("M", 660, 710)]),
        ],
    }
    optimizer = ScheduleOptimizer(course_sections=sections)
    results = optimizer.solve()
    # S1+S4 and S2+S3 are non-conflicting, S2+S4 too, S1+S3 conflicts
    assert len(results) == 3
