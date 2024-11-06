import * as github from "@actions/github";
import { inputs } from "./inputs";
import { minimatch } from "minimatch";
import { Diff } from "./diff";

const octokit = github.getOctokit(inputs.token);

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

  const result = {
    additions: 0,
    deletions: 0,
  };

  for await (const { data: files } of iterator) {
    files.reduce((sum, file) => {
      for (const ignored of inputs.ignoreFiles) {
        if (minimatch(file.filename, ignored)) {
          return sum;
        }
      }

      sum.additions += file.additions;
      sum.deletions += file.deletions;

      return sum;
    }, result);
  }

  return new Diff(result.additions, result.deletions);
};
