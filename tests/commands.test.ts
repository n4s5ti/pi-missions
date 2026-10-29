import { beforeEach, describe, expect, it, vi } from "vitest";

const showMissionControl = vi.fn();

vi.mock("../extensions/planner.ts", () => ({
  runMissionPlanner: vi.fn(),
}));

vi.mock("../extensions/state.ts", () => ({
  saveMissionState: vi.fn(),
  addProgressEvent: vi.fn(),
}));

vi.mock("../extensions/widget.ts", () => ({
  updateWidget: vi.fn(),
  buildThemedProgressBar: vi.fn(() => ({ themed: "", percentage: 0 })),
}));

vi.mock("../extensions/mission-control.ts", () => ({
  showMissionControl,
}));

import { registerMissionCommands } from "../extensions/commands.ts";
import { runMissionPlanner } from "../extensions/planner.ts";
import type { MissionState } from "../extensions/types.ts";

function makeState(): MissionState {
  return {
    description: "Test mission",
    mode: "simple",
    templateKey: "standard",
    currentPhase: "Architect",
    phases: [
      {
        name: "Architect",
        emoji: "📐",
        status: "active",
        startedAt: new Date().toISOString(),
      },
      { name: "Review Plan", emoji: "👁️", status: "pending" },
    ],
    autonomy: "medium",
    modelAssignment: {},
    paused: false,
    pauseHistory: [],
    progressLog: [],
    startedAt: new Date().toISOString(),
  };
}

function setup(confirmResult: boolean) {
  const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
  let state: MissionState | null = null;

  const pi = {
    registerCommand: vi.fn((name: string, spec: { handler: (args: string, ctx: any) => Promise<void> }) => {
      commands.set(name, spec);
    }),
    registerShortcut: vi.fn(),
    sendUserMessage: vi.fn(),
    setSessionName: vi.fn(),
    appendEntry: vi.fn(),
  } as any;

  const ctx = {
    ui: {
      notify: vi.fn(),
      confirm: vi.fn().mockResolvedValue(confirmResult),
      setWidget: vi.fn(),
    },
    modelRegistry: {
      getAll: vi.fn(() => []),
    },
  } as any;

  registerMissionCommands(pi, () => state, (next) => {
    state = next;
  });

  return { commands, ctx, pi };
}

describe("/mission startup UX", () => {
  beforeEach(() => {
    showMissionControl.mockReset();
    showMissionControl.mockResolvedValue({ action: "close" });
    vi.mocked(runMissionPlanner).mockReset();
    vi.mocked(runMissionPlanner).mockResolvedValue(makeState());
  });

  it("prompts to open Mission Control after mission creation", async () => {
    const { commands, ctx, pi } = setup(true);
    await Promise.resolve();

    const mission = commands.get("mission");
    expect(mission).toBeDefined();

    await mission!.handler("Build auth", ctx);

    expect(ctx.ui.confirm).toHaveBeenCalledWith("Mission Control", "Open Mission Control now?");
    expect(pi.sendUserMessage).toHaveBeenCalledTimes(1);
  });

  it("does not open Mission Control when the user declines", async () => {
    const { commands, ctx } = setup(false);
    await Promise.resolve();

    const mission = commands.get("mission");
    expect(mission).toBeDefined();

    await mission!.handler("Build auth", ctx);

    expect(ctx.ui.confirm).toHaveBeenCalledWith("Mission Control", "Open Mission Control now?");
    expect(showMissionControl).not.toHaveBeenCalled();
  });
});
