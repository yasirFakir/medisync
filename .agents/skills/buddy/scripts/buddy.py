#!/usr/bin/env python3

from pathlib import Path
import re
import sys


# --------------------------------------------------
# Project root detection
# --------------------------------------------------

# Current file:
# .agents/skills/buddy/scripts/buddy.py

SCRIPT_DIR = Path(__file__).resolve().parent

# The buddy skill directory containing SKILL.md, references/, scripts/
BUDDY_SKILL_ROOT = SCRIPT_DIR.parent

# The project root: /data/rspace/codespace/projects/medisync
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent


# --------------------------------------------------
# Project docs (unchanged)
# --------------------------------------------------

ENGINEERING = PROJECT_ROOT / "docs" / "Engineering"
TASKS = PROJECT_ROOT / "tasks"
ADRS = PROJECT_ROOT / "docs" / "ADR"


AGENT_RULES = ENGINEERING / "05_AGENT_RULES.md"


# --------------------------------------------------
# Buddy skill files
# --------------------------------------------------

SKILL_FILE = BUDDY_SKILL_ROOT / "SKILL.md"

REFERENCES = BUDDY_SKILL_ROOT / "references"


OUTPUT = PROJECT_ROOT / ".ai" / "context.md"



def read_file(path):

    if path.exists():
        return path.read_text(encoding="utf-8")

    return ""



def extract_adrs(text):

    return sorted(
        set(
            re.findall(
                r"ADR-\d{3}",
                text
            )
        )
    )



def extract_engineering_docs(text):

    return sorted(
        set(
            re.findall(
                r"docs/Engineering/([A-Za-z0-9_\-]+\.md)",
                text
            )
        )
    )



def build_context(command, task_name):

    context = []


    # Main skill definition
    context.append(
        "# BUDDY SKILL\n\n" +
        read_file(SKILL_FILE)
    )


    # Agent rules from docs
    context.append(
        "# AGENT RULES\n\n" +
        read_file(AGENT_RULES)
    )


    # Command reference
    command_file = REFERENCES / f"{command}.md"

    context.append(
        f"# COMMAND {command}\n\n" +
        read_file(command_file)
    )


    # Task
    task_file = TASKS / f"{task_name}.md"
    if task_file.exists():
        task_text = read_file(task_file)
        context.append(
            f"# TASK {task_name}\n\n" +
            task_text
        )

        # ADR dependencies
        for adr in extract_adrs(task_text):
            adr_file = ADRS / f"{adr}.md"
            context.append(
                f"# {adr}\n\n" +
                read_file(adr_file)
            )

        # Engineering dependencies
        for guide in extract_engineering_docs(task_text):
            guide_file = ENGINEERING / guide
            context.append(
                f"# {guide}\n\n" +
                read_file(guide_file)
            )

    return "\n\n".join(context)



def main():

    if len(sys.argv) != 3:

        print(
            "Usage:\n"
            "python buddy.py implement TASK-006\n"
            "python buddy.py plan TASK-006"
        )

        sys.exit(1)


    command = sys.argv[1]
    task = sys.argv[2]


    context = build_context(
        command,
        task
    )


    OUTPUT.parent.mkdir(
        exist_ok=True
    )


    OUTPUT.write_text(
        context,
        encoding="utf-8"
    )


    print("Generated:")
    print(OUTPUT)



if __name__ == "__main__":
    main()
