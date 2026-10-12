import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileChange, calculateDiff, sumFiles } from "./calculate-diff.js";

const { octokit, inputs } = vi.hoisted(() => ({
  octokit: {
    paginate: { iterator: vi.fn() },
    rest: { pulls: { get: vi.fn(), listFiles: vi.fn() } },
  },
  inputs: {
    token: "token",
    ignoreFiles: new Set<string>(),
    ignoreFileRemovals: false,
    ignoreLineDeletions: false,
  },
}));

vi.mock("@actions/github", () => ({
  getOctokit: () => octokit,
  context: {
    repo: { owner: "owner", repo: "repo" },
    payload: { pull_request: { number: 7 } },
  },
}));

vi.mock("./inputs.js", () => ({ inputs }));

const file = (
  filename: string,
  additions: number,
  deletions: number,
  status = "modified",
): FileChange => ({ filename, status, additions, deletions });

const noOptions = {
  ignoreFiles: new Set<string>(),
  ignoreFileRemovals: false,
  ignoreLineDeletions: false,
};

describe("sumFiles", () => {
  it("adds the changes of all files", () => {
    const diff = sumFiles([file("a.ts", 10, 2), file("b.ts", 5, 3)], noOptions);

    expect(diff.additions).toBe(15);
    expect(diff.deletions).toBe(5);
    expect(diff.total()).toBe(20);
  });

  it("gives zero for no files", () => {
    expect(sumFiles([], noOptions).total()).toBe(0);
  });

  it("ignores files that match a pattern", () => {
    const diff = sumFiles(
      [
        file("src/a.ts", 10, 2),
        file("package-lock.json", 500, 400),
        file("dist/index.js", 300, 200),
      ],
      { ...noOptions, ignoreFiles: new Set(["package-lock.json", "dist/**"]) },
    );

    expect(diff.additions).toBe(10);
    expect(diff.deletions).toBe(2);
  });

  it("ignores files in dot folders that match a pattern", () => {
    const diff = sumFiles(
      [
        file("src/a.ts", 10, 2),
        file(".yarn/cache/x.lock", 500, 400),
        file(".github/workflows/ci.yml", 5, 1),
      ],
      { ...noOptions, ignoreFiles: new Set(["**/*.lock", "**/*.yml"]) },
    );

    expect(diff.total()).toBe(12);
  });

  it("ignores removed files when ignoreFileRemovals is set", () => {
    const files = [file("a.ts", 10, 2), file("old.ts", 0, 300, "removed")];

    expect(sumFiles(files, noOptions).total()).toBe(312);
    expect(
      sumFiles(files, { ...noOptions, ignoreFileRemovals: true }).total(),
    ).toBe(12);
  });

  it("ignores deleted lines when ignoreLineDeletions is set", () => {
    const diff = sumFiles([file("a.ts", 10, 2), file("b.ts", 5, 3)], {
      ...noOptions,
      ignoreLineDeletions: true,
    });

    expect(diff.additions).toBe(15);
    expect(diff.deletions).toBe(0);
    expect(diff.total()).toBe(15);
  });
});

describe("calculateDiff", () => {
  const files = [file("a.ts", 10, 2), file("old.ts", 0, 300, "removed")];

  beforeEach(() => {
    vi.resetAllMocks();
    inputs.ignoreFiles = new Set();
    inputs.ignoreFileRemovals = false;
    inputs.ignoreLineDeletions = false;
    octokit.rest.pulls.get.mockResolvedValue({
      data: { additions: 10, deletions: 302 },
    });
    octokit.paginate.iterator.mockReturnValue([{ data: files }]);
  });

  it("uses the pull request totals when no file filter is set", async () => {
    const diff = await calculateDiff();

    expect(diff.total()).toBe(312);
    expect(octokit.paginate.iterator).not.toHaveBeenCalled();
  });

  it("ignores deleted lines in the pull request totals", async () => {
    inputs.ignoreLineDeletions = true;

    const diff = await calculateDiff();

    expect(diff.total()).toBe(10);
    expect(octokit.paginate.iterator).not.toHaveBeenCalled();
  });

  it("reads the files when ignoreFileRemovals is set", async () => {
    inputs.ignoreFileRemovals = true;

    const diff = await calculateDiff();

    expect(diff.total()).toBe(12);
    expect(octokit.rest.pulls.get).not.toHaveBeenCalled();
  });

  it("reads the files when ignoreFiles is set", async () => {
    inputs.ignoreFiles = new Set(["old.ts"]);

    const diff = await calculateDiff();

    expect(diff.total()).toBe(12);
    expect(octokit.rest.pulls.get).not.toHaveBeenCalled();
  });
});
