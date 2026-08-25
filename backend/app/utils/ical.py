import pytz
from datetime import datetime, timedelta
from icalendar import Calendar, Event, vRecur

def generate_ical(sections_data: list[dict], start_date_str: str = "2026-08-31") -> bytes:
    cal = Calendar()
    cal.add('prodid', '-//TerpSchedule//terpschedule.com//')
    cal.add('version', '2.0')
    
    tz = pytz.timezone('America/New_York')
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    end_date = start_date + timedelta(weeks=15)
    
    day_map = {
        "M": "MO",
        "Tu": "TU",
        "W": "WE",
        "Th": "TH",
        "F": "FR",
        "Sa": "SA",
        "Su": "SU"
    }
    
    for section in sections_data:
        course_id = section.get('course_id')
        section_id = section.get('section_id')
        instructor = section.get('instructor', 'TBA')
        
        for meeting in section.get('meetings', []):
            day_str = meeting.get('day')
            if not day_str or day_str not in day_map:
                continue
                
            start_time_str = meeting.get('start')
            end_time_str = meeting.get('end')
            if not start_time_str or not end_time_str:
                continue
                
            building = meeting.get('building', '')
            room = meeting.get('room', '')
            location = f"{building} {room}".strip()
            
            target_weekday = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"].index(day_map[day_str])
            days_ahead = target_weekday - start_date.weekday()
            if days_ahead < 0:
                days_ahead += 7
            first_meeting_date = start_date + timedelta(days=days_ahead)
            
            start_dt = datetime.strptime(start_time_str, "%H:%M").time()
            end_dt = datetime.strptime(end_time_str, "%H:%M").time()
            
            dtstart = tz.localize(datetime.combine(first_meeting_date, start_dt))
            dtend = tz.localize(datetime.combine(first_meeting_date, end_dt))
            
            event = Event()
            event.add('summary', f"{course_id} - {section_id}")
            event.add('dtstart', dtstart)
            event.add('dtend', dtend)
            if location:
                event.add('location', location)
            event.add('description', f"Instructor: {instructor}")
            
            until_dt = tz.localize(datetime.combine(end_date, end_dt))
            event.add('rrule', vRecur(freq='WEEKLY', byday=day_map[day_str], until=until_dt))
            cal.add_component(event)
            
    return cal.to_ical()
