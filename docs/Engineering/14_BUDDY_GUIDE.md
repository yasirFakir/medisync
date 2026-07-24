# Buddy Command Guide

`buddy` is a custom routing and context optimization tool for the MediSync development lifecycle. It compiles task-specific rules, templates, and dependencies into a single, token-optimized context file (`.ai/context.md`) to guide the AI agent without loading unnecessary files.

---

## How to Use /buddy

You can trigger the `buddy` skill directly inside the Antigravity TUI session using the `/buddy` slash command, or run the underlying script manually.

### 1. Implementing a Task
Compiles context specifically for the targeted task (e.g., loading `GEMINI.md`, the task file, referenced ADRs, and the `implement.md` playbook):
```text
/buddy implement TASK-001
```

### 2. Version Bumping and Committing Changes
Bumps the project's 4-digit version (`X.Y.Z.W`) using `version_control.py` and instructs the agent to commit changes following Conventional Commits and Git workflow guidelines:
```text
/buddy commit <level>
```
*   **Levels:** `major`, `minor`, `patch`, `build` (defaults to `build`).
*   *Example:* `/buddy commit minor`

---

## How It Works Under the Hood

When you execute `/buddy <command> <argument>`:
1. The agent invokes the `buddy` skill.
2. It executes the helper script:
   ```bash
   python3 .agents/skills/buddy/scripts/buddy.py <command> <argument>
   ```
3. The script locates dependencies, strips out unnecessary documentation, and writes a unified context file to `.ai/context.md`.
4. The agent reads `.ai/context.md` and immediately performs the requested action.

---

## Extension and Customization

To add new workflows or modify commands:
1. **Routing Manifest**: Edit the routing table in [.agents/skills/buddy/SKILL.md](file:///data/rspace/codespace/projects/medisync/.agents/skills/buddy/SKILL.md).
2. **Command Playbooks**: Create or update playbooks in [.agents/skills/buddy/references/](file:///data/rspace/codespace/projects/medisync/.agents/skills/buddy/references/).
3. **Re-cache Plugin**: Run the following commands to reload the changes in `agy`:
   ```bash
   agy plugin validate .agents && agy plugin install .agents
   ```
