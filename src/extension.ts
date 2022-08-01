import * as vscode from "vscode";
import { Caller } from "./grpcurl/caller";
import { Grpcurl } from "./grpcurl/grpcurl";
import { Parser } from "./grpcurl/parser";
import { RequestHistoryData } from "./storage/history";
import { Storage } from "./storage/storage";
import { TreeViews } from "./treeviews/treeviews";
import { WebViewFactory } from "./webview";

export function activate(context: vscode.ExtensionContext) {
  const storage = new Storage(context.globalState);
  const grpcurl = new Grpcurl(new Parser(), new Caller());
  const treeviews = new TreeViews(
    storage.hosts.list(),
    storage.headers.list(),
    storage.history.list(),
    storage.protos.list()
  );

  const webviewFactory = new WebViewFactory(
    context.extensionUri,
    async (data: RequestHistoryData): Promise<RequestHistoryData> => {
      let resp = await grpcurl.send({
        path: data.path,
        reqJson: data.reqJson,
        host: data.host,
        method: data.method,
        tlsOn: data.tlsOn,
        metadata: data.metadata,
        maxMsgSize: data.maxMsgSize,
      });
      data.code = resp.code;
      data.respJson = resp.respJson;
      data.time = resp.time;
      data.date = resp.date;
      data.message = resp.message;
      const requests = storage.history.add(data);
      treeviews.history.update(requests);
      return data;
    }
  );

  vscode.commands.registerCommand("hosts.add", async () => {
    const host = await vscode.window.showInputBox({
      title: `adress to make a call`,
    });
    if (host === "" || host === undefined || host === null) {
      return;
    }
    const description = await vscode.window.showInputBox({
      title: `description for spectiifed host`,
    });
    let err = storage.hosts.add({
      adress: host,
      description: description,
      current: false,
    });
    if (err !== null) {
      vscode.window.showErrorMessage(err.message);
    }
    treeviews.hosts.update(storage.hosts.list());
  });

  vscode.commands.registerCommand("hosts.remove", async () => {
    const hosts = storage.hosts.list();
    let adresses: string[] = [];
    for (const host of hosts) {
      adresses.push(host.adress);
    }
    const removeHost = await vscode.window.showQuickPick(adresses, {
      title: `choose a host to remove`,
    });
    if (removeHost === "" || removeHost === undefined || removeHost === null) {
      return;
    }
    storage.hosts.remove(removeHost);
  });

  vscode.commands.registerCommand("hosts.switch", async (host: string) => {
    let newHosts = storage.hosts.setCurret(host);
    treeviews.hosts.update(newHosts);
  });

  vscode.commands.registerCommand("protos.add", async () => {
    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
      openLabel: "Open",
      filters: {
        protoFiles: ["proto"],
      },
    };
    let pick = await vscode.window.showOpenDialog(options);
    let path = pick[0].fsPath;
    let [pathes, err] = storage.protos.add(path);
    if (err !== null) {
      vscode.window.showErrorMessage(err.message);
    }
    treeviews.protos.update(pathes);
  });

  vscode.commands.registerCommand("protos.remove", async () => {
    let pathes = storage.protos.list();
    let path = await vscode.window.showQuickPick(pathes);
    pathes = storage.protos.remove(path);
    treeviews.protos.update(pathes);
  });

  vscode.commands.registerCommand("protos.refresh", async () => {
    let protoPathes = storage.protos.list();
    treeviews.protos.update(protoPathes);
  });

  vscode.commands.registerCommand("headres.add", async () => {
    let meta = (await vscode.window.showInputBox()) ?? "";
    let [metadata, err] = storage.headres.add(meta);
    if (err !== null) {
      vscode.window.showErrorMessage(err.message);
    }
    treeviews.metadata.refresh(metadata);
  });

  vscode.commands.registerCommand("headres.remove", async () => {
    let oldMetadata = storage.headres.list();
    let meta = await vscode.window.showQuickPick(oldMetadata);
    let metadata = storage.headres.remove(meta);
    treeviews.metadata.refresh(metadata);
  });

  vscode.commands.registerCommand("headres.switch", async (meta: string) => {
    storage.headres.switchOnOff(meta);
    let metadata = storage.headres.listMetas();
    treeviews.metadata.refresh(metadata);
  });

  vscode.commands.registerCommand("webview.open", async (input: Request) => {
    if (input.isStream) {
      vscode.window.showWarningMessage("Stream calls are not available yet!");
      return;
    }
    const host = storage.hosts.getCurret();
    input.host = host;
    const hosts = storage.hosts.list();
    input.hosts = hosts;
    webviewFactory.create(input);
  });
}

export function deactivate() {}
