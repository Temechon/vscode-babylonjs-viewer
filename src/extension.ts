/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';
import BabylonContentProvider from './BabylonContentProvider';

export function activate(context: vscode.ExtensionContext) {

    let previewUri = vscode.Uri.parse('bjs-preview://authority/bjs-preview');

    let provider = new BabylonContentProvider(context);

    let registration = vscode.workspace.registerTextDocumentContentProvider('bjs-preview', provider);

    let open = vscode.commands.registerTextEditorCommand('babylonviewer.open', (te, t) => {
        if (checkBabylon(vscode.window.activeTextEditor.document)) {
            return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'Babylon.js Preview').then((success) => {
                provider.update(previewUri);
            }, (reason) => {
                vscode.window.showErrorMessage(reason);
            });
        } else {
            vscode.window.showWarningMessage("This is not a Babylon file");
        }
    });

    context.subscriptions.push(open);
}

function checkBabylon(document: vscode.TextDocument) {

    let isBabylonType = document.fileName.indexOf('babylon') != -1;
    return isBabylonType;
}