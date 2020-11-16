# Rebase
[![CI](https://github.com/linhbn123/rebase-pull-requests/workflows/CI/badge.svg)](https://github.com/linhbn123/rebase-pull-requests/actions?query=workflow%3ACI)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Rebase%20Pull%20Requests-blue)](https://github.com/marketplace/actions/rebase-pull-requests)

A GitHub action based on [Peter Evans' Rebase Pulls](https://github.com/peter-evans/rebase) to rebase pull requests in a repository.

## Usage

You need to create an `.yml` file, say, `rebase-pull-requests.yml`, in directory `.github/workflows` to configure the action. A typical configuration should look like following:

```yml
name: Rebase Pull Requests
on:
  push:
    branches: '**'
jobs:
  rebase:
    runs-on: ubuntu-latest
    steps:
      - uses: linhbn123/rebase-pull-requests@v1.0.1
```

This configuration will trigger the action on every push to any branch. Let's say you have a pull request with source branch `feature/my-feature` and target branch `main`. If there is a new commit on `main` (e.g. another pull request is merged), then `feature/my-feature` will be rebased on it.

If you wish to trigger the action only for a specific branch, say, `main`, then you can use the following configuration:

```yml
name: Rebase Pull Requests
on:
  push:
    branches: [main]
jobs:
  rebase:
    runs-on: ubuntu-latest
    steps:
      - uses: linhbn123/rebase-pull-requests@v1.0.1
```

**Notes:**
- The operation is not cascaded. If you have a chain of pull requests, say, A <- B <- C, then a commit to A will trigger a rebase for B on A and will lead to new commits to B. These commits, however, won't trigger any rebase for C on B. See [here](https://docs.github.com/en/free-pro-team@latest/actions/reference/events-that-trigger-workflows#about-workflow-events) for details.
- To see the statuses of action runs, open Actions view in your repository. Note that a successful run doesn't mean the rebase operation itself is successful. Check the log and the pull requests to confirm.
- The statuses of rebase operations are also displayed as badges next to commits.
- If the rebase operation is unsuccessful, the action will add a comment to the pull request. You can check the list of files in conflict at the bottom of the page and handle them yourself.
- If you setup email notification properly, you should be able to see the statuses (including success and failure) of the rebase operations in your inbox.
- If your branch is rebased automatically and you have local commits, your attempt to push to the remote branch will be rejected. In that case, you can rebase your local commits on latest changes by executing `git pull --rebase`.

### Action inputs

| Name | Description | Default |
| --- | --- | --- |
| `token` | `GITHUB_TOKEN` or a `repo` scoped [PAT](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token). | `GITHUB_TOKEN` |
| `repository` | The target GitHub repository containing the pull request. | `github.repository` (Current repository) |
| `head` | Filter pull requests by head user or head organization and branch name in the format `user:ref-name` or `organization:ref-name`. For example: `github:new-script-format` or `octocat:test-branch`. | |
| `base` | Filter pull requests by base branch name. Example: `gh-pages`. | `github.ref` (Trigger branch) |

## License

[MIT](LICENSE)
