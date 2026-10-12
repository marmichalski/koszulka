import { describe, expect, it } from "vitest";
import { pickLabel } from "./update-labels.js";

const labels = ["size/xs", "size/s", "size/m", "size/l", "size/xl"];
const sizes = [10, 100, 500, 1000];

describe("pickLabel", () => {
  it.each([
    [0, "size/xs"],
    [10, "size/xs"],
    [11, "size/s"],
    [100, "size/s"],
    [101, "size/m"],
    [500, "size/m"],
    [501, "size/l"],
    [1000, "size/l"],
    [1001, "size/xl"],
    [100000, "size/xl"],
  ])("gives %i changes the label %s", (total, label) => {
    expect(pickLabel(total, labels, sizes)).toBe(label);
  });

  it("gives the only label when there are no sizes", () => {
    expect(pickLabel(5000, ["size/any"], [])).toBe("size/any");
  });
});
