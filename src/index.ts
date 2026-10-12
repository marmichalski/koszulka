import * as core from "@actions/core";
import { calculateDiff } from "./calculate-diff";
import { Display } from "./display";
import { updateLabels } from "./update-labels";
import { inputs, validateInputs } from "./inputs";
import { comment } from "./commenter";

const run = async (): Promise<void> => {
  try {
    Display.inputs();
    validateInputs();

    const diff = await calculateDiff();
    Display.diffSummary(diff);

    const assignedLabel = await updateLabels(diff);
    Display.assignedLabel(assignedLabel);

    const isLastSize = inputs.labels.slice(-1).includes(assignedLabel);

    await comment(isLastSize);

    if (isLastSize && inputs.failOnLastSize) {
      core.setFailed("Failed job due to PR size being too big.");
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error);

      return;
    } else {
      throw error;
    }
  }
};

run();
