import * as core from "@actions/core";

export const inputs = {
  token: core.getInput("token", { required: true }),
  name: core.getInput("name"),
  ignoreLineDeletions: core.getBooleanInput("ignoreLineDeletions"),
  ignoreFileRemovals: core.getBooleanInput("ignoreFileRemovals"),
  ignoreFiles: new Set(core.getMultilineInput("ignoreFiles")),
  labels: core.getMultilineInput("labels"),
  labelsSizes: core
    .getMultilineInput("labelsSizes")
    .map((size) => Number(size).valueOf())
    .sort((a, b) => a - b),
  commentOnLastSize: core.getBooleanInput("commentOnLastSize"),
  commentContentOnLastSize: core.getInput("commentContentOnLastSize"),
  failOnLastSize: core.getBooleanInput("failOnLastSize"),
} as const;
