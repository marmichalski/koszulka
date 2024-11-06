import * as core from "@actions/core";
import { calculateDiff } from "./calculate-diff";
import { Display } from "./display";
import { updateLabels } from "./update-labels";
import { inputs } from "./inputs";
import { comment } from "./commenter";

const run = async (): Promise<void> => {
  try {
    Display.inputs();

    const diff = await calculateDiff();
    Display.diffSummary(diff);

    const assignedLabel = await updateLabels(diff);
    Display.assignedLabel(assignedLabel);

    if (inputs.labels.slice(-1).includes(assignedLabel)) {
      comment();

      if (inputs.failOnLastSize) {
        core.setFailed("Failed job due to PR size being too big.");
      }
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
