#!/usr/bin/env node

const { eslintChanged, eslintChangedCommand } = require("../dist");

eslintChanged(app(eslintChangedCommand)).then((files) => {
  console.log(files.join(" "));
});
