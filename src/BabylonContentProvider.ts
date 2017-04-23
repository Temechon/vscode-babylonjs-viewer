
'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

export default class BabylonContentProvider implements vscode.TextDocumentContentProvider {

    private _context: vscode.ExtensionContext;

    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    public provideTextDocumentContent(uri: vscode.Uri): string {
        return this.createBjsPreview();
    }

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }

    public createBjsPreview() {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            // https://github.com/Microsoft/vscode/issues/3147
            return 'File is larger than 5MB, and it cannot be displayed...';
        }
        let filename = editor.document.fileName;
        if (filename.indexOf('.babylon') === -1) {
            return `It's not a .babylon file.`;
        }
        return this.snippet(editor.document.getText());
    }

    private getResourcePath(mediaFile): string {
        return this._context.asAbsolutePath(path.join('resources', mediaFile));
    }

    private snippet(datafile: string): string {
        var mesh = 'data:' + datafile;

        // Get folder name to replace textures URLs
        var filename = vscode.window.activeTextEditor.document.fileName;
        var folder = filename.substr(0, filename.lastIndexOf(path.sep) + 1);
        folder = folder.replace(/\\/g, '/'); // replace backslash on windows

        var snippet = `
                <head>
                <style>
                html, body {
                    width : 100%;
                    height:100%;
                }
                #render {
                    margin  : 0;
                    padding : 0;
                    width : 500px;
                    height:500px;
                    display : block;
                }
				</style>
                
                <script src="${this.getResourcePath('babylon.js')}"></script>
                </head>
				<body>
					<canvas id='render'></canvas>
				</body>
                <script>                
                var canvas = document.getElementById('render');
                var engine = new BABYLON.Engine(canvas, true);
                
                BABYLON.SceneLoader.Load("", '${mesh}', engine,function (scene) {
                    
                    if (scene.activeCamera) {
                        scene.activeCamera.dispose();
                        scene.activeCamera = null;
                    }
                    
                    scene.createDefaultCameraOrLight(true);                    
                    scene.activeCamera.attachControl(canvas);
                    
                    // Rework materials
                    if (scene.materials) {
                        for (var i=0; i<scene.materials.length; i++) {
                            if (scene.materials[i].diffuseTexture) {
                                var textureName = scene.materials[i].diffuseTexture.url;
                                var newTexture = new BABYLON.Texture('${folder}'+textureName, scene);
                                scene.materials[i].diffuseTexture = newTexture;  
                            }
                        }
                    }
                    
                    engine.runRenderLoop(function(){ 
                        scene.render(); 
                    });
                    
                });                              
                
                </script>
                `;
        return snippet;
    }
}