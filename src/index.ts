import { Command } from "command-line-application";
import endent from "endent";
import execa from "execa";
import chalk from "chalk";
import minimatch from "minimatch";
import { Octokit } from "@octokit/rest";
import * as githubActions from "@actions/github";

export const eslintChangedCommand: Command = {
  name: "eslint-changed",
  description: endent`
    Run eslint on as few files as possible. 
    
    Returns a list of files to lint based on the globs you're already using. 
    If your eslint config has changed all files will be linted.
  `,
  examples: [
    {
      desc: endent`
        Lint files that are different from the 'main' branch.
        If on main no files will be linted.\\n
      `,
      example:
        '{green.bold eslint} `eslint-changed "src/**/*.\\{js,html,css\\}"`',
    },
    {
      desc: "Lint files that are different with a different base branch\n",
      example:
        '{green.bold eslint} `eslint-changed "src/**/*.\\{js,html,css\\}" --diff HEAD..stagings`',
    },
    {
      desc: endent`
        Lint files changed in a PR on GitHub.
        If not in a PR no files are linted in CI. Locally falls back to --diff\\n
      `,
      example:
        '{green.bold eslint} `eslint-changed "src/**/*.\\{js,html,css\\}" --github`',
    },
    {
      desc: "Lint files changed in a PR on GitHub but run full lint on specific branches",
      example:
        '{green.bold eslint} `eslint-changed "src/**/*.\\{js,html,css\\}" --github main staging`',
    },
  ],
  require: ["files"],
  options: [
    {
      name: "files",
      type: String,
      defaultOption: true,
      description:
        "A glob of files to include. This argument works exactly like in eslint-cli",
    },
    {
      name: "diff",
      type: String,
      defaultValue: "HEAD..main",
      description: "Git commit range to find the different.",
    },
    {
      name: "github",
      type: String,
      multiple: true,
      description: endent`
        Only lint files changed in a PR. Optionally provide list of branches to run 
        full lint on. Run locally falls back to --diff. Intended use with github actions.
      `,
    },
  ],
};

const noFiles = ["package.json"];

interface EslintChangedOptions {
  diff: string;
  files: string;
  github?: string[];
}

export async function eslintChanged(
  options?: EslintChangedOptions
): Promise<string[]> {
  if (!options) {
    return noFiles;
  }

  const { files, diff, github } = options;

  let changedFiles: string[] = [];

  // Only interact with GitHub in CI
  if (process.env.CI && github) {
    if (!process.env.GITHUB_TOKEN) {
      console.log(
        `${chalk.red("ERROR:")} Ran ${chalk.green(
          "--github"
        )} flag without ${chalk.yellow(
          "GITHUB_TOKEN"
        )} available in environment!`
      );
      process.exit(1);
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const { owner, repo } = githubActions.context.repo;
    let { number } = githubActions.context.issue;

    if (!number && process.env.GITHUB_SHA) {
      const { data: matchedPrs } =
        await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
          owner,
          repo,
          commit_sha: process.env.GITHUB_SHA,
        });

      number = matchedPrs.filter((pr) => pr.state === "open")[0]?.number;
    }

    // Return list of files if there is a PR
    if (number) {
      const filesInPr = await octokit.paginate(octokit.pulls.listFiles, {
        owner,
        repo,
        pull_number: number,
      });

      // If eslintrc is changed run full lint
      if (filesInPr.some((file) => file.filename.includes(".eslint"))) {
        return [files];
      }

      changedFiles = filesInPr.map((file) => file.filename);
    }
    // Run full lint run on particular branches
    else if (github.length > 0) {
      const [, currentBranch] =
        githubActions.context.ref.match(/refs\/heads\/(\S+)/) || [];
      const inFullLintBranch = github.some(
        (branch) => branch === currentBranch
      );

      if (inFullLintBranch) {
        return [files];
      }
    }
  } else if (diff) {
    const { stdout } = await execa("git", ["diff", "--name-only", diff]);

    // Run full lint if config changes
    if (stdout.includes(".eslint")) {
      return [files];
    }

    changedFiles = stdout.split("\n");
  }

  const includedFiles = changedFiles.filter(
    minimatch.filter(files, { dot: true, matchBase: true })
  );

  return includedFiles.length === 0 ? noFiles : includedFiles;
}
