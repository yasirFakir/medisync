# commit.md

> **Purpose**
>
> Guide the AI to version bump and commit the latest changes using proper version control policies and project-specific guidelines.

---

## Objective

Bump the project version and commit the changes using Git following project standards and conventional commits.

---

## Workflow

1. **Assess Changes**: Identify the type of changes made (breaking, feature, fix, chore, docs).
2. **Determine Bump Level**:
   - `major` for breaking changes.
   - `minor` for new features.
   - `patch` for bug fixes.
   - `build` (or default) for minor updates, chores, or documentation.
3. **Execute Version Bump**: Run the version control script:
   ```bash
   python3 .agents/skills/buddy/scripts/version_control.py <level>
   ```
4. **Git Rules & Guidelines**:
   - Refer to the Git rules defined in [05_AGENT_RULES.md](file:///data/rspace/codespace/projects/medisync/docs/Engineering/05_AGENT_RULES.md#L183-L194).
   - Never commit directly to `main` unless explicitly requested.
   - Stage the changes: `git add .` (including the updated `VERSION` file).
   - Commit with a Conventional Commits message format: `<type>: <description> (vX.Y.Z.W)`
     - *Example:* `feat: add database schema migrations (v1.1.0.0)`

---

## Success Criteria

A successful commit action:
* Bumps the 4-digit version correctly in the `VERSION` file.
* Adheres to the Git Rules in the project documentation.
* Uses the proper Conventional Commits format.
