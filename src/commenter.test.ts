import { beforeEach, describe, expect, it, vi } from "vitest";
import { comment } from "./commenter.js";

const { octokit, inputs } = vi.hoisted(() => ({
  octokit: {
    paginate: vi.fn(),
    rest: {
      issues: {
        listComments: vi.fn(),
        createComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      },
    },
  },
  inputs: {
    token: "token",
    name: "koszulka",
    commentOnLastSize: true,
    commentContentOnLastSize: "This PR is quite large.",
  },
}));

vi.mock("@actions/github", () => ({
  getOctokit: () => octokit,
  context: {
    repo: { owner: "owner", repo: "repo" },
    payload: { pull_request: { number: 7 } },
  },
}));

vi.mock("./inputs.js", () => ({ inputs }));

const marker = "<!-- koszulka:koszulka -->";
const body = `${marker}\nThis PR is quite large.`;
const repo = { owner: "owner", repo: "repo" };

describe("comment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    inputs.commentOnLastSize = true;
    inputs.commentContentOnLastSize = "This PR is quite large.";
    octokit.paginate.mockResolvedValue([]);
  });

  it("creates the comment when the PR is the last size", async () => {
    await comment(true);

    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
      ...repo,
      issue_number: 7,
      body,
    });
  });

  it("does not change a comment that is the same", async () => {
    octokit.paginate.mockResolvedValue([{ id: 1, body }]);

    await comment(true);

    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
    expect(octokit.rest.issues.updateComment).not.toHaveBeenCalled();
    expect(octokit.rest.issues.deleteComment).not.toHaveBeenCalled();
  });

  it("updates a comment that has a different content", async () => {
    octokit.paginate.mockResolvedValue([
      { id: 1, body: "Unrelated comment." },
      { id: 2, body: `${marker}\nOld content.` },
    ]);

    await comment(true);

    expect(octokit.rest.issues.updateComment).toHaveBeenCalledWith({
      ...repo,
      comment_id: 2,
      body,
    });
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("does not use the comment of an action with a different name", async () => {
    octokit.paginate.mockResolvedValue([
      { id: 1, body: "<!-- koszulka:other -->\nThis PR is quite large." },
    ]);

    await comment(true);

    expect(octokit.rest.issues.createComment).toHaveBeenCalledOnce();
    expect(octokit.rest.issues.updateComment).not.toHaveBeenCalled();
  });

  it("deletes the comment when the PR is no longer the last size", async () => {
    octokit.paginate.mockResolvedValue([{ id: 1, body }]);

    await comment(false);

    expect(octokit.rest.issues.deleteComment).toHaveBeenCalledWith({
      ...repo,
      comment_id: 1,
    });
  });

  it("does nothing when the PR is not the last size and has no comment", async () => {
    await comment(false);

    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
    expect(octokit.rest.issues.deleteComment).not.toHaveBeenCalled();
  });

  it("deletes the comment when the content is empty", async () => {
    inputs.commentContentOnLastSize = "  ";
    octokit.paginate.mockResolvedValue([{ id: 1, body }]);

    await comment(true);

    expect(octokit.rest.issues.deleteComment).toHaveBeenCalledOnce();
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it("does not read comments when commenting is disabled", async () => {
    inputs.commentOnLastSize = false;

    await comment(true);

    expect(octokit.paginate).not.toHaveBeenCalled();
  });
});
