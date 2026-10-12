import * as core from "@actions/core";

const labelsSizesRaw = core.getMultilineInput("labelsSizes");

export const inputs = {
  token: core.getInput("token", { required: true }),
  name: core.getInput("name"),
  ignoreLineDeletions: core.getBooleanInput("ignoreLineDeletions"),
  ignoreFileRemovals: core.getBooleanInput("ignoreFileRemovals"),
  ignoreFiles: new Set(core.getMultilineInput("ignoreFiles")),
  labels: core.getMultilineInput("labels"),
  labelsSizes: labelsSizesRaw
    .map((size) => Number(size).valueOf())
    .sort((a, b) => a - b),
  commentOnLastSize: core.getBooleanInput("commentOnLastSize"),
  commentContentOnLastSize: core.getInput("commentContentOnLastSize"),
  failOnLastSize: core.getBooleanInput("failOnLastSize"),
} as const;

const duplicates = <T>(values: T[]): T[] => [
  ...new Set(values.filter((value, idx) => values.indexOf(value) !== idx)),
];

export const validateInputs = (): void => {
  const errors: string[] = [];

  if (inputs.labels.length === 0) {
    errors.push("labels must contain at least one label.");
  }

  const duplicatedLabels = duplicates(inputs.labels);
  if (duplicatedLabels.length > 0) {
    errors.push(`labels contain duplicates: ${duplicatedLabels.join(", ")}.`);
  }

  const invalidSizes = labelsSizesRaw.filter((size) => !/^\d+$/.test(size));
  if (invalidSizes.length > 0) {
    errors.push(
      `labelsSizes must contain only non-negative integers, got: ${invalidSizes.join(", ")}.`,
    );
  }

  const duplicatedSizes = duplicates(
    inputs.labelsSizes.filter((size) => Number.isInteger(size)),
  );
  if (duplicatedSizes.length > 0) {
    errors.push(
      `labelsSizes contain duplicates: ${duplicatedSizes.join(", ")}.`,
    );
  }

  if (
    inputs.labels.length > 0 &&
    inputs.labelsSizes.length !== inputs.labels.length - 1
  ) {
    errors.push(
      `labelsSizes must contain one value less than labels, got ${inputs.labelsSizes.length} sizes for ${inputs.labels.length} labels.`,
    );
  }

  if (errors.length > 0) {
    throw Error(`Invalid inputs:\n- ${errors.join("\n- ")}`);
  }
};
