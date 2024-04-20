const vscode = require('vscode');
// for release 
const { bformatter } = require('../dist/bformatter/1.0.7/bformatter.cjs');
const { TransformEngine } = require('./lib/TransformEngine');
// const { Formatters , Version } = bformatter;

// for debug
const { Formatters } = require("./formatter");
const Version = 'debug.0.0.1';
 
class VSCodeTransformEngine extends TransformEngine{

}


TransformEngine.Register('vscode', VSCodeTransformEngine);


function formatAllDocument(document, format){
    const _text = document.getText();
    const _range = new vscode.Range(
        document.lineAt(0).range.start,
        document.lineAt(document.lineCount-1).range.end
    );
    const _formatter = Formatters.Load(format);
    if (_formatter){
        let _res = _formatter.format(_text.split("\n"));
        return vscode.TextEdit.replace(_range, _res);
    }
}
/**
 * 
 * @param {vscode.ExtensionContext} context 
 */
function activate(context){
    // vscode.Document
    // + register language formatters 
    ["bcss","bview","phtml","bjs","pcss"].forEach((a)=>{
        context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(
            a,{
                provideDocumentFormattingEdits(document,options,token){
                    return [formatAllDocument(document, a,options, token)];
                }
            }
        ));
    });
    // + get workspace configuration 
    // let config = vscode.workspace.getConfiguration("editor.tokenColorCustomizations");
    // let { textMateRules } = config;
    // if (!textMateRules){
    //     textMateRules = {};
    //     config.textMateRules = textMateRules;
    // }
    // textMateRules.push({
    //     "scope":["property.bcss"],
    //     "settings":{
    //         "foreground":"#CCCCC"
    //     }
    // });

    // textMateRules.push({
    //     "scope":["word"],
    //     "settings":{
    //         "foreground":"#0000FF"
    //     }
    // });
    // console.log("init configuration ", JSON.stringify(config.textMateRules));
}
/**
 * 
 */
function deactivate(){

}

// export extension method
module.exports = {
    activate,
    deactivate
}