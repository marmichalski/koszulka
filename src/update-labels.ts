import * as github from "@actions/github";
import { inputs } from "./inputs";
import { Diff } from "./diff";

const octokit = github.getOctokit(inputs.token);

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

  let newSizeLabel = inputs.labels[0];
  for (const [idx, size] of inputs.labelsSizes.entries()) {
    newSizeLabel = inputs.labels[idx];

    if (diff.total() <= size) {
      break;
    }

    newSizeLabel = inputs.labels[idx + 1];
  }

  if (currentSizeLabels.length === 1 && currentSizeLabels[0] === newSizeLabel) {
    return newSizeLabel;
  }

  octokit.rest.issues.setLabels({
    ...github.context.repo,
    issue_number: github.context.payload.pull_request.number,
    labels: currentLabels
      .filter((label) => !inputs.labels.includes(label))
      .concat(newSizeLabel),
  });

  return newSizeLabel;
};
