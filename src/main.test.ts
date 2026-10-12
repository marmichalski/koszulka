import * as core from "@actions/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Diff } from "./diff";
import { run } from "./main";
import { calculateDiff } from "./calculate-diff";
import { updateLabels } from "./update-labels";
import { comment } from "./commenter";

vi.mock("@actions/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@actions/core")>()),
  setOutput: vi.fn(),
  setFailed: vi.fn(),
}));
vi.mock("./calculate-diff", () => ({ calculateDiff: vi.fn() }));
vi.mock("./update-labels", () => ({ updateLabels: vi.fn() }));
vi.mock("./commenter", () => ({ comment: vi.fn() }));
vi.mock("./display", () => ({
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
