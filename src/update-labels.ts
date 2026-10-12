import * as github from "@actions/github";
import { inputs } from "./inputs";
import { Diff } from "./diff";

const octokit = github.getOctokit(inputs.token);

export const pickLabel = (
  total: number,
  labels: string[],
  sizes: number[],
): string => {
  for (const [idx, size] of sizes.entries()) {
    if (total <= size) {
      return labels[idx];
    }
  }

  return labels[sizes.length];
};

export const updateLabels = async (diff: Diff): Promise<string> => {
  if (!github.context.payload.pull_request?.number) {
    throw Error("Pull request not found in github context!");
  }

  const currentLabels = (
    await octokit.rest.issues.get({
      ...github.context.repo,
      issue_number: github.context.payload.pull_request.number,
    })
  ).data.labels
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter((label) => label !== undefined);
  const currentSizeLabels = currentLabels.filter((label) =>
    inputs.labels.includes(label),
  );

  const newSizeLabel = pickLabel(
    diff.total(),
    inputs.labels,
    inputs.labelsSizes,
  );

  if (currentSizeLabels.length === 1 && currentSizeLabels[0] === newSizeLabel) {
    return newSizeLabel;
  }

  await octokit.rest.issues.setLabels({
    ...github.context.repo,
    issue_number: github.context.payload.pull_request.number,
    labels: currentLabels
      .filter((label) => !inputs.labels.includes(label))
      .concat(newSizeLabel),
  });

  return newSizeLabel;
};
