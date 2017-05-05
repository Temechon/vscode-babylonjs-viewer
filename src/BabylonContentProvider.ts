
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
                    user-select: none;
                }
                .category {
                    margin-top:10px;
                    width:500px;
                }
                .category .title {
                    border-bottom:2px solid #009BFF;
                    color:#009BFF;
                    padding: 10px;
                    text-transform: uppercase;
                }
                .category ul {
                    margin: 0;
                    padding: 10px;
                    list-style: none;
                }
                .category ul li {
                    margin-left: 5px;
                    padding: 3px;
                    cursor:pointer; 
                }
				</style>
                
                <script src="${this.getResourcePath('babylon.js')}"></script>
                </head>
				<body>
					<canvas id='render'></canvas>
					<div class='category'>
                        <div class='title'>
                            Meshes list
                        </div>
                        <ul id='content'></ul>
                    </div>
				</body>
                <script>                
                var canvas = document.getElementById('render');
                var engine = new BABYLON.Engine(canvas, true);
                
                BABYLON.SceneLoader.Load("", '${mesh}', engine,function (scene) {
                    
                    if (scene.activeCamera) {
                        scene.activeCamera.dispose();
                        scene.activeCamera = null;
                    }
                    
                    scene.clearColor = new BABYLON.Color4(0,0,0,0);
                    
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
                    
                    var round = function(nb) {
                        return Math.round(nb * 100) / 100
                    };
                    var display = function(vec) {
                        return 'x:'+round(vec.x)+", y:"+round(vec.y)+", z:"+round(vec.z)
                    }
                    
                    // Display mesh name and position
                    var list = document.querySelector('#content')
                    for (var m=0; m<scene.meshes.length; m++) {
                        var li = document.createElement('li');
                        li.textContent = scene.meshes[m].name;
                        
                        var ul = document.createElement('ul');
                        var li2 = document.createElement('li');
                        li2.innerHTML = '<b>position: </b>'+ display(scene.meshes[m].position);
                        ul.appendChild(li2);
                        var li3 = document.createElement('li');
                        li3.innerHTML = '<b>rotation: </b>'+ display(scene.meshes[m].rotation);
                        ul.appendChild(li3);
                        
                        li.appendChild(ul);
                        list.appendChild(li);
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