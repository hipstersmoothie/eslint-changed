#!/usr/bin/env node

const { app } = require("command-line-application");
const { eslintChanged, eslintChangedCommand } = require("../dist");

eslintChanged(app(eslintChangedCommand)).then((files) => {
  console.log(files.join(" "));
});
