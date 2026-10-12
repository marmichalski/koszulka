import { describe, expect, it } from "vitest";
import { FileChange, sumFiles } from "./calculate-diff";

const file = (
  filename: string,
  additions: number,
  deletions: number,
  status = "modified",
): FileChange => ({ filename, status, additions, deletions });

describe("sumFiles", () => {
  it("adds the changes of all files", () => {
    const diff = sumFiles([file("a.ts", 10, 2), file("b.ts", 5, 3)], new Set());

    expect(diff.additions).toBe(15);
    expect(diff.deletions).toBe(5);
    expect(diff.total()).toBe(20);
  });

  it("gives zero for no files", () => {
    expect(sumFiles([], new Set()).total()).toBe(0);
  });

  it("ignores files that match a pattern", () => {
    const diff = sumFiles(
      [
        file("src/a.ts", 10, 2),
        file("package-lock.json", 500, 400),
        file("dist/index.js", 300, 200),
      ],
      new Set(["package-lock.json", "dist/**"]),
    );

    expect(diff.additions).toBe(10);
    expect(diff.deletions).toBe(2);
  });
});
