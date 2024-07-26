import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

let classNames: string[] = [];

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("CSS Class Name Hints activated.");

  const config = vscode.workspace.getConfiguration("cssClassNameHints");
  // 获取配置css文件路径
  const cssFilePath = config.get<string>("cssFilePath") || "";

  if (cssFilePath) {
    const cssFullPath = path.resolve(
      vscode.workspace.rootPath || "",
      cssFilePath
    );
    vscode.window.showInformationMessage(
      `Loading CSS file from ${cssFullPath}`
    );
    // 加载类名列表
    loadClassNames(cssFullPath);
  } else {
    vscode.window.showErrorMessage("CSS file path is not configured.");
  }

  // 监听配置变化
  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("cssClassNameHints.cssFilePath")) {
      const config = vscode.workspace.getConfiguration("cssClassNameHints");
      const cssFilePath = config.get<string>("cssFilePath") || "";
      if (cssFilePath) {
        const cssFullPath = path.resolve(
          vscode.workspace.rootPath || "",
          cssFilePath
        );
        vscode.window.showInformationMessage(
          `Reloading CSS file from ${cssFullPath}`
        );
        // 文件路径改变，重新加载类名列表
        loadClassNames(cssFullPath);
      }
    }
  });

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      ["html", "typescriptreact", "javascriptreact"],
      {
        // 类名提示项
        provideCompletionItems(
          document: vscode.TextDocument,
          position: vscode.Position
        ) {
          const linePrefix = document
            .lineAt(position)
            .text.substring(0, position.character);
          console.log(`Line prefix: ${linePrefix}`);

          const classAttributeRegex = /(class|className)="([^"]*)$/;
          const match = linePrefix.match(classAttributeRegex);
          if (!match) {
            return undefined;
          }

          const classList = match[2]; // 获取类名列表
          const lastClass = classList.split(" ").pop(); // 获取最后一个类名前缀

          const completionItems = classNames
            .filter((className) => className.startsWith(lastClass || ""))
            .map((className) => {
              const item = new vscode.CompletionItem(
                className,
                vscode.CompletionItemKind.Variable
              );
              item.detail = "CSS Class Name";
              return item;
            });

          return completionItems;
        },
      },
      " ",
      '"',
      "." // Trigger completion after typing space, double quotes, or dot
    )
  );
}

function loadClassNames(cssFilePath: string) {
  // 读取css配置文件，提取css类名
  fs.readFile(cssFilePath, "utf-8", (err, data) => {
    if (err) {
      vscode.window.showErrorMessage(`Could not read CSS file: ${err.message}`);
      return;
    }
    classNames = extractClassNames(data);
    // vscode.window.showInformationMessage(
    //   `Loaded ${classNames.length} class names.`
    // );
    console.log(`Loaded class names: ${classNames}`);
  });
}

function extractClassNames(cssContent: string): string[] {
  const regex = /\.([a-zA-Z0-9-_]+)/g;
  const matches = cssContent.match(regex);
  if (matches) {
    return matches.map((match) => match.slice(1));
  }
  return [];
}

export function deactivate() {
  vscode.window.showInformationMessage("CSS Class Name Hints deactivated.");
}
