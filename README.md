<div align="center">

# pi-mission

### Factory.ai-inspired mission orchestration for pi

**[Install](#install)** · **[Usage](#usage)** · **[How it works](#how-it-works)** · **[Modes](#modes)**

![pi-mission demo](demo.svg)

</div>

Run structured, multi-phase development missions inside [pi](https://github.com/badlogic/pi). Describe your goal, approve the plan, and let the orchestration layer track progress through milestones, features, and validation — with a real-time Mission Control overlay.

Inspired by [Factory.ai Missions](https://factory.ai/news/missions).

---

## Install

From npm:

```bash
pi install npm:pi-missions
```

From GitHub:

```bash
pi install git:github.com/itisbryan/pi-missions
```

From a local checkout:

```bash
pi install /path/to/pi-missions
```

If pi is already running, use `/reload` to pick up the new extension.

Requires Pi v0.64.0+.

## Usage

```
/mission Build a user authentication system
```

Pi opens a **planning questionnaire** — choose your mode, autonomy level, and optionally assign different models to different phases — then kicks off the mission. Right after mission creation, pi can prompt you to open **Mission Control** immediately.

### Commands

| Command | Description |
|---------|-------------|
| `/mission <description>` | Start a new mission (interactive planner) |
| `/mission` | Quick-check current mission status |
| `/mission-status` | Detailed status with phase durations |
| `/mission-skip` | Skip the current phase |
| `/mission-done` | Mark the entire mission as complete |
| `/mission-pause` | Toggle pause/resume |
| `/mission-next` | Manually advance to the next phase |
| `/mission-resume` | Resume with a mission handoff after pause or compaction |
| `/mission-reset` | Clear mission state and widget |

### Keyboard shortcut

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+M` | Open Mission Control overlay |

## Mission Control

A dashboard overlay with inline actions — no need to type commands:

```
┌─ Current Feature ──────────────────┐ ┌─ Features ──────── 12/15 ─┐
│ cart-api                            │ │ ● cart-api                 │
│ skill: backend-worker               │ │ ✓ user-auth                │
│ milestone: checkout                 │ │ ✓ product-catalog          │
│                                     │ │ ○ payment-integration      │
│ preconditions                       │ ├─ Progress Log ────────────┤
│  • Auth service running             │ │ <1m  ● Feature started     │
│ expected behavior                   │ │ 5m   ✓ user-auth done      │
│  • Returns 200 with cart items      │ │ 23m  ⏸ Mission paused      │
└─────────────────────────────────────┘ └────────────────────────────┘
P: Pause  S: Skip  D: Done  R: Redirect  M: Models  V: Validate  Esc: Close
```

| Key | Action |
|-----|--------|
| `P` | Pause / Resume |
| `S` | Skip current phase |
| `D` | Mark mission done |
| `R` | Redirect — type a new instruction for the agent |
| `M` | Edit per-phase model assignment |
| `V` | Reserved for future validation actions |

## Modes

Choose your mode when starting a mission:

| Mode | Structure | Best for |
|------|-----------|----------|
| **Standard** | 6 phases: Architect → Review → Implement → Test → Audit → Verify | Most development tasks |
| **Minimal** | 3 phases: Plan → Build → Verify | Quick fixes and small changes |

### Standard / Minimal — phase widget

```
🎯 Build user authentication
████▓░░░ 📐 Phase 2/6: Review Plan (1/6 done)
```

### Paused

```
⏸ PAUSED (3m) — Build user authentication
████▓░░░ Phase 2/6: Review Plan
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  pi session (cwd: /my-project)                              │
│                                                             │
│  /mission Build a CRM                                       │
│     │                                                       │
│     ├─► Planning questionnaire                              │
│     │     Mode? Standard / Minimal                          │
│     │     Autonomy? Low / Medium / High                     │
│     │     Models? (optional per-phase assignment)           │
│     │                                                       │
│     ├─► Optional "Open Mission Control now?" prompt         │
│     │                                                       │
│     ├─► Mission protocol injected into system prompt        │
│     │   on every turn (before_agent_start)                  │
│     │                                                       │
│     ├─► LLM output scanned after each turn                  │
│     │   (message_end) for:                                  │
│     │     Phase transitions ("Phase 1 complete")            │
│     │     Spec approval ("Plan approved")                   │
│     │                                                       │
│     ├─► State persists in session entries                   │
│     │   (survives /compact and session restarts)            │
│     │                                                       │
│     └─► Widget + Mission Control show live progress         │
└─────────────────────────────────────────────────────────────┘
```

### What gets injected into the system prompt

On every turn, the extension appends:

- **Mission protocol** — instructions for the current phase (planning, execution, audit, verify)
- **Current status** — mission description, phase position, and progress counts
- **Autonomy guidance** — when to pause based on Low/Medium/High setting
- **Pause notice** — if paused, tells the agent to wait for direction

### Per-phase model assignment (optional)

Assign different models to different roles during the planner:

```
🧠 Planning & Architecture  →  claude-opus-4-6
🔨 Implementation           →  claude-sonnet-4
🔍 Code Review / Audit      →  claude-opus-4-6
✅ Validation               →  claude-opus-4-6
```

Models switch automatically when phases transition. Uses your actual `modelRegistry` — no hardcoded list.

### Autonomy levels

| Level | Behavior |
|-------|----------|
| **Low** | Pause after every phase, wait for review |
| **Medium** | Pause at phase boundaries and decision points (default) |
| **High** | Run to completion, only pause on critical failure |

### State persistence

Mission state is stored via `pi.appendEntry()` — custom entries survive `/compact` and session restarts. When you resume a session, the widget and session name are automatically restored.

`/mission-reset` appends a null marker that tells the restore logic to stay cleared — the old state won't reappear.

## Architecture

```
extensions/
├── index.ts             # Thin orchestrator (~290 lines)
├── types.ts             # MissionState, phases, plan artifacts, progress events
├── config.ts            # Mission templates (standard / minimal)
├── state.ts             # Persistence + TypeBox runtime validation
├── widget.ts            # Progress widget (phase bar / pause / completion)
├── mission-control.ts   # Mission Control overlay (P/S/D/R/M/V)
├── progress-log.ts      # Event timeline with relative timestamps
├── detector.ts          # Phase transition detection
├── protocol.ts          # System prompt generation (planning, audit, verify)
├── planner.ts           # Interactive planning questionnaire
├── commands.ts          # 8 commands + Ctrl+Shift+M shortcut
└── utils.ts             # Shared helpers
```

## Development

```bash
# Install dependencies
npm install

# Type check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test

# Test in watch mode
npm run test:watch

# Test locally without installing
pi -e /path/to/pi-missions/extensions/index.ts
```

### Tests

The test suite covers core logic that doesn't depend on the pi runtime:

```
tests/
├── state.test.ts     — state persistence, advancePhase, advanceFeature, addProgressEvent
├── detector.test.ts  — phase/feature/milestone/assertion detection patterns
└── utils.test.ts     — formatDuration, icons, extractText, truncate, generateId
```

## Inspired By

- [Factory.ai Missions](https://factory.ai/news/missions) — multi-agent orchestration with milestones, features, and validation
- Factory's orchestrator/worker architecture, validation contracts, and skill-aware execution patterns

## License

MIT
