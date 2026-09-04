# Rule: Safe Changes & Non-Destructive Operation

1. **Isolation:** Never modify files in the reference web repository (`/data/rspace/codespace/projects/medisync`).
2. **Preserve Integrity:** Never weaken, bypass, or delete existing automated tests merely to make a build pass.
3. **Security:** Never hardcode secrets, API keys, passwords, or credentials into source code or markdown docs.
4. **Focused Scope:** Avoid touching unrelated modules or performing gratuitous refactoring during feature or bugfix tasks.
