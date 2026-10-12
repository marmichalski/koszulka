import * as github from "@actions/github";
import { inputs } from "./inputs";

const octokit = github.getOctokit(inputs.token);

// Hidden marker to find the comment of this action in later runs.
const marker = `<!-- koszulka:${inputs.name} -->`;

type Comment = Awaited<
  ReturnType<typeof octokit.rest.issues.listComments>
>["data"][number];

const findComment = async (
  issueNumber: number,
): Promise<Comment | undefined> => {
  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    ...github.context.repo,
    issue_number: issueNumber,
    per_page: 100,
  });

  return comments.find((comment) => comment.body?.includes(marker));
};

export const comment = async (isLastSize: boolean): Promise<void> => {
  if (!github.context.payload.pull_request?.number) {
    throw Error("Pull request not found in github context!");
  }

  if (!inputs.commentOnLastSize) {
    return;
  }

  const issueNumber = github.context.payload.pull_request.number;
  const existing = await findComment(issueNumber);

  if (!isLastSize || inputs.commentContentOnLastSize.trim() === "") {
    if (existing) {
      await octokit.rest.issues.deleteComment({
        ...github.context.repo,
        comment_id: existing.id,
      });
    }

    return;
  }

  const body = `${marker}\n${inputs.commentContentOnLastSize}`;

  if (existing) {
    if (existing.body !== body) {
      await octokit.rest.issues.updateComment({
        ...github.context.repo,
        comment_id: existing.id,
        body,
      });
    }

    return;
  }

  await octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: issueNumber,
    body,
  });
};
