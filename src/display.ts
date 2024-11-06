import { Diff } from "./diff";
import { inputs } from "./inputs";

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  white: "\x1b[97m",
} as const;

export const Display = {
  inputs: () => {
    console.info("Configuration:");
    console.info(`Ignore line deletions: ${inputs.ignoreLineDeletions}`);
    console.info(`Ignore file removals: ${inputs.ignoreFileRemovals}`);
    console.info(`Ignore files: ${[...inputs.ignoreFiles].join(", ")}`);
    console.info(`Comment on last size: ${inputs.commentOnLastSize}`);
    console.info(`Fail on last size: ${inputs.failOnLastSize}`);
    console.info(`Labels: ${inputs.labels.join(", ")}`);
    console.info(`Labels thresholds: ${inputs.labelsSizes.join(", ")}`);
  },

  diffSummary: (diff: Diff) => {
    console.info("");
    console.info(
      `➕ ${colors.green}Additions: ${diff.additions}${colors.reset}`,
    );
    console.info(`➖ ${colors.red}Deletions: ${diff.deletions}${colors.reset}`);
    console.info(`🟰 ${colors.white}Total: ${diff.total()}${colors.reset}`);
  },

  assignedLabel: (label: string) => {
    console.info("");
    console.info(`👉 ${colors.green}Assigned label: ${label}${colors.reset}`);
  },
};
