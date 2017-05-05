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

    let previewOpen = false;

    let open = vscode.commands.registerTextEditorCommand('babylonviewer.open', (te, t) => {
        if (checkBabylon(te.document)) {
            provider.selectedDocument = te.document;

            if (previewOpen) {
                provider.update(previewUri);
            } else {
                return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'Babylon.js Preview').then((success) => {
                    previewOpen = true;
                }, (reason) => {
                    vscode.window.showErrorMessage(reason);
                });
            }

        } else {
            vscode.window.showWarningMessage("This is not a Babylon file");
        }
    });

    // Deactivate the preview update if the closed doc is the preview panel
    vscode.workspace.onDidCloseTextDocument((e: vscode.TextDocument) => {
        if (e.uri.toString() === previewUri.toString()) {
            previewOpen = false;
        }
    })

    context.subscriptions.push(open);
}

function checkBabylon(document: vscode.TextDocument) {

    let isBabylonType = document.fileName.indexOf('babylon') != -1;
    console.log('is babylon file', isBabylonType);
    return isBabylonType;
}