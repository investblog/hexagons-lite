# REGISTRY — why the environment is the way it is

- **2026-08-08 — bootstrap (Claude).** Project initialized from `~/.agents` @ `8967634`,
  domains `[coding]` — mirrors the sibling `octagons-lite` (same kind of project: a
  zero-dependency browser visual library with an `index.html` demo), so the survey was
  answered by precedent rather than re-asked. No project-bound MCP. Claude self-config:
  `.claude/settings.json` (secrets-guard PreToolUse, light-lint PostToolUse; matcher
  includes `PowerShell` — native Windows session), `CLAUDE.md` symlink → `AGENTS.md`.
  Git hooks pre-commit/pre-push installed from `git-quality-gate`.
- **2026-08-08 — auto-palette principle adopted (ADR 002).** From
  `casino-platform/packages/core/utils/token-engine/` (progenitor:
  `dark-theme-generator`): one `brand` hex → full derived palette in LCH with
  contrast guards. Principle by reference, not a code port — the WCAG
  role-assignment machinery is text-UI-specific and blows the 4 KB budget; only the
  colour math (`color.ts`/`contrast.ts`) is worth porting at implementation time.
- **2026-08-08 — inherited incident rules.** The "Project-specific" block in `AGENTS.md`
  is carried over from `octagons-lite` verbatim: the engine is a port and those lessons
  (off-screen sleep, gradient caching, shadowBlur ban, one-clean-tab measurement, npm
  publish failure modes) were paid for there. Marked as inherited, not re-earned.
- **2026-08-08 — Codex activated.** Added `.codex/config.toml` from the local
  `secrets-guard` and `light-lint` chain fragments. Hook commands use the resolved
  Git-for-Windows shell (`W:\Program Files\Git\bin\bash.exe`); no project-bound MCP
  exists, so none was rendered.

## 2026-09-14 — хуки запускаются переносимо, без абсолютного пути к bash

Команды хуков в `.claude/settings.json`, `.codex/config.toml` и фрагментах `.agents/hooks/*/{claude.json,codex.toml}`
переписаны на единый запуск:
`git -c "alias.agent-hook=!bash .agents/hooks/<hook>/<script>.sh" agent-hook [--claude|--codex]; exit $LASTEXITCODE`.

Почему. Прежние формы ломались на Windows: абсолютный `W:\Program Files\Git\bin\bash.exe` не существует на другом ПК,
а голый `bash` из PowerShell попадает в WSL-лаунчер. Claude Code (когда Git стоит не в стандартном месте) и Codex
запускают хуки через PowerShell. Проверено: `!`-алиас git исполняется собственным sh Git-а (bash = Git Bash), из корня
репозитория; stdin/stdout/stderr и код выхода проходят. `; exit $LASTEXITCODE` нужен, потому что `powershell -Command`
превращает exit 2 в 1, а для Claude это неблокирующая ошибка: **secrets-guard на этом ПК молча пропускал `.env`**
(красный тест на старом конфиге, зелёный на новом — Claude в режимах PowerShell и Git Bash, Codex). В sh переменная
пуста — обычный `exit` с кодом git. Требование: проект — git-репозиторий, `git` в PATH.

