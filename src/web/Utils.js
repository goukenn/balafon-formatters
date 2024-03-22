"use stricts";
Object.defineProperty(exports, '__esModule', { value: true });

const _utils = require("../lib/Utils")


const { Patterns, CaptureInfo } = _utils.Utils.Classes;

function InitLine(target, max_line_count) {
    let _maxLine = (max_line_count + '').length;
    let _style = 'display:inline-block; text-align:right; margin-right:4px; min-width: ' + _maxLine + 'em;';
    let _lineCount = 0;
    target.querySelectorAll('div.line').forEach(i => {
        let n = document.createElement('div');
        n.innerHTML = _lineCount + 1;
        n.style = _style;
        i.insertBefore(n, i.firstChild);
        _lineCount++;
    });
}

const classDefinition = {
    'comment':'comment',
    'reserved-word':'rs-w',
};
function getClass(tokenID){
    if (tokenID in classDefinition){
        return classDefinition[tokenID];
    }
    return tokenID.toLowerCase();
}

class ExtraPattern extends Patterns{
    className;
}
class ExtraCapture extends CaptureInfo{
    className
    constructor(q){
        super(q); 
    }
}
const webStyleClass = {
    patternClassName: ExtraPattern,
    captureInfoClassName: ExtraCapture
};

/**
 * webFormattingListener - 
 * @param {*} _def 
 * @returns 
 */
function webFormattingListener(_def) {
    _def._maxLineCount = 0;
    return function () {
        let blocks = [];
        let sbuffer = false;
        let _lineCount = 0;
        let _self = this;
        let _buffers = [];
        let _r_def = {
            endOutput({lineFeed}){
                return _buffers.join(lineFeed);
            },
            endContent(){
                return "";// </div>"
            },
            renderToken(v, tokens, tokenID, engine, debug, marker) {
                // console.log("marker", marker);
                // console.log('renderToken', {value:v, tokenID, tokens: tokens.slice(0)})
                let lt = tokens.shift();
                let n = null;
                if (tokenID) {
                    let _clname = getClass(tokenID);
                    if (typeof(document) != 'undefined'){
                    n = document.createElement('span');
                    n.className = _clname;
                    n.innerHTML = v;
                    if (marker?.className) {
                        n.classList.add(marker.className);
                    }
                    return n.outerHTML;
                    } else {

                        if (marker?.className) {
                            _clname += ' '+marker.className;
                        }
                        let sb = '<span class=\"'+_clname+'\">'+v+'</span>';
                        return sb;
                    }
                }
                if (/^symbol\./.test(lt)) {
                    v = v.replace("<", "&lt;").replace(">", "&gt;");
                    return '<span class="s symbol">' + v + '</span>';
                }
                return v;
            },
            newLine(){
                console.log('bind extra line');
            },
            appendExtraOutput({output}){
                console.log('bind extra line');
                // output.push('|---|');
            },
            store({ output, buffer, depth, tabStop, formatterBuffer }) {
                if (_self.info.isSubFormatting){
                    output.push(buffer);
                    return;
                }
                let _line_counter = 0;
                let _buffer_id = formatterBuffer.id;
                let _const_cant_store = _buffer_id != '_save_buffer_';
  
                const store_buffer = function(buffer){
                    if (buffer.length==0){
                        return;
                    }
                    if (depth > 0) {
                        buffer = '</div><div class="line"><span>' + ("&nbsp;".repeat(4)).repeat(depth) + '</span>' + buffer;
                        sbuffer = true;
                    } else { 
                        buffer = (sbuffer ? '</div>' : '') + '<div class="line">' + buffer+'</div>'; 
                        sbuffer = false;
                    }
                    if (_const_cant_store){
                        _buffers.push(buffer);
                    }
                    _line_counter++;
                    output.push(buffer);
                }
                const r = output.slice(0);
                output.length = 0;
                r.push(buffer);
                r.forEach(store_buffer);
                // if (_const_cant_store){
                //     output.length = 0;
                //     _def._maxLineCount += _line_counter;
                // }

                //output = _buffers;
            },
            startNewBlock(a) {
            }
        };
        Object.defineProperty(_def, 'bufferList', {get(){
            return _buffers;
        }});
        return _r_def;
    }
}
exports.webStyleClass = webStyleClass;
exports.InitLine = InitLine;
exports.webFormattingListener = webFormattingListener;