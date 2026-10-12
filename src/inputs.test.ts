import * as core from "@actions/core";
import { describe, expect, it, vi } from "vitest";

const loadInputs = async (
  labels: string,
  labelsSizes: string,
): Promise<typeof import("./inputs")> => {
  vi.stubEnv("INPUT_LABELS", labels);
  vi.stubEnv("INPUT_LABELSSIZES", labelsSizes);
  vi.resetModules();

  return vi.importActual("./inputs");
};

describe("validateInputs", () => {
  it("accepts the default inputs", async () => {
    const { validateInputs } = await loadInputs(
      "xs\ns\nm\nl\nxl",
      "10\n100\n500\n1000",
    );

    expect(() => validateInputs()).not.toThrow();
  });

  it("accepts one label with no sizes", async () => {
    const { validateInputs } = await loadInputs("any", "");

    expect(() => validateInputs()).not.toThrow();
  });

  it("sorts the sizes", async () => {
    const { inputs } = await loadInputs("xs\ns\nm", "100\n10");

    expect(inputs.labelsSizes).toEqual([10, 100]);
  });

  it("rejects no labels", async () => {
    const { validateInputs } = await loadInputs("", "");

    expect(() => validateInputs()).toThrow(
      "labels must contain at least one label.",
    );
  });

  it("rejects duplicated labels", async () => {
    const { validateInputs } = await loadInputs("xs\ns\ns", "10\n100");

    expect(() => validateInputs()).toThrow("labels contain duplicates: s.");
  });

  it("rejects sizes that are not non-negative integers", async () => {
    const { validateInputs } = await loadInputs("a\nb\nc\nd", "abc\n1.5\n-3");

    expect(() => validateInputs()).toThrow(
      "labelsSizes must contain only non-negative integers, got: abc, 1.5, -3.",
    );
  });

  it("rejects duplicated sizes", async () => {
    const { validateInputs } = await loadInputs("xs\ns\nm", "10\n10");

    expect(() => validateInputs()).toThrow(
      "labelsSizes contain duplicates: 10.",
    );
  });

  it("rejects a wrong number of sizes", async () => {
    const { validateInputs } = await loadInputs("xs\ns", "10\n100");

    expect(() => validateInputs()).toThrow(
      "labelsSizes must contain one value less than labels, got 2 sizes for 2 labels.",
    );
  });

  it("shows all errors in one message", async () => {
    const { validateInputs } = await loadInputs("s\ns", "abc\n10\n10");

    expect(() => validateInputs()).toThrow(
      [
        "Invalid inputs:",
        "- labels contain duplicates: s.",
        "- labelsSizes must contain only non-negative integers, got: abc.",
        "- labelsSizes contain duplicates: 10.",
        "- labelsSizes must contain one value less than labels, got 3 sizes for 2 labels.",
      ].join("\n"),
    );
  });

  it("warns when comment content is empty but commenting is enabled", async () => {
    const warning = vi.spyOn(core, "warning").mockImplementation(() => {});
    vi.stubEnv("INPUT_COMMENTONLASTSIZE", "true");
    vi.stubEnv("INPUT_COMMENTCONTENTONLASTSIZE", "  ");
    const { validateInputs } = await loadInputs("xs\ns", "10");

    validateInputs();

    expect(warning).toHaveBeenCalledWith(
      "commentOnLastSize is true, but commentContentOnLastSize is empty, so no comment will be posted.",
    );
  });

  it("does not warn when commenting is disabled", async () => {
    const warning = vi.spyOn(core, "warning").mockImplementation(() => {});
    vi.stubEnv("INPUT_COMMENTCONTENTONLASTSIZE", "");
    const { validateInputs } = await loadInputs("xs\ns", "10");

    validateInputs();

    expect(warning).not.toHaveBeenCalled();
  });
});
