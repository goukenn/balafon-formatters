"use strict";
Object.defineProperty(exports, '__esModule', { value: true });
const { Debug } = require("./Debug");
const { Patterns } = require("./Patterns");
const { Utils } = require("./Utils");
class FormatterListener {  

    constructor() {
        var m_lastToken;
        /**
         * get last evaluated marker
         */
        Object.defineProperty(this, 'lastMarker', { get() { return m_lastToken } }); 
        this.setLastMarker = function (token) {
            m_lastToken = token;
        };
    }
    /**
     * append new line to buffer
     * @param {string} line_feed 
     * @param {FormatterBuffer} buffer 
     */
    appendLine(line_feed, buffer){
        buffer.appendToBuffer(line_feed);
    }
    /**
     * call to add a new block
     * @var {{formatterBuffer: FormatterBuffer, tabStop:string, depth:number}} param
     */
    startNewBlock({formatterBuffer, tabStop, depth}){ 
         
    } 
    
    /**
     * treat current buffer and store it to option 
     * buffer to ouput . 
     */
    store({buffer, output, depth, tabStop, startBlock}) { 
        let s = buffer;
        let d = depth; 
        if (s.length > 0){
            if (startBlock){
                output.unshift('');
            }
            let _tab = d > 0 ? tabStop.repeat(d) : '';
            output.push(_tab + s);
        } 
    }
    /**
     * use this to join buffer output
     * @param {bool} clear 
     * @param {{output:string[], lineFeed:string}} param1 
     * @returns {string}
     */
    output(clear, {output, lineFeed}) { 
        let _s = output.join(lineFeed);
        if (clear) {
            output = [];
        }
        return _s;
    }  
    /**
     * transform value depending on token definition 
     * @param {string} value 
     * @param {null|string|string[]} tokens 
     * @param {null|string} tokenID 
     * @param {null|FormatterEngine} engine 
     * @param {?bool} debug 
     * @param {*} marker parent marker  
     * @returns {string}
     */
    renderToken(value, tokens, tokenID, engine, debug, marker){

        debug && Debug.log("render token", 0, {tokens,tokenID, value});
        if (engine){
            return engine.renderToken(value, tokens, tokenID, marker);
        }
        // let _t = tokens.shift();
        // if (_t=='tagname.html'){
        //     return '<span class="s tag">'+value+'</span>';
        // }
        // if (/^symbol\./.test(_t)){
        //     value = value.replace("<", "&lt;").replace(">","&gt;");
        //     return '<span class="s symbol">'+value+'</span>';
        // }
        // let fc = {string(v){
        //     return '<span class="s string">'+v+'</span>';
        // }}[tokenID];
        // if (fc){
        //     return fc(value, tokens, tokenID )
        // }
        //this.setLastMarker(tokenID); 
        return value;
    } 
}

exports.FormatterListener = FormatterListener;