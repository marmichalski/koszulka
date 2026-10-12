import * as core from "@actions/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Diff } from "./diff.js";
import { run } from "./main.js";
import { calculateDiff } from "./calculate-diff.js";
import { updateLabels } from "./update-labels.js";
import { comment } from "./commenter.js";

vi.mock("@actions/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@actions/core")>()),
  setOutput: vi.fn(),
  setFailed: vi.fn(),
}));
vi.mock("./calculate-diff.js", () => ({ calculateDiff: vi.fn() }));
vi.mock("./update-labels.js", () => ({ updateLabels: vi.fn() }));
vi.mock("./commenter.js", () => ({ comment: vi.fn() }));
vi.mock("./display.js", () => ({
  Display: { inputs: vi.fn(), diffSummary: vi.fn(), assignedLabel: vi.fn() },
}));

describe("run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(calculateDiff).mockResolvedValue(new Diff(40, 2));
    vi.mocked(updateLabels).mockResolvedValue("size/s");
  });

  it("sets the outputs", async () => {
    await run();

    expect(core.setOutput).toHaveBeenCalledWith("label", "size/s");
    expect(core.setOutput).toHaveBeenCalledWith("additions", 40);
    expect(core.setOutput).toHaveBeenCalledWith("deletions", 2);
    expect(core.setOutput).toHaveBeenCalledWith("total", 42);
    expect(core.setOutput).toHaveBeenCalledWith("isLastSize", false);
    expect(comment).toHaveBeenCalledWith(false);
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it("sets isLastSize when the pull request is the biggest size", async () => {
    vi.mocked(calculateDiff).mockResolvedValue(new Diff(2000, 0));
    vi.mocked(updateLabels).mockResolvedValue("size/xl");

    await run();

    expect(core.setOutput).toHaveBeenCalledWith("isLastSize", true);
    expect(comment).toHaveBeenCalledWith(true);
  });

  it("sets the outputs before the comment step", async () => {
    vi.mocked(comment).mockRejectedValue(new Error("API error"));

    await run();

    expect(core.setOutput).toHaveBeenCalledWith("label", "size/s");
    expect(core.setFailed).toHaveBeenCalledWith(new Error("API error"));
  });
});
