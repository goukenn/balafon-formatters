"use strict";
Object.defineProperty(exports, '__esModule', { value: true });
const { Debug } = require("./Debug");
const { Patterns } = require("./Patterns");
const { Utils } = require("./Utils");
class FormatterListener {
    markerInfo = []; // store marker field info [{ marker:Pattern, buffer:string}]
    objClass = null;


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
     * treat buffer before send and matching
     * @param {*} _marker 
     * @param {*} p 
     * @param {*} endRegex 
     * @param {*} buffer 
     * @returns 
     */
    treatEndBufferCapture(_marker, p, endRegex, buffer){
        const { endCaptures } = _marker;
        if (endCaptures){
            for(let i in endCaptures){
                let _def = _marker.endCaptures[i];
                if ((i==0) && _def.nextTrimWhiteSpace){
                    buffer = buffer.trimEnd();
                } 
            }
        }
        return buffer;
    }

    treatEndCapture(_marker, p, endRegex){
        const { endCaptures } = _marker;
        if (endCaptures){
            for(let i in endCaptures){
                let _def = _marker.endCaptures[i]; 
                if (_def.nextTrimWhiteSpace){
                    this.objClass.buffer = this.objClass.buffer.trimEnd();
                }
            }
        }
        return p;
    }
    treatBeginCapture(_marker, p){
        // To Treat capture
    }
    /**
     * treat value before append
     * @param {} _marker 
     * @param {*} s 
     * @returns 
     */
    treatValue(_marker, s, endCapture=false) {
        let _last = this.lastMarker;
        if (_last){
            if (_last.nextTrimWhiteSpace){

                this.objClass.buffer = this.objClass.buffer.trimEnd();
            }
        }
        // if (_marker.captures){

        // }
        if (endCapture && _marker.endCaptures){
            for(let i in _marker.endCaptures){
                let _def = _marker.endCaptures[i];
                if ((i==0) && _def.nextTrimWhiteSpace){
                    this.objClass.buffer = this.objClass.buffer.trimEnd();
                }
            }
        }

       
        if (_marker.replaceWith && _marker.match) {
            let gp = Utils.GetRegexFrom(_marker.replaceWith.toString(), _marker.group);
            gp = gp.toString().substring(1).slice(0, -1);
            s = s.replace(_marker.match, gp);
        }
        if (_marker.tokenID) {
            this.setLastMarker(_marker);
        }
        return s;
    }
    /**
     * append 
     * @param {string} s 
     * @param {Patterns} _marker 
     * @returns 
     */
    append(s, _marker, endCapture=false) {
        let _o = this.objClass;
        if (!_o) return;
        if (s.length == 0) return;

        if (_marker) {
            let a = `<span class="tk s">${s}</span>`;
            _o.debug && Debug.log({ tokenID: _marker.tokenID, value: s });
            s = this.treatValue(_marker, s, endCapture);
        }

        if (_marker && _marker.isBlockDefinition) {
            if (!_o.blockOnSingleLine && (_o.buffer.length > 0)) {
                this.store();
            }
        }


        //+ | transform multi-space to single space
        if (!_marker)
            s = s.replace(/\s+/g, ' ');
        else if (_marker.lineFeed) {
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
            if (!_o.noSpaceJoin) {
                _o.buffer = this.objClass.buffer.trimEnd() + ' ';
            }
            _o.lineJoin = false;
        }
        _o.buffer += s;

        if (_marker && _marker.lineFeed) {
            this.store();
        }
    }
    /**
     * 
     * @param {string} s append pattern
     * @param {Patterns} _marker marker pattern
     */
    appendAndStore(s, _marker, endCapture=false) {
        this.append(s, _marker, endCapture);
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
    appendLine() {
        const _o = this.objClass;
        if (_o.output.length > 0) {
            _o.output[_o.output.length - 1] += _o.lineFeed;
        }
    }
}

exports.FormatterListener = FormatterListener;