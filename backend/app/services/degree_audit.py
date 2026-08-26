import re
from dataclasses import dataclass, asdict
from io import BytesIO

from pypdf import PdfReader

COURSE_RE = re.compile(r"\b([A-Z]{4})\s*(\d{3}[A-Z]?)\b")
HEADING_RE = re.compile(r"^\s*[x×✓✗*]?\s*(\[[^\]]+\]\s*[^\n]+)", re.MULTILINE)


@dataclass
class AuditRequirement:
    name: str
    status: str
    credits_needed: float | None
    courses_needed: int | None
    courses_mentioned: list[str]


def _number(pattern: str, text: str) -> float | None:
    match = re.search(pattern, text, re.IGNORECASE)
    return float(match.group(1)) if match else None


def parse_degree_audit(payload: bytes) -> dict:
    reader = PdfReader(BytesIO(payload))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    if "AUDIT" not in text.upper() or "NEEDS:" not in text.upper():
        raise ValueError("This does not look like a printer-friendly UMD degree audit.")

    headings = list(HEADING_RE.finditer(text))
    requirements: list[AuditRequirement] = []
    for index, heading in enumerate(headings):
        chunk = text[heading.start():headings[index + 1].start() if index + 1 < len(headings) else len(text)]
        name = re.sub(r"\s+", " ", heading.group(1)).strip()
        status = "remaining" if "NEEDS:" in chunk.upper() else "complete"
        needed_block = chunk.upper().split("NEEDS:", 1)[1][:250] if "NEEDS:" in chunk.upper() else ""
        credits = _number(r"([0-9]+(?:\.[0-9]+)?)\s+CREDITS?", needed_block)
        courses = _number(r"([0-9]+)\s+COURSES?", needed_block)
        codes = sorted({f"{dept}{number}" for dept, number in COURSE_RE.findall(chunk)})
        requirements.append(AuditRequirement(name, status, credits, int(courses) if courses is not None else None, codes))

    all_codes = [f"{dept}{number}" for dept, number in COURSE_RE.findall(text)]
    in_progress = sorted({f"{dept}{number}" for dept, number in COURSE_RE.findall("\n".join(line for line in text.splitlines() if re.search(r"\bIP\b", line)))})
    completed_credits = (
        _number(r"([0-9]+(?:\.[0-9]+)?)\s+CREDITS COMPLETED", text)
        or _number(r"CUMULATIVE CREDITS\*?\s*:\s*([0-9]+(?:\.[0-9]+)?)", text)
    )
    return {
        "completed_credits": completed_credits,
        "courses_found": sorted(set(all_codes)),
        "in_progress_courses": in_progress,
        "requirements": [asdict(item) for item in requirements],
        "remaining_requirement_count": sum(item.status == "remaining" for item in requirements),
        "disclaimer": "Planning summary only. Your live UMD audit and Testudo remain authoritative.",
    }
