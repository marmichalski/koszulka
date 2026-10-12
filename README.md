<h1 align="center">👕 Koszulka 👕</h1>

<p align="center">A GitHub Action that gives a t-shirt size label to a pull request, based on the number of changed lines.</p>

## Usage

```yaml
name: PR size

on:
  pull_request:

permissions:
  pull-requests: write

jobs:
  size:
    runs-on: ubuntu-latest
    steps:
      - uses: marmichalski/koszulka@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

The action reads the pull request from the GitHub API, so the job does not need `actions/checkout`.

The job needs `pull-requests: write` to set labels and write comments.

With the default inputs, the action gives these labels:

| Label     | Changed lines  |
| --------- | -------------- |
| `size/xs` | 0–10           |
| `size/s`  | 11–100         |
| `size/m`  | 101–500        |
| `size/l`  | 501–1000       |
| `size/xl` | more than 1000 |

The number of changed lines is the sum of additions and deletions.

On each run, the action removes the size labels that do not apply and keeps all other labels. If a label does not exist in the repository, GitHub creates it with a default color.

## Inputs

| Input                      | Default                     | Description                                                                                                                 |
| -------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `token`                    | (required)                  | The GitHub token for the API calls.                                                                                         |
| `labels`                   | `size/xs` … `size/xl`       | A multi-line list of labels, from the smallest to the biggest.                                                              |
| `labelsSizes`              | `10`, `100`, `500`, `1000`  | A multi-line list of the maximum changed lines for each label. It must have one value less than `labels`.                   |
| `ignoreFiles`              | (empty)                     | A multi-line list of [minimatch](https://github.com/isaacs/minimatch) patterns. The action does not count files that match. |
| `ignoreFileRemovals`       | `false`                     | When `true`, the action does not count files that the pull request removes.                                                 |
| `ignoreLineDeletions`      | `false`                     | When `true`, the action counts only added lines.                                                                            |
| `commentOnLastSize`        | `false`                     | When `true`, the action writes a comment when the pull request gets the last label.                                         |
| `commentContentOnLastSize` | "This PR is quite large. …" | The text of the comment.                                                                                                    |
| `failOnLastSize`           | `false`                     | When `true`, the job fails when the pull request gets the last label.                                                       |

The action checks the inputs before it starts. If an input is not correct, the job fails and shows all the problems.

### Ignore files

The patterns match the full file path from the root of the repository. To match a file in all folders, start the pattern with `**/`:

```yaml
- uses: marmichalski/koszulka@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    ignoreFiles: |
      dist/**
      **/*.lock
      **/package-lock.json
```

The patterns also match files and folders that start with a dot, for example `.github/workflows/ci.yml`.

## Comment

When `commentOnLastSize` is `true` and the pull request gets the last label, the action writes one comment. On later runs, the action does not write a new comment:

- If the text changes, the action updates the comment.
- If the pull request gets smaller, the action deletes the comment.

The action finds its comment with a hidden `<!-- koszulka -->` marker in the comment text.

## Outputs

| Output       | Description                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `label`      | The size label that the action gave to the pull request.                                             |
| `additions`  | The number of added lines that the action counted.                                                   |
| `deletions`  | The number of deleted lines that the action counted. It is `0` when `ignoreLineDeletions` is `true`. |
| `total`      | The number of changed lines that the action used to select the label.                                |
| `isLastSize` | `"true"` when the pull request has the last label, and `"false"` if not.                             |

The action sets the outputs before it fails the job with `failOnLastSize`. Use `if: always()` to read them in a later step:

```yaml
- uses: marmichalski/koszulka@v1
  id: size
  with:
    token: ${{ secrets.GITHUB_TOKEN }}

- if: always() && steps.size.outputs.isLastSize == 'true'
  run: echo "This PR has ${{ steps.size.outputs.total }} changed lines."
```

## Limits

- **Pull requests from forks.** On the `pull_request` event, GitHub gives a read-only token to pull requests from forks. Then the action cannot set labels or write comments, and the job fails.
- **Large pull requests.** When `ignoreFiles` or `ignoreFileRemovals` is set, the action reads the list of files from the GitHub API. The API gives a maximum of 3000 files, so the action does not count files after the first 3000.

## Development

The action runs on Node 24. The repository keeps the bundled code in `dist/`, so you must build it after each change in `src/`.

```bash
npm ci
npm run lint
npm test
npm run bundle
```

CI fails when `dist/` is not the same as the result of `npm run bundle`.

## License

[MIT](LICENSE)
