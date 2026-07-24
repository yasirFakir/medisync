#!/usr/bin/env python3

import sys
from pathlib import Path

# Detect paths
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent
VERSION_FILE = PROJECT_ROOT / "VERSION"

def load_version():
    if VERSION_FILE.exists():
        version_str = VERSION_FILE.read_text(encoding="utf-8").strip()
        if version_str:
            return version_str
    # Default initial version
    return "1.0.0.0"

def parse_version(version_str):
    parts = version_str.split(".")
    while len(parts) < 4:
        parts.append("0")
    return [int(x) for x in parts[:4]]

def format_version(parts):
    return ".".join(str(x) for x in parts)

def bump_version(parts, level):
    # Levels: major, minor, patch, build
    if level == "major":
        parts[0] += 1
        parts[1] = 0
        parts[2] = 0
        parts[3] = 0
    elif level == "minor":
        parts[1] += 1
        parts[2] = 0
        parts[3] = 0
    elif level == "patch":
        parts[2] += 1
        parts[3] = 0
    elif level == "build":
        parts[3] += 1
    else:
        # Default is build (4th digit)
        parts[3] += 1
    return parts

def main():
    if len(sys.argv) < 2:
        level = "build"
    else:
        level = sys.argv[1].lower()

    if level not in ["major", "minor", "patch", "build"]:
        print(f"Unknown bump level '{level}'. Must be major, minor, patch, or build.")
        sys.exit(1)

    current_version_str = load_version()
    parts = parse_version(current_version_str)
    new_parts = bump_version(parts, level)
    new_version_str = format_version(new_parts)

    VERSION_FILE.write_text(new_version_str, encoding="utf-8")
    print(f"Version bumped from {current_version_str} to {new_version_str}")

if __name__ == "__main__":
    main()
