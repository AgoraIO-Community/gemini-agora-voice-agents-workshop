#!/usr/bin/env python3
"""Generate printable 10-up workshop phone-number cards from JSON."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen.canvas import Canvas


PAGE_WIDTH, PAGE_HEIGHT = letter
CARD_WIDTH = 3.5 * 72
CARD_HEIGHT = 2 * 72
LEFT_MARGIN = (PAGE_WIDTH - (2 * CARD_WIDTH)) / 2
BOTTOM_MARGIN = (PAGE_HEIGHT - (5 * CARD_HEIGHT)) / 2

INK = HexColor("#0A0A0A")
MUTED = HexColor("#5A5A5A")
LINE = HexColor("#D0CECD")
ACCENT = HexColor("#08488A")
SOFT = HexColor("#F5F3F4")

REQUIRED_FIELDS = ("phone_number",)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate US Letter sheets of 3.5 x 2 inch phone-number cards."
    )
    parser.add_argument("input", type=Path, help="Workshop phone-number JSON")
    parser.add_argument("output", type=Path, help="Destination PDF")
    parser.add_argument(
        "--cut-guides",
        action="store_true",
        help="Add light cutting guides for plain white paper",
    )
    return parser.parse_args()


def load_assignments(path: Path) -> tuple[dict[str, Any], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8") as stream:
        payload = json.load(stream)

    assignments = payload.get("assignments")
    if not isinstance(assignments, list) or not assignments:
        raise ValueError("JSON must contain a non-empty assignments array")

    for index, assignment in enumerate(assignments, start=1):
        if not isinstance(assignment, dict):
            raise ValueError(f"Assignment {index} must be an object")
        missing = [field for field in REQUIRED_FIELDS if not assignment.get(field)]
        if missing:
            raise ValueError(
                f"Assignment {index} is missing required fields: {', '.join(missing)}"
            )

    normalized = [
        {field: str(assignment[field]) for field in REQUIRED_FIELDS}
        for assignment in assignments
    ]
    return payload, normalized


def fit_text(text: str, font: str, max_size: float, min_size: float, width: float) -> float:
    size = max_size
    while size > min_size and stringWidth(text, font, size) > width:
        size -= 0.25
    return size


def draw_card(
    canvas: Canvas,
    assignment: dict[str, str],
    event: str,
    city: str,
    support_contact: str,
    x: float,
    y: float,
) -> None:
    pad = 13
    inner_width = CARD_WIDTH - (2 * pad)

    canvas.setFillColor(Color(1, 1, 1, 1))
    canvas.rect(x, y, CARD_WIDTH, CARD_HEIGHT, fill=1, stroke=0)

    canvas.setFillColor(SOFT)
    canvas.roundRect(x + pad, y + CARD_HEIGHT - 35, CARD_WIDTH - (2 * pad), 23, 5, fill=1, stroke=0)

    canvas.setFillColor(ACCENT)
    canvas.setFont("Helvetica-Bold", 7.2)
    canvas.drawString(x + pad + 8, y + CARD_HEIGHT - 25, "AGORA VOICE AI WORKSHOP")

    canvas.setFillColor(INK)
    event_size = fit_text(event, "Helvetica-Bold", 9.2, 7, inner_width - 2)
    canvas.setFont("Helvetica-Bold", event_size)
    canvas.drawString(x + pad, y + CARD_HEIGHT - 49, event)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 6.5)
    canvas.drawString(x + pad, y + CARD_HEIGHT - 59, city)

    canvas.setFillColor(ACCENT)
    canvas.setFont("Helvetica-Bold", 6.2)
    canvas.drawString(x + pad, y + CARD_HEIGHT - 76, "YOUR WORKSHOP PHONE NUMBER")

    phone = assignment["phone_number"]
    phone_size = fit_text(phone, "Helvetica-Bold", 17, 11, inner_width)
    canvas.setFillColor(INK)
    canvas.setFont("Helvetica-Bold", phone_size)
    canvas.drawString(x + pad, y + CARD_HEIGHT - 98, phone)

    canvas.setStrokeColor(LINE)
    canvas.line(x + pad, y + 34, x + CARD_WIDTH - pad, y + 34)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 6)
    canvas.drawString(x + pad, y + 23, "Enter this number in Agent Studio.")
    canvas.drawString(x + pad, y + 13, "Use the shared SIP trunk shown by the presenter.")
    support_size = fit_text(support_contact, "Helvetica", 5.2, 4.6, inner_width)
    canvas.setFont("Helvetica", support_size)
    canvas.drawString(x + pad, y + 4, support_contact)


def draw_cut_guides(canvas: Canvas) -> None:
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.35)
    canvas.setDash(2, 2)
    for column in range(3):
        x = LEFT_MARGIN + column * CARD_WIDTH
        canvas.line(x, BOTTOM_MARGIN - 9, x, PAGE_HEIGHT - BOTTOM_MARGIN + 9)
    for row in range(6):
        y = BOTTOM_MARGIN + row * CARD_HEIGHT
        canvas.line(LEFT_MARGIN - 9, y, PAGE_WIDTH - LEFT_MARGIN + 9, y)
    canvas.restoreState()


def generate_pdf(
    output: Path,
    payload: dict[str, Any],
    assignments: list[dict[str, str]],
    cut_guides: bool,
) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas = Canvas(str(output), pagesize=letter)
    canvas.setTitle("Agora workshop phone-number cards")
    canvas.setAuthor("Agora")

    event = str(payload.get("event") or "Agora Voice AI Workshop")
    city = str(payload.get("city") or "Workshop event")
    support_contact = str(payload.get("support_contact") or "Ask a workshop host for help")

    for start in range(0, len(assignments), 10):
        page_assignments = assignments[start : start + 10]
        for index, assignment in enumerate(page_assignments):
            column = index % 2
            row_from_top = index // 2
            x = LEFT_MARGIN + column * CARD_WIDTH
            y = PAGE_HEIGHT - BOTTOM_MARGIN - ((row_from_top + 1) * CARD_HEIGHT)
            draw_card(canvas, assignment, event, city, support_contact, x, y)
        if cut_guides:
            draw_cut_guides(canvas)
        canvas.showPage()

    canvas.save()


def main() -> None:
    args = parse_args()
    payload, assignments = load_assignments(args.input)
    generate_pdf(args.output, payload, assignments, args.cut_guides)
    print(f"Generated {len(assignments)} cards across {(len(assignments) + 9) // 10} page(s): {args.output}")


if __name__ == "__main__":
    main()
