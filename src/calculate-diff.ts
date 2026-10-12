import * as github from "@actions/github";
import { inputs } from "./inputs";
import { minimatch } from "minimatch";
import { Diff } from "./diff";

const octokit = github.getOctokit(inputs.token);

export interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
}

export const sumFiles = (
  files: FileChange[],
  ignoreFiles: Set<string>,
): Diff => {
  let additions = 0;
  let deletions = 0;

  for (const file of files) {
    if ([...ignoreFiles].some((ignored) => minimatch(file.filename, ignored))) {
      continue;
    }

    additions += file.additions;
    deletions += file.deletions;
  }

  return new Diff(additions, deletions);
};

export const calculateDiff = async (): Promise<Diff> => {
  if (!github.context.payload.pull_request?.number) {
    throw Error("Pull request not found in github context!");
  }

  if (inputs.ignoreFiles.size === 0 && inputs.ignoreFileRemovals) {
    const { data } = await octokit.rest.pulls.get({
      ...github.context.repo,
      pull_number: github.context.payload.pull_request.number,
    });

    return new Diff(data.additions, data.deletions);
  }

  const iterator = octokit.paginate.iterator(octokit.rest.pulls.listFiles, {
    ...github.context.repo,
    pull_number: github.context.payload.pull_request.number,
    per_page: 100,
  });

  const files: FileChange[] = [];
  for await (const { data } of iterator) {
    files.push(...data);
  }

  return sumFiles(files, inputs.ignoreFiles);
};
