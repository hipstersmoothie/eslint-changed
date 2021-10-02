#!/usr/bin/env node

const { app } = require("command-line-application");
const { eslintChanged, eslintChangedCommand } = require("../dist");

const args = app(eslintChangedCommand);

if (args) {
  eslintChanged(args).then((files) => {
    console.log(files.join(" "));
  });
}
