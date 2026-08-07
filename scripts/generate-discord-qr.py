#!/usr/bin/env python3
"""Generate the static Discord invite QR used by the closing slide."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.parse import urlparse

from reportlab.graphics import renderSVG
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate discord-qr.svg from workshop configuration")
    parser.add_argument("config", type=Path, help="JSON file containing discord_invite_url")
    parser.add_argument("output", type=Path, help="Destination SVG")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    with args.config.open("r", encoding="utf-8") as stream:
        payload = json.load(stream)

    invite = str(payload.get("discord_invite_url") or "").strip()
    parsed = urlparse(invite)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValueError("discord_invite_url must be a complete HTTPS URL")

    widget = qr.QrCodeWidget(invite, barLevel="M")
    x1, y1, x2, y2 = widget.getBounds()
    size = 640
    quiet = 38
    scale = (size - 2 * quiet) / max(x2 - x1, y2 - y1)
    drawing = Drawing(size, size, transform=[scale, 0, 0, scale, quiet, quiet])
    drawing.add(widget)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    renderSVG.drawToFile(drawing, str(args.output))
    print(f"Generated Discord invite QR: {args.output}")


if __name__ == "__main__":
    main()

