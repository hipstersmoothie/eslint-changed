import { app, Command } from "command-line-application";
import endent from "endent";

const eslintChangedCommand: Command = {
  name: "eslint-changed",
  description: endent`
    Run eslint on as few files as possible. 
    
    Returns a list of files to lint based on the globs you're already using. 
    If your eslint config has changed all files will be linted.
  `,
  examples: [
    {
      desc: "Lint files that are different from the 'main' branch. If on main no files will be linted",
      example:
        '{green.bold eslint} `eslint-changed "src/**/*.\\{js,html,css\\}"`',
    },
    {
      desc: "Lint files that are different with a different base branch",
      example:
        '{green.bold eslint} `eslint-changed "src/**/*.\\{js,html,css\\}" --diff HEAD..stagings`',
    },
    {
      desc: "Lint files files changed in a PR to GitHub. If not in a PR no files are linted.",
      example:
        '{green.bold eslint} `eslint-changed "src/**/*.\\{js,html,css\\}" --github`',
    },
    {
      desc: "Lint files files changed in a PR to GitHub but run full lint on specific branches",
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
      defaultValue: false,
      description:
        "Only lint files changed in a PR. Optionally provide list of branches to run full lint on.",
    },
  ],
};

interface EslintChangedOptions {
  diff: string;
  files: string;
  github: [true] | [false] | string[];
}

async function eslintChanged(options: EslintChangedOptions) {
  if (!options) {
    return;
  }

  const { files, diff, github } = options;

  if (diff) {
    const files = gitlog({

    })
    console.log(diff, options);
  }
}

const args = app(eslintChangedCommand);
eslintChanged(args);
