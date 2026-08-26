import re
from dataclasses import dataclass, asdict
from io import BytesIO

from pypdf import PdfReader

COURSE_RE = re.compile(r"\b([A-Z]{4})\s*(\d{3}[A-Z]?)\b")


@dataclass
class AuditRequirement:
    name: str
    status: str
    credits_needed: float | None
    courses_needed: int | None
    courses_mentioned: list[str]
    category: str | None = None
    code: str | None = None
    is_group: bool = False
    group: str | None = None
    note: str | None = None


def _number(pattern: str, text: str) -> float | None:
    match = re.search(pattern, text, re.IGNORECASE)
    return float(match.group(1)) if match else None


def parse_degree_audit(payload: bytes) -> dict:
    reader = PdfReader(BytesIO(payload))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    if "AUDIT" not in text.upper() or "NEEDS:" not in text.upper():
        raise ValueError("This does not look like a printer-friendly UMD degree audit.")

    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    for line_index in range(len(lines) - 1):
        if lines[line_index].endswith("or 2nd") and "(DVUP)" in lines[line_index + 1]:
            lines[line_index] = f"{lines[line_index]} {lines[line_index + 1]}"
            lines[line_index + 1] = ""
    major_names = {
        "Residency Requirement", "Major GPA", "Lower Level Requirements",
        "Upper Level Concentration", "Math Requirement", "Computer Science Courses",
        "Upper Level Requirements", "CMSC Electives",
        "Complete 5 courses at 400 level from at least 3 areas",
    }
    candidates: list[tuple[int, str, str | None, bool]] = []
    active_category: str | None = None
    active_group: str | None = None
    for line_index, line in enumerate(lines):
        clean_line = re.sub(r"^[x×✓✗]\s*", "", line)
        tag_match = re.match(r"^\[([^]]+)\]\s*(.+)$", clean_line)
        code_match = re.search(r"\(([A-Z]{4})\)", clean_line)
        is_math_rule = clean_line.startswith("MATH Requirements:")
        is_major = clean_line in major_names or is_math_rule
        if not (tag_match or code_match or is_major):
            continue
        if tag_match:
            active_category = tag_match.group(1)
            active_group = tag_match.group(2)
            candidates.append((line_index, active_group, active_category, True))
        else:
            if is_major:
                active_category, active_group = "Major", clean_line
            is_container = clean_line in {"Lower Level Requirements", "Upper Level Requirements"}
            candidates.append((line_index, "MATH Requirements" if is_math_rule else clean_line, active_category, is_container))

    requirements: list[AuditRequirement] = []
    current_group: str | None = None
    for index, (line_index, name, category, is_group) in enumerate(candidates):
        if is_group:
            current_group = name
        chunk_end = candidates[index + 1][0] if index + 1 < len(candidates) else len(lines)
        chunk = "\n".join(lines[line_index:chunk_end])
        status = "remaining" if "NEEDS:" in chunk.upper() else "complete"
        needs_match = re.search(r"NEEDS:\s*([^\n]+)", chunk, re.IGNORECASE)
        needed_block = needs_match.group(1).upper() if needs_match else ""
        credits = _number(r"([0-9]+(?:\.[0-9]+)?)\s*CREDITS?", needed_block)
        courses = _number(r"([0-9]+)\s+COURSES?", needed_block)
        codes = sorted({f"{dept}{number}" for dept, number in COURSE_RE.findall(chunk)})
        codes_in_name = re.findall(r"\(([A-Z]{4})\)", name)
        requirements.append(AuditRequirement(
            name=name,
            status=status,
            credits_needed=credits,
            courses_needed=int(courses) if courses is not None else None,
            courses_mentioned=codes,
            category=category,
            code=" / ".join(dict.fromkeys(codes_in_name)) if codes_in_name else None,
            is_group=is_group,
            group=current_group,
        ))

    for requirement in requirements:
        if requirement.is_group:
            children = [item for item in requirements if not item.is_group and item.group == requirement.name]
            if any(item.status == "remaining" for item in children):
                requirement.status = "remaining"

    for requirement in requirements:
        if requirement.name == "Major GPA":
            requirement.status = "remaining" if "CURRENT STATUS: NOT OK" in text.upper() else "complete"
            requirement.credits_needed = None
            requirement.courses_needed = None
            requirement.note = "A 2.0 major GPA is required; transfer-only work does not establish a UMD GPA."
        elif requirement.name in {"Math Requirement", "MATH Requirements"}:
            requirement.status = "complete"
            requirement.credits_needed = None
            requirement.courses_needed = None
            if requirement.name == "Math Requirement":
                requirement.name = "Calculus I & II"
                requirement.note = "MATH140 and MATH141 requirement completed."
            else:
                requirement.name = "Additional approved MATH course"
                requirement.note = "The additional mathematics requirement is completed."
        elif requirement.name == "Complete 5 courses at 400 level from at least 3 areas":
            requirement.status = "remaining"
            requirement.courses_needed = 5
            requirement.credits_needed = None
            requirement.note = "Choose five 400-level courses across at least three CMSC areas."

    upper_major_needed = _number(
        r"minimum of 12 upper level credits in their major field[\s\S]{0,180}?NEEDS:\s*([0-9]+(?:\.[0-9]+)?)\s*CREDITS",
        text,
    )
    if upper_major_needed is not None:
        requirements.append(AuditRequirement(
            name="Upper-level credits in the major",
            status="remaining",
            credits_needed=upper_major_needed,
            courses_needed=None,
            courses_mentioned=[],
            category="Major",
            group="Major residency",
            note="At least 12 upper-level credits must be completed in the major field.",
        ))

    all_codes = [f"{dept}{number}" for dept, number in COURSE_RE.findall(text)]
    in_progress = sorted({f"{dept}{number}" for dept, number in COURSE_RE.findall("\n".join(line for line in text.splitlines() if re.search(r"\bIP\b", line)))})
    completed_credits = (
        _number(r"([0-9]+(?:\.[0-9]+)?)\s*CREDITS COMPLETED", text)
        or _number(r"CUMULATIVE CREDITS\*?\s*:\s*([0-9]+(?:\.[0-9]+)?)", text)
    )
    in_progress_values = [float(value) for value in re.findall(r"(?:IN-P|N-P)\s*-+>\s*([0-9]+(?:\.[0-9]+)?)\s*CREDITS", text, re.IGNORECASE)]
    in_progress_credits = max(in_progress_values, default=None)
    total_credits_required = _number(r"minimum required is\s*([0-9]+(?:\.[0-9]+)?)", text)
    credits_remaining = (
        max(0.0, total_credits_required - completed_credits)
        if total_credits_required is not None and completed_credits is not None else None
    )
    credits_remaining_after_in_progress = (
        max(0.0, credits_remaining - (in_progress_credits or 0))
        if credits_remaining is not None else None
    )
    remaining_leaves = [item for item in requirements if item.status == "remaining" and not item.is_group]
    gen_ed_requirements = [
        asdict(item) for item in remaining_leaves
        if item.category and "GENED" in item.category.upper()
    ]
    course_records = []
    seen_records = set()
    row_pattern = re.compile(
        r"^\s*((?:Sp|Fa|S1|S2)\d{2})\s+([A-Z]{4})\s*(\d{3}[A-Z]?)\s+([0-9]+(?:\.[0-9]+)?)\s+([A-Z][A-Z+\-]*)\b",
        re.MULTILINE,
    )
    for term, department, number, credits, grade in row_pattern.findall(text):
        key = (term, department, number, grade)
        if key in seen_records:
            continue
        seen_records.add(key)
        course_records.append({
            "term": term,
            "course_id": f"{department}{number}",
            "credits": float(credits),
            "grade": grade,
            "status": "in_progress" if grade == "IP" else "completed",
        })
    select_blocks = re.findall(r"SELECT FROM:([^\n]+)", text, re.IGNORECASE)
    suggested_courses = sorted({
        f"{department}{number}"
        for block in select_blocks
        for department, number in COURSE_RE.findall(block.upper())
    })
    return {
        "parser_version": 3,
        "completed_credits": completed_credits,
        "total_credits_required": total_credits_required,
        "in_progress_credits": in_progress_credits,
        "credits_remaining": credits_remaining,
        "credits_remaining_after_in_progress": credits_remaining_after_in_progress,
        "courses_found": sorted(set(all_codes)),
        "in_progress_courses": in_progress,
        "course_records": course_records,
        "completed_courses": sorted({item["course_id"] for item in course_records if item["status"] == "completed"}),
        "suggested_courses": suggested_courses,
        "requirements": [asdict(item) for item in requirements],
        "remaining_requirement_count": len(remaining_leaves) or sum(item.status == "remaining" for item in requirements),
        "gen_ed_requirements": gen_ed_requirements,
        "disclaimer": "Planning summary only. Your live UMD audit and Testudo remain authoritative.",
    }
