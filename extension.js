const vscode = require("vscode");

function parseArgs(argStr) {
  const bracketPairs = { "(": ")", "[": "]", "{": "}" };
  const quotes = new Set(['"', "'"]);
  let args = [];
  let bracketStack = [];
  let buffer = "";
  let quoteStack = [];
  for (const char of argStr) {
    if (quotes.has(char)) {
      if (char !== quoteStack[quoteStack.length - 1]) {
        quoteStack.push(char);
      } else {
        quoteStack.pop();
      }
    }
    if (!quoteStack.length) {
      if (bracketPairs[char]) {
        bracketStack.push(char);
      } else if (char === bracketPairs[bracketStack[bracketStack.length - 1]]) {
        bracketStack.pop();
      }
    }
    if (!quoteStack.length && !bracketStack.length && char === ",") {
      if ((buffer = buffer.trim())) {
        args.push(buffer);
        buffer = "";
      }
    } else {
      buffer += char;
    }
  }
  if ((buffer = buffer.trim())) {
    args.push(buffer);
  }
  return args;
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("kwarg-sort.sortKwargs", () => {
      const editor = vscode.window.activeTextEditor;
      const selection = editor.selection;
      const code = editor.document.getText(selection);
      const argStr = (code.match(/\w+\s*\((.*)\)/s) || [])[1];
      if (!argStr) {
        return;
      }
      const args = parseArgs(argStr);
      let keywordArgs = [];
      let positionalArgs = [];
      for (const arg of args) {
        if (arg.includes("=")) {
          keywordArgs.push(arg);
        } else {
          positionalArgs.push(arg);
        }
      }
      keywordArgs.sort();
      editor.edit((editBuilder) =>
        editBuilder.replace(
          selection,
          code.replace(
            /(\w+)\s*\(.*\)/s,
            `$1(${[...positionalArgs, ...keywordArgs].join(", ")})`
          )
        )
      );
    })
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
