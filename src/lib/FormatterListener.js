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
    appendLine(line_feed, buffer, option){
        option.saveBuffer();
        option.appendExtraOutput();
        const _cbuffer = option.flush(true);
        option.restoreSavedBuffer();
        buffer.appendToBuffer(_cbuffer);
    }
    /**
     * call to add a new block
     * @var {{formatterBuffer: FormatterBuffer, tabStop:string, depth:number}} param
     */
    startNewBlock({formatterBuffer, tabStop, depth}){ 
         // override to mark start new block
    } 
    /**
     * override en output
     * @param {*} param0 
     */
    endOutput({lineFeed}){

    }
    /**
     * override end content
     */
    endContent(){

    }
    /**
     * treat current buffer and store it to option 
     * buffer to ouput . 
     */
    store({buffer, data, output, dataOutput, depth, tabStop, startBlock}) { 
        let s = buffer;
        let d = depth; 
        if (s.length > 0){
            if (startBlock){
                output.unshift('');
                dataOutput.unshift('');
            }
            let _tab = d > 0 ? tabStop.repeat(d) : '';
            output.push(_tab + s);
            dataOutput.push(_tab+data);
        } 
    }
    /**
     * use this to join everything that as represent in buffer with the lineFeed data
     * @param {bool} clear 
     * @param {{output:string[], lineFeed:string}} param1 
     * @returns {string}
     */
    output({output, lineFeed}) { 
        let _s = output.join(lineFeed); 
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
    renderToken(value, tokens, tokenID, engine, debug, marker, option){
        const { FormatterToken } = Utils.Classes;
        const rt = new FormatterToken();
        rt.tokens = tokens;
        rt.tokenID = tokenID;
        rt.value =  value;
        option.lastToken = rt;
        debug?.feature("render-token") && Debug.log("render token", JSON.parse(JSON.stringify(rt)));
        if (engine){
            return engine.renderToken(value, tokens, tokenID, marker);
        } 
        return value;
    } 
}

exports.FormatterListener = FormatterListener;