const vscode = require('vscode');
const { bformatter } = require('../dist/bformatter/1.0.6/bformatter.cjs');
const { TransformEngine } = require('./lib/TransformEngine');
const { Formatters , Version } = bformatter;

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
    // register formatters
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(
        "bcss",{
            provideDocumentFormattingEdits(document,options,token){
                return [formatAllDocument(document,"bcss",options, token)];
            }
        }
    ));
    console.log('activate balafon bformatter ['+Version+']');
    
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