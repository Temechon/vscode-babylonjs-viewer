'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

export default class BabylonContentProvider implements vscode.TextDocumentContentProvider {

    private _context: vscode.ExtensionContext;

    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

    /** The selected babylon file */
    public selectedDocument: vscode.TextDocument = null;

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
        console.log('document name', this.selectedDocument.fileName);
        let editor = this.selectedDocument;
        if (!editor) {
            // https://github.com/Microsoft/vscode/issues/3147
            return 'File is larger than 5MB, and it cannot be displayed...';
        }
        let filename = editor.fileName;
        if (filename.indexOf('.babylon') === -1) {
            return `It's not a .babylon file.`;
        }
        return this.snippet();
    }

    private getResourcePath(mediaFile): string {
        return this._context.asAbsolutePath(path.join('resources', mediaFile));
    }

    private snippet(): string {
        let datafile = this.selectedDocument.getText();
        console.log('snippet', this.selectedDocument.fileName);
        var mesh = 'data:' + datafile;

        // Get folder name to replace textures URLs
        var filename = this.selectedDocument.fileName;
        var folder = filename.substr(0, filename.lastIndexOf(path.sep) + 1);
        folder = folder.replace(/\\/g, '/'); // replace backslash on windows

        var snippet = `
                <head>
                <style>
                html, body {
                    width : 100%;
                    height:100%;
                    background-color:#eee;
                    padding:20px;
                }
                #render {
                    margin  : 0;
                    padding : 0;
                    width : 500px;
                    height: 500px;
                    display : block;
                    user-select: none;
                    border : 2px solid #00426b;
                }
                .category {
                    margin-top:10px;
                    width:500px;
                }
                .category .title {
                    border-bottom:2px solid #00426b;
                    color:#00426b;
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
                    color:#333;
                }

                .category ul li.meshname {
                    color:#E74C3C;
                }

                .button {
                    box-sizing:border-box;
                    display : inline-block;
                    background-color:white;
                    color:#00426b;
                    padding:5px;
                    border: 1px solid #00426b;
                    margin : 0 10px 0 10px;
                    cursor:pointer;
                    user-select: none;
                    font-size:0.9em;
                }
                .button:hover {
                    background-color:#00426b;
                    color:white;
                }
                .button:active {
                    border: 1px solid #009BFF;
                    background-color:#009BFF;
                    color:white;
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
                    
                    // Create default arc rotate camera
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
                    
                    // Round numbers for display reasons
                    var round = function(nb) {
                        return Math.round(nb * 100) / 100;
                    };
                    var display = function(vec) {
                        return 'x:'+round(vec.x)+", y:"+round(vec.y)+", z:"+round(vec.z)
                    };

                    // Create a HTML button
                    var createButton = function(text, callback) {
                        let div = document.createElement('div');
                        div.classList.add('button');
                        div.textContent = text;
                        div.addEventListener('click', callback.bind(div));
                        return div;
                    };
                    
                    // Display mesh name and position
                    var list = document.querySelector('#content')
                    for (var m=0; m<scene.meshes.length; m++) {
                        var mesh = scene.meshes[m];
                        var li = document.createElement('li');
                        li.classList.add('meshname');
                        li.innerHTML = '<b>'+mesh.name+'</b>';
                        li.appendChild(function(mmm) {
                            return createButton('HIDE', function() {
                                if (mmm.isEnabled()) {
                                    mmm.setEnabled(false);
                                    this.textContent = 'DISPLAY';
                                } else {
                                    mmm.setEnabled(true);
                                    this.textContent = 'HIDE';
                                }
                            })
                        }(mesh));
                        
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