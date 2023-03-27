import * as vscode from "vscode";

let term: vscode.Terminal | undefined;
const TERM_NAME = "id_psql_tools";

function runQueryInTerminal(sqlQuery: string) {
  term ??= vscode.window.createTerminal(TERM_NAME);
  sqlQuery = sqlQuery.replace(/"/g, '\\"');
  term.sendText(`clear && echo \"${sqlQuery}\" | psql`);
  term.show();
  vscode.window.onDidCloseTerminal((event) => {
    if (term && event.name === TERM_NAME) {
      term.dispose();
      term = undefined;
    }
  });
}

export function activate(context: vscode.ExtensionContext) {
  term = vscode.window.createTerminal("id_psql_tools");
  context.subscriptions.push(
    vscode.commands.registerCommand("id_psql_tools.run_query", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        throw new Error("no editor");
      }
      const document = editor.document;
      const qStartR = /^--ZAD[0-9]+$/;
      const qEndR = /^----$/;

      let startLn = editor.selection.active.line;
      for (startLn; !qStartR.test(document.lineAt(startLn).text); --startLn) {
        if (startLn === 0) {
          vscode.window.showErrorMessage(
            "Couldn't find query starting block (--ZAD[number])"
          );
          return;
        }
      }
      let endLn = startLn;
      for (endLn; !qEndR.test(document.lineAt(endLn).text); ++endLn) {
        if (endLn === document.lineCount - 1) {
          vscode.window.showErrorMessage(
            "Couldn't find query ending block (----)"
          );
          return;
        }
      }

      const range = new vscode.Range(
        startLn + 1,
        0,
        endLn - 1,
        document.lineAt(endLn - 1).text.length
      );
      const query = editor.document.getText(range);
      runQueryInTerminal(query);
    })
  );
}

export function deactivate() {}
