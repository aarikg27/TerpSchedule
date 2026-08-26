# TerpSchedule

TerpSchedule is a schedule planner built for University of Maryland students. Add the courses you want, choose the constraints that matter to you, and compare ranked, conflict-free schedules without manually checking every section in Testudo.

## Features

- Search UMD courses and generate conflict-free schedules for supported semesters.
- Rank instructor quality, compactness, campus days, and walking ease in your preferred order.
- Set earliest and latest class times, days off, maximum gaps, and instructor preferences.
- Compare all schedules, schedules that can be registered for now, and schedules containing unavailable sections.
- See lectures, discussions, recitations, labs, and online meetings clearly on a weekly calendar.
- View section availability, instructor ratings, historical GPA, total credits, and schedule-wide GPA coverage.
- Open class details for rooms, the next class, estimated walking time, distance, and Google Maps directions.
- Save, name, rename, and revisit schedules across devices with an optional account.
- Share schedules privately or export them as an `.ics` calendar.
- Import a printer-friendly UMD degree audit for a structured summary of credits, completed coursework, GenEds, and remaining requirements.
- Recheck saved schedules to see whether seats have opened.
- Choose Light, Dark, or System appearance.

## How schedule ranking works

TerpSchedule first removes combinations that conflict with your required constraints. It then ranks the remaining schedules using your preference order, including instructor data, time between classes, number of campus days, and estimated walking effort.

Results are separated by availability, so a strong conceptual schedule containing a full section does not hide a schedule that can be registered for immediately.

## Data and privacy

Course, section, and seat information is refreshed automatically from public UMD sources. Instructor rating and historical GPA coverage varies by instructor and course; missing data is labeled instead of presented as a real value. Walking information is an estimate, and Google Maps should be used for route-level directions.

Accounts are optional. Degree-audit PDFs are processed to create the displayed analysis and are not retained by TerpSchedule. Saved account data can be cleared from the app.

TerpSchedule is a planning tool. Testudo and the official UMD degree audit remain authoritative for registration, seats, waitlists, academic requirements, and degree progress.

## Project status

TerpSchedule is preparing for a public beta with UMD students. Feedback and bug reports are welcome through this repository.

TerpSchedule is an independent student project and is not affiliated with or endorsed by the University of Maryland.
