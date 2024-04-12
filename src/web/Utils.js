"use stricts";
Object.defineProperty(exports, '__esModule', { value: true });

const { FormatterCloseParentInfo } = require("../lib/FormatterCloseParentInfo");
const _utils = require("../lib/Utils")
 

const { Patterns, CaptureInfo, Debug } = _utils.Utils.Classes;

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

class ExtraFormatterCloseParentInfo extends FormatterCloseParentInfo{
    className;
    tokenID
    getClass(){
        return getClass(this.tokenID);
    }
}
class ExtraPattern extends Patterns{
    className;
    _initRef(a){
        super._initRef(a);
        if (!a.className && this.className){
            a.className = this.className;
        }
    }
}
class ExtraCapture extends CaptureInfo{
    className
    constructor(q){
        super(q); 
    }
}
const webStyleClass = {
    patternClassName: ExtraPattern,
    captureInfoClassName: ExtraCapture,
    closeParentInfoClassName: ExtraFormatterCloseParentInfo
};

/**
 * webFormattingListener - 
 * @param {*} _def 
 * @returns 
 */
function webFormattingListener(_def) {
    _def._maxLineCount = 0;
    // + | define global map
    _def.globalClassMap = {
        'comment':1,
        'constant':1,
        'line':1,
        'number':1,
        'operator':1,
        'reserver-word':1,
        'string':1,
        'symbol':1
    };
    return function () {
        let blocks = [];
        let sbuffer = false;
        let _lineCount = 0;
        let _self = this;
        let _r_def = {
            endOutput({lineFeed}){
                return '';
            },
            endContent(){
                return "";
            },
            appendConstant({_inf, update, data, patternInfo}){
                if (data.trim().length == 0){
                    if (patternInfo.isBlock && (patternInfo.childs.length==0))
                    return;
                } 
                update(); 
            }, 
            renderToken(v, tokens, tokenID, engine, debug, marker) {                
                debug && Debug.log('renderToken', {value:v, tokenID, tokens: tokens.slice(0)})
                if (v.length==0){
                    return '';
                }
                let lt = tokens.shift();
                let n = null;
                let _clname = '';
                let _map = {};
                if (tokenID) {
                    _map[tokenID] = 1;
                    _def.globalClassMap[tokenID] = 1;
                }
                if (marker?.className){
                    marker.className.split(' ').forEach(a=>{
                       if(a.trim().length==0)return;
                        _map[a]=1;
                        if (!(a in _def.globalClassMap))
                            _def.globalClassMap[a] = 2;
                    });
                }
                if (/^symbol\./.test(lt)) {
                    v = v.replace("<", "&lt;").replace(">", "&gt;");
                    _map['s']=1;
                    _map['symbol']=1; 
                }
                if (/^constant\.color/.test(lt)){
                    v = "<div class=\"inline-color\" style=\"display:inline-block; margin: 0 4px; background-color:"+v+"; width:8px; height:8px;\"></div>"+v;
                }
                _clname = Object.keys(_map).join(' ');
                if (_clname.length==0){
                    return v;
                }
                    if (typeof(document) != 'undefined'){
                    n = document.createElement('span');
                    n.className = _clname;
                    n.innerHTML = v;
                    
                    return n.outerHTML;
                    } else {
                        if (_clname.length>0){
                            _clname = " class=\""+_clname+"\"";
                        }
                        let sb = '<span'+_clname+'>'+v+'</span>';
                        return sb;
                    }  
            },
            newLine(){
                console.log('bind:newLine');
            },
            appendExtraOutput({output}){ 
                // + | just push and extra value to join on render
                output.push('');
            },
            treatOutput({output, lineFeed, tabStop}){
                const l = [];

                output.forEach((m)=>{
                    m.split("\n").forEach(_l=>{
                        //if (_l.length==0) return; // 
                        _l = "<div class=\"line\">"+_l;
                        _l+= "</div>";
                        l.push(_l);
                        _def._maxLineCount++;
                    });
                });
                return l.join(lineFeed).trimEnd();
            },
            output({ buffer, output, lineFeed, flush, _ctx }){    
                let l = '';
                //if (output.length>0)
                    l =  output.join(lineFeed);

                return l;
            },
            /**
             * store what is in the buffer to output
             * @param {*} param0 
             */
            store({ output, buffer, depth, tabStop, formatterBuffer }) {
                
                const store_buffer = function(buffer){
                    if (buffer.length==0){
                        return;
                    }
                    if (depth > 0) {
                        buffer = '<span>' + ("&nbsp;".repeat(4)).repeat(depth) + '</span>' + buffer;
                    } else { 
                        buffer = buffer; 
                    } 
                    output.push(buffer);
                }
                const r = [buffer]; 
                r.forEach(store_buffer); 
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