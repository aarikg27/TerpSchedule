from app.services.optimizer import SolverSection
from app.utils.bitmask import DAYS

def professor_quality(schedule: list[SolverSection]) -> float:
    """Weighted average: 60% rating/5.0 + 40% gpa/4.0"""
    if not schedule:
        return 0.0
    total = sum(
        0.6 * (s.avg_rating / 5.0) + 0.4 * (s.avg_gpa / 4.0)
        for s in schedule
    )
    return total / len(schedule)

def compactness(schedule: list[SolverSection]) -> float:
    """1.0 - min(1.0, total_gap_minutes / 600)"""
    if not schedule:
        return 1.0
        
    total_gap = 0
    for day in DAYS:
        meetings = []
        for s in schedule:
            meetings.extend([m for m in s.meetings if m.day == day])
            
        if not meetings:
            continue
            
        meetings.sort(key=lambda m: m.start_min)
        for i in range(len(meetings) - 1):
            gap = meetings[i+1].start_min - meetings[i].end_min
            if gap > 0:
                total_gap += gap
                
    return 1.0 - min(1.0, total_gap / 600.0)

def campus_days(schedule: list[SolverSection], target: int) -> float:
    """1.0 - |active_days - target| / 5"""
    if not schedule:
        return 1.0 - abs(0 - target) / 5.0
        
    active_days = set()
    for s in schedule:
        for m in s.meetings:
            if m.day in DAYS:
                active_days.add(m.day)
                
    return max(0.0, 1.0 - abs(len(active_days) - target) / 5.0)

def transit_ease(schedule: list[SolverSection], distances: dict[tuple[str,str], int], default_walk: int = 10) -> float:
    """1.0 - avg(walk_time / gap_time) for consecutive classes"""
    if not schedule:
        return 1.0
        
    ratios = []
    for day in DAYS:
        meetings = []
        for s in schedule:
            meetings.extend([m for m in s.meetings if m.day == day])
            
        if not meetings:
            continue
            
        meetings.sort(key=lambda m: m.start_min)
        for i in range(len(meetings) - 1):
            m1 = meetings[i]
            m2 = meetings[i+1]
            gap = m2.start_min - m1.end_min
            
            if not m1.building or not m2.building:
                continue
                
            if m1.building == m2.building:
                walk_time = 0
            else:
                walk_time = distances.get((m1.building, m2.building), distances.get((m2.building, m1.building), default_walk))
            
            if walk_time == 0:
                ratio = 0.0
            elif gap <= 0:
                ratio = 1.0
            else:
                ratio = min(1.0, walk_time / gap)
            ratios.append(ratio)
            
    if not ratios:
        return 1.0
        
    return 1.0 - (sum(ratios) / len(ratios))

def compute_total_score(
    schedule: list[SolverSection],
    weights: dict[str, float],
    target_campus_days: int,
    building_distances: dict[tuple[str,str], int],
    default_walk: int = 10,
) -> tuple[float, dict]:
    """Returns (score_0_to_100, metrics_dict)"""
    p = professor_quality(schedule)
    c = compactness(schedule)
    d = campus_days(schedule, target_campus_days)
    t = transit_ease(schedule, building_distances, default_walk)
    
    total_weight = sum(weights.values())
    if total_weight == 0:
        return 0.0, {}
        
    score = (
        weights.get('professor_quality', 0.0) * p +
        weights.get('compactness', 0.0) * c +
        weights.get('campus_days', 0.0) * d +
        weights.get('transit_ease', 0.0) * t
    ) / total_weight * 100
    
    avg_rating = sum(s.avg_rating for s in schedule) / len(schedule) if schedule else 0.0
    gpas_with_data = [s.avg_gpa for s in schedule if not s.gpa_is_estimated]
    avg_gpa = sum(gpas_with_data) / len(gpas_with_data) if gpas_with_data else None
    
    total_gap = 0
    max_walk = 0
    active_days_set = set()
    
    for day in DAYS:
        meetings = []
        for s in schedule:
            for m in s.meetings:
                if m.day == day:
                    meetings.append(m)
                    active_days_set.add(day)
                    
        meetings.sort(key=lambda m: m.start_min)
        for i in range(len(meetings) - 1):
            m1 = meetings[i]
            m2 = meetings[i+1]
            
            gap = m2.start_min - m1.end_min
            if gap > 0:
                total_gap += gap
                
            if m1.building and m2.building:
                if m1.building == m2.building:
                    walk = 0
                else:
                    walk = building_distances.get((m1.building, m2.building), building_distances.get((m2.building, m1.building), default_walk))
                if walk > max_walk:
                    max_walk = walk
                    
    metrics = {
        'avg_professor_rating': round(avg_rating, 2),
        'avg_gpa': round(avg_gpa, 2) if avg_gpa is not None else None,
        'gpa_sections_with_data': len(gpas_with_data),
        'gpa_sections_total': len(schedule),
        'total_credits': sum(section.credits for section in schedule),
        'total_gap_minutes': total_gap,
        'active_days': len(active_days_set),
        'max_walk_time_mins': max_walk,
        'open_sections': sum(1 for section in schedule if section.open_seats > 0),
        'unavailable_sections': sum(1 for section in schedule if section.open_seats <= 0),
        'registerable_now': all(section.open_seats > 0 for section in schedule),
    }
    
    return round(score, 1), metrics
