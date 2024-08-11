// author: C.A.D. BONDJE DOUE
// file: extension.js
// @date: 20240618 21:32:54
// @desc: bformatter vscode extension
Object.defineProperty(exports, '__ESModule', {value:true});

const vscode = require('vscode');

// for release 
const  cli = require('cli-color');
const { TransformEngine } = require('./lib/TransformEngine');
const { utils } = require('./vscode'); 
const { Formatters } = require("./formatter");
const completion = require("./vscode/completion");
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
    // console.log("activate bformatters");
    const languageFormatter = new Map();
    ["bcss", "bview", "phtml", "bjs", "pcss", "bhtml", "vbmacros"].forEach((a) => {
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
    const { commands } = require('./vscode/command')
    // + |
    // + | register extension command
    const _commands = {
        ...commands
    };


    // + | subscribe command
    for (let _key in _commands) {
        let _fc = _commands[_key];
        let c = vscode.commands.registerCommand(_key, _fc);
        context.subscriptions.push(c);
    }

    // + | register color provider 
    const _clprofiles =
    {
        'bcss':{
            ...utils.LoadProvideDocumentColor('bcss-provide-colors', vscode)
        },
        "bcolor": {
            /**
             * 
             * @param {vscode.TextDocument} document 
             * @param {vscode.CancellationToken} token 
             * @returns {vscode.ColorInformation[]}
             */
            provideDocumentColors(document, token) {
                const _text = document.getText();
                const _formatter = Formatters.Load('fbcolor');
                const _colors_lists = utils.ExtractColors(_formatter, _text);
                const _colors = []; 
                if (_colors_lists) {
                    try{
                    _colors_lists.forEach(i => {
                        let x = document.positionAt(i.sourceOffset*1.0);
                        let y = document.positionAt( i.sourceOffset + i.value.length);
                        const _range = new vscode.Range(x,y);
                        const _color = utils.GetColor(i.type == 'webcolor' ? utils.ReverseColor(i.value) : i.value, vscode);
                        const _clinfo = new vscode.ColorInformation(_range, _color);
                        _colors.push(_clinfo);
                    });
                    } catch(ex){
                        console.debug("error ", ex);
                    }
                } 
                return _colors;
            }
        }
    }
        ;
    for (let i in _clprofiles) {
        const _provider = _clprofiles[i] || {};
        if (!('provideColorPresentations' in _provider)){
            const { provideColorPresentations } = utils.GetProviderPresentation(i,vscode);
            _provider.provideColorPresentations = provideColorPresentations;
        }
        const c = vscode.languages.registerColorProvider({ scheme: 'file', language: i },
            _provider
        );
        context.subscriptions.push(c);
    } 



    // register hightight definition 
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider({
        scheme: 'file',
        language: 'bcss'
    }, {
        /**
         * 
         * @param {*} document 
         * @param {*} position 
         * @param {*} token 
         * @param {{triggerCharacter:number, triggerKind:number}} context 
         * @returns 
         */
        provideCompletionItems(document, position, token, context){            
            const _provide_items =  [];
            // init media 
            '@balafon|@def|@xsm-screen|@sm-screen|@lg-screen|@xlg-screen|@xxlg-screen'.split('|').sort().forEach(o=>{
                const _item =  new vscode.CompletionItem(o);
                _item.commitCharacters = ["\t"];
                _item.documentation = new vscode.MarkdownString('define screen - type');
                _item.insertText = o+"{\n}";
                _item.kind = vscode.CompletionItemKind.Module;
                // _item.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                _provide_items.push(_item);
            });

            'display|background-color'.split('|').sort().forEach(o=>{
                const _item =  new vscode.CompletionItem(o);
                _provide_items.push(_item);
            }); 
            return _provide_items;
        }

    }, '.'));
}
/**
 * 
 */
function deactivate() {
    // console.log("deactivated");
}

// export extension method
module.exports = {
    activate,
    deactivate
}