"use strict";
Object.defineProperty(exports, '__esModule', {value:true});
const { Debug } = require("./Debug");
const { Patterns } = require("./Patterns");
class FormatterListener{
    markerInfo= []; // store marker field info [{ marker:Pattern, buffer:string}]
    objClass= null;
    /**
     * append 
     * @param {string} s 
     * @param {Patterns} _marker 
     * @returns 
     */
    append(s, _marker) {
        let _o = this.objClass;
        if (!_o) return;
        if (s.length == 0) return;

        if (_marker && _marker.isBlockDefinition){
            if (!_o.blockOnSingleLine && (_o.buffer.length>0)){
                this.store();
                // _o.output.push('');
            } 
        }   


        //+ | transform multi-space to single space
        if (!_marker)
            s = s.replace(/\s+/g,' ');
        else if(_marker.lineFeed){
            _o.buffer = this.objClass.buffer.trimEnd();
        }
        if (_o.debug) {
            Debug.log('append: ' + s);
        }
        if (_o.buffer.length > 0) {
            // join expression with single space
            let _trx = new RegExp("^\\s+(.+)\\s+$");
            s = s.replace(_trx, ' ' + s.trim() + ' ');
        }

        if (_o.lineJoin) {
            _o.buffer = this.objClass.buffer.trimEnd() + ' ';
            _o.lineJoin = false;
        }
        _o.buffer += s;

        if (_marker && _marker.lineFeed){
            this.store();
        }
    }
    /**
     * 
     * @param {string} s append pattern
     * @param {Patterns} _marker marker pattern
     */
    appendAndStore(s, _marker){
        this.append(s, _marker);
        this.store();
    }
    /**
     * store the current buffer.
     */
    store() {
        const _o = this.objClass;
        let s = _o.buffer;
        let d = _o.depth;
        s = s.trim();
        if (s.length > 0) {
            _o.output.push(_o.tabStop.repeat(d) + s);
        }
        _o.buffer = '';
    }
    output(clear) {
        const _o = this.objClass;
        let _s = _o.output.join(_o.lineFeed);
        if (clear) {
            _o.output = [];
        }
        return _s;
    } 
    appendLine(){
        const _o = this.objClass;
        if(_o.output.length>0){
            _o.output[_o.output.length-1] += _o.lineFeed;
        }
    }
}

exports.FormatterListener = FormatterListener;