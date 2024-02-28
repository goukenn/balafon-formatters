"use strict";
Object.defineProperty(exports, '__esModule', { value: true });
const { Debug } = require("./Debug");
const { Patterns } = require("./Patterns");
const { Utils } = require("./Utils");
class FormatterListener { 
    objClass = null;
    
    /**
     * object to treat be data before adding it to buffer 
     */
    treatBuffer;

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
     * call to add a new block
     */
    startNewBlock(marker){ 
        const o = this.objClass;
        if (!o) return;
        let d = o.depth
        o.output.length = 0;
        o.output.push('');
        o.output.push(o.tabStop.repeat(d));
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
     * append or transform value to buffer. at end on string manipulation 
     * @param {string} s 
     * @param {Patterns} _marker 
     * @returns 
     */
    append(s, _marker, endCapture=false) {
        let _o = this.objClass;
        if (!_o) return;
        if (s.length == 0) return;

        if (_marker) {
            // let a = `<span class="tk s">${s}</span>`;
            _o.debug && Debug.log({ tokenID: _marker.tokenID, value: s , name: _marker.name});
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
        // + | 
        _o.debug &&  Debug.log('append: ' + s);
    
        if (_o.buffer.length > 0) {
            // join expression with single space
            let _trx = new RegExp("^\\s+(.+)\\s+$");
            s = s.replace(_trx, ' ' + s.trim() + ' ');
        }

        if (_o.lineJoin) {
            if (!_o.noSpaceJoin) {
                _o.buffer = _o.buffer.trimEnd() + ' ';
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
     * treat current buffer and store it to option 
     * buffer to ouput . 
     */
    store({buffer, output, depth, tabStop}) { 
        let s = buffer;
        let d = depth;
        s = s.trim();
        if (s.length > 0){
            let _tab = d > 0 ? tabStop.repeat(d) : '';
            output.push(_tab + s);
        } 
    }
    output(clear, {output, lineFeed}) { 
        let _s = output.join(lineFeed);
        if (clear) {
            output = [];
        }
        return _s;
    }
    appendLine() {
        const _o = this.objClass;
        if (_o.output.length > 0) {
            _o.output[_o.output.length - 1] += _o.lineFeed;
        }
    }


    treat
}

exports.FormatterListener = FormatterListener;