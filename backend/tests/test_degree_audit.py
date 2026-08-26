from pathlib import Path
from unittest.mock import patch

from app.services.degree_audit import parse_degree_audit


class FakePage:
    def extract_text(self):
        return """MY AUDIT - AUDIT RESULTS
Cumulative Credits*: 53
x [MAJOR] Computer Science Requirements
NEEDS: 12.0 CREDITS
CMSC 420 or CMSC430
✓ [MATH] Math Requirement
MATH240 4.0 A
Fa26 CMSC132 4.0 IP
"""


class FakeReader:
    def __init__(self, _stream):
        self.pages = [FakePage()]


def test_parse_degree_audit_extracts_generic_requirements_without_ai():
    with patch("app.services.degree_audit.PdfReader", FakeReader):
        result = parse_degree_audit(b"pdf")
    assert result["completed_credits"] == 53
    assert result["remaining_requirement_count"] == 1
    assert result["in_progress_courses"] == ["CMSC132"]
    assert "CMSC420" in result["courses_found"]
