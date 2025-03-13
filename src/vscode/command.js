"use strict";
Object.defineProperty(exports, '__ESModule', {value:true});

const vscode = require('vscode');
const { CssTransformer } = require('../lib/Css/CssTransformer')
// list of vscode command helper
const commands = {
    "css.transform.toJSON": async () => { 
        const { document } = vscode.window.activeTextEditor;
        if (!document){
            return;
        }
        let {scheme} = document.uri;
        if (scheme != 'file'){
            return;
        }
        // determine if the document match the language
        let _match = vscode.languages.match({language:'css'}, document);

        // console.log(_match);
       if (_match==0){
         throw new Error('document is not a valid css document')
       }
        // let _fname = await vscode.window.showInputBox({
        //     placeHolder: 'file Name'
        // })
        const src = document.getText()

        const json = CssTransformer.ToJSON(src); 
        vscode.workspace.openTextDocument({
            "language":"json",
            "content":json,
        }).then((a)=>{
            vscode.window.showTextDocument(a);
        });
    },
    "bcss.transform.toCss": async()=>{
        //
    }
}

exports.commands = commands;