import * as github from "@actions/github";
import { inputs } from "./inputs";

const octokit = github.getOctokit(inputs.token);

export const comment = async (): Promise<void> => {
  if (!github.context.payload.pull_request?.number) {
    throw Error("Pull request not found in github context!");
  }

  if (!inputs.commentOnLastSize) {
    return;
  }

  if (inputs.commentContentOnLastSize.trim() === "") {
    return;
  }

  octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: github.context.payload.pull_request.number,
    body: inputs.commentContentOnLastSize,
  });
};
