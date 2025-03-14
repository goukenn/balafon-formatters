// author: C.A.D. BONDJE DOUE
// file: extension.js
// @date: 20240618 21:32:54
// @desc: bformatter vscode extension
"use strict";
Object.defineProperty(exports, "__ESModule", { value: true });

const vscode = require("vscode");
const APP_NAME = "@igkdev/vscode-extension-bformatter";

// for release
const cli = require("cli-color");
const { TransformEngine } = require("./lib/TransformEngine");
const { utils } = require("./vscode");
const { Formatters } = require("./formatter");
const completion = require("./vscode/completion");
const Version = "debug.0.0.1";
const _completionList = {};
function debug() {
  //if (env.debug){
  console.log(...arguments);
  //}
}

async function _getCompletionDocumentation(name) {
  if (name in _completionList) {
    return _completionList[name];
  }
  const data = await import('./assets/completions/docs/' + name + '.btm-completion.docs.json');
  let c = data ? { ...data } : {};
  _completionList[name] = c;
  return c;
}

class VSCodeTransformEngine extends TransformEngine { }

TransformEngine.Register("vscode", VSCodeTransformEngine);
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
    console.log("missing format....", _formatter.error);
  } else {
    console.log(cli.red("missing formatter: " + format));
  }
}
/**
 * 
 * @param {vscode.ExtensionContext} context 
 */
function activate(context) {

  // + | register language formatters
  debug(`activate ${APP_NAME}`);

  // + | ------------------------------------------------------------------------
  // + | LOAD LANGUAGE FORMATTERS 
  // + | 

  const languageFormatter = new Map();
  ["bcss", "bview", "phtml", "bjs", "pcss", "bhtml", "vbmacros"].forEach(a => {
    let p = vscode.languages.registerDocumentFormattingEditProvider(a, {
      provideDocumentFormattingEdits(document, options, token) {
        return [formatAllDocument(document, a, options, token)];
      }
    });
    context.subscriptions.push(p);
    languageFormatter.set(a, p);
  });
  const { commands } = require("./vscode/command");
  // + |
  // + | register extension command
  const _commands = {
    ...commands
  };

  // + | ------------------------------------------------------------------------
  // + | subscribe command
  for (let _key in _commands) {
    let _fc = _commands[_key];
    let c = vscode.commands.registerCommand(_key, _fc);
    context.subscriptions.push(c);
  }
  // + | ------------------------------------------------------------------------
  // + |  color provider to detect color expression in code
  // + |
  const _clprofiles = {
    bcss: {
      ...utils.LoadProvideDocumentColor("bcss-provide-colors", vscode)
    },
    bcolor: {
      colorCache: {},
      /**
             * 
             * @param {vscode.TextDocument} document 
             * @param {vscode.CancellationToken} token 
             * @returns {vscode.ColorInformation[]}
             */
      async provideDocumentColors(document, token) {
        const _idref = document.uri.toString();
        const _text = document.getText();
        const _formatter = Formatters.Load("bcolor");
        if (!_formatter) {
          console.error('missing bcolor formatter');
          return;
        }
        if (_idref in this.colorCache) {
          return this.colorCache[_idref];
        }
        const _colors_lists = utils.ExtractColors(_formatter, _text);
        const _colors = [];
        // console.log('call color provider ');
        if (_colors_lists) {
          try {
            _colors_lists.forEach(i => {
              let x = document.positionAt(i.sourceOffset * 1.0);
              let y = document.positionAt(i.sourceOffset + i.value.length);
              const _range = new vscode.Range(x, y);
              const _color = utils.GetColor(
                i.type == "webcolor" ? utils.ReverseColor(i.value) : i.value,
                vscode
              );
              const _clinfo = new vscode.ColorInformation(_range, _color);
              _colors.push(_clinfo);
            });
          } catch (ex) {
            console.debug("error ", ex);
          }
        }
        this.colorCache[_idref] = _colors;
        return _colors;
      },
      onDidChangeTextDocument(document) {
        delete this.colorCache[document.uri.toString()];
      },
      onDidCloseTextDocument(document) {
        delete this.colorCache[document.uri.toString()];
      }
    }
  };

  for (let i in _clprofiles) {
    const _provider = _clprofiles[i] || {};
    if (!("provideColorPresentations" in _provider)) {
      const { provideColorPresentations } = utils.GetProviderPresentation(
        i,
        vscode
      );
      _provider.provideColorPresentations = provideColorPresentations;
    }
    const c = vscode.languages.registerColorProvider(
      { scheme: "file", language: i },
      _provider
    );
    context.subscriptions.push(c);
    // + | register subscription changed for providing
    if ('onDidCloseTextDocument' in _provider) {
      context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(({ document }) => _provider.onDidCloseTextDocument(document)));
    }
    if ('onDidChangeTextDocument' in _provider) {
      context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(({ document }) => _provider.onDidChangeTextDocument(document)));
    }
    // console.log('register : '+i);
  }

  // register highlight definition
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      {
        scheme: "file",
        language: "bcss"
      },
      {
        /**
         * 
         * @param {*} document 
         * @param {*} position 
         * @param {*} token 
         * @param {{triggerCharacter:number, triggerKind:number}} context 
         * @returns 
         */
        provideCompletionItems(document, position, token, context) {
          const _provide_items = [];
          let wordRange = document.getWordRangeAtPosition(position, /[\w-]+/);
          const word = wordRange ? document.getText(wordRange) : false;
          const css_complementDocumentation = _getCompletionDocumentation('bcss');
          const cdef = {
            "@balafon":"global properties",
            "@def":"define default global styles",
            "@xsm-screen":"define extra small screen style",
            "@sm-screen":"define small screen style",
            "@lg-screen":"define large screen style",
            "@xls-screen":"define extra large screen style",
            "@xxsm-screen":"define extra-extra large screen style"
          }
          // init media
          "@balafon|@def|@xsm-screen|@sm-screen|@lg-screen|@xlg-screen|@xxlg-screen"
            .split("|")
            .sort()
            .forEach(o => {
              const _item = new vscode.CompletionItem(o);
              _item.commitCharacters = ["\t"];
              _item.documentation = new vscode.MarkdownString(
                cdef[o],
                "define screen - type"
              );
              _item.insertText = o + "{\n}";
              _item.kind = vscode.CompletionItemKind.Module;
              // _item.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
              _provide_items.push(_item);
            });
          const properties = require("../src/lib/Css/CssProperties");

          // for(let j in vscode.CompletionItemKind){
          //   const _item = new vscode.CompletionItem(j);
          //   _item.kind = vscode.CompletionItemKind[j];
          //   _provide_items.push(_item);  
          // }
          const regex = word ? new RegExp(`\\b${word}`) : null;
          properties.sort().forEach(o => {

            // + | skip word
            if (regex && !regex.test(o)) {
              return;
            }

            const _item = new vscode.CompletionItem(o);
            _item.kind = vscode.CompletionItemKind.Constant;
            if (word) {
              _item.range = wordRange;
            } else
              _item.insertText = o;
            if (o in css_complementDocumentation) {
              const r = ['## ' + o];
              const d = css_complementDocumentation[o];
              if (!Array.isArray(d)) {
                r.push(d)
              } else
                r.push(...d);

              _item.documentation = new vscode.MarkdownString(r.join("\n"));
            }

            _provide_items.push(_item);
          });
          const { GetProvideList } = completion.bcss;
          const { colorList, rootList } = GetProvideList(document.getText());
          const li = [colorList, rootList];
          while (li.length > 0) {
            const _m = li.shift();
            // load color
            for (let i in _m) {
              const _item = new vscode.CompletionItem(i);
              _item.insertText = "var(" + i + ")";
              _item.kind = vscode.CompletionItemKind.Property;
              _provide_items.push(_item);
            }
          }
          return _provide_items;
        }
      },
      // + | char that triget completion list
      "."
    )
  );
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
};
