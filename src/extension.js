// author: C.A.D. BONDJE DOUE
// file: extension.js
// @date: 20240618 21:32:54
// @desc: bformatter vscode extension

const fs = require('fs')
const vscode = require('vscode');
// for release 
// const { bformatter } = require('../dist/bformatter/1.0.39/bformatter.cjs');
const { TransformEngine } = require('./lib/TransformEngine');
const cli = require('cli-color');

// for debug
const { Formatters } = require("./formatter");
const Version = 'debug.0.0.1';

class VSCodeTransformEngine extends TransformEngine {

}


TransformEngine.Register('vscode', VSCodeTransformEngine);
const sm_FORMATTERS = {};
let _formatter = null;
function GetFormatter(format) {
    if (format in sm_FORMATTERS) {
        return sm_FORMATTERS[format];
    }
    try {
        _formatter = Formatters.Load(format);
        if (!_formatter) {
            throw new Error("formatter is missing[" + format + "]");
        }
    } catch (e) {
        console.log("error", e);
    }
    sm_FORMATTERS[format] = _formatter;
    return _formatter;
}
/**
 * 
 * @param {*} document 
 * @param {string|{name:string, prefix:string}} format 
 * @returns 
 */
function formatAllDocument(document, format) {
    const _text = document.getText();
    const _range = new vscode.Range(
        document.lineAt(0).range.start,
        document.lineAt(document.lineCount - 1).range.end
    );
    const _formatter = GetFormatter(format);
    if (_formatter) {
        console.log("format :", { format });
        let _res = _formatter.format(_text.split("\n"));
        if (_res) {
            return vscode.TextEdit.replace(_range, _res);
        }
        console.log('missing format....', _formatter.error);
    } else {
        console.log(cli.red('missing formatter: ' + format));
    }
}
/**
 * 
 * @param {vscode.ExtensionContext} context 
 */
function activate(context) {
    // + | register language formatters 
    console.log("activate bformatters");
    const languageFormatter = new Map();
    ["bcss", "bview", "phtml", "bjs", "pcss", "demodata", "bhtml", "vbmacros"].forEach((a) => {
        ;
        let p = vscode.languages.registerDocumentFormattingEditProvider(
            a, {
            provideDocumentFormattingEdits(document, options, token) {
                return [formatAllDocument(document, a, options, token)];
            }
        }
        );
        context.subscriptions.push(p);
        languageFormatter.set(a, p);
    });
    const { commands }  = require('./vscode/command')
    // + |
    // + | register extension command
    const _commands = {
        ...commands
    };


    // + | subscribe command
    for (let _key in _commands) {
        let _fc = _commands[_key];
        let c = vscode.commands.registerCommand(_key,  _fc);
        context.subscriptions.push(c);
    }

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
function deactivate() {

}

// export extension method
module.exports = {
    activate,
    deactivate
}