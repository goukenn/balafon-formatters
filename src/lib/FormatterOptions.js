"use strict";
Object.defineProperty(exports, 'enModule', { value: true });

const { PatternMatchInfo } = require("./PatternMatchInfo");
const { Utils } = require("./Utils");
const { Debug } = require("./Debug");

/**
 * @typedef FormatterOptions
 * @funcion newBuffer  
 */

/**
 * class used to expose formatter option 
 * @property blockStart flags to indicate block is started on document . need to reset on format focument
 */
class FormatterOptions {
    line = '';
    pos = 0;
    lineCount = 0;
    continue = false;
    lineJoin = false;
    markerDepth = 0; // store handleMarker stack
    /**
     * store global output result 
     */
    // output = [];   // output result global output result 
    tokenList = [];// store entry token list
    state = ''; // current state mode 
    range = {
        start: 0, // start position
        end: 0    // number end position range
    };
    /**
     * flag for glue value : used to skip entry data for match.
     */
    glueValue = null;
    constructor(_formatter, _formatterBuffer, _listener, m_constants_def, _rg) {
        const { debug } = _formatter;
        const { lineFeed, tabStop } = _rg;
        let m_depth = _rg.depth || 0;
        let m_pos = 0;
        let _blockStarted = false;
        const _bufferState = [];
        const _markerInfo = [];
        const _states = [];
        const { CaptureRenderer, FormatterBuffer, Debug } = Utils.Classes;
        let m_appendToBufferListener = null;
        let _outputBufferInfo = {
            line: 0,
            start: 0,
            end: 0,
            /**
             * update number information
             * @param {number} lineCount number info
             */
            updateLine(lineCount) {
                this.line = lineCount;
                this.start = this.end = 0;
            },
            /**
             * update range
             * @param {number} start 
             * @param {undefined|number} end 
             */
            updateRange(start, end) {
                this.start = start;
                this.end = typeof (end) == 'undefined' ? start : end;
            }
        }
        const objClass = this;
        // inject setting property
        for (let i in _rg) {
            if (['depth', 'line'].indexOf(i) != -1) {
                continue;
            }
            Object.defineProperty(this, i, {
                get() {
                    return _rg[i];
                }
            });
        }
        this.resetRange = function () {
            this.storeRange(0, 0);
        }
        this.storeRange = function (start, end) {
            this.range.start = start;
            this.range.end = typeof (end) == 'undefined' ? start : end;
        }
        Object.defineProperty(objClass, 'listener', { get: function () { return _listener; } })
        Object.defineProperty(objClass, 'formatter', { get: function () { return _formatter; } }) 
        Object.defineProperty(objClass, 'formatterBuffer', { get: function () { return _formatterBuffer; } })
        Object.defineProperty(objClass, 'blockStarted', {
            get: function () { return _blockStarted; }, set(v) {
                _blockStarted = v;
            }
        });
        Object.defineProperty(objClass, 'buffer', { get: function () { return _formatterBuffer.buffer; } })
        Object.defineProperty(objClass, 'outputBufferInfo', { get() { return _outputBufferInfo; } })
        Object.defineProperty(objClass, 'tokenChains', {
            get() {
                const _tokens = _formatter.getTokens();
                let r = _tokens;
                if (this.tokenList?.length > 0) {
                    r = this.tokenList.concat(_tokens);
                }
                return r;
            }
        });
        Object.defineProperty(objClass, 'length', { get: function () { return this.line.length; } })
        // Object.defineProperty(objClass, 'tabStop', { get: function () { return tabStop; } })
        // Object.defineProperty(objClass, 'lineFeed', { get: function () { return lineFeed; } })
        Object.defineProperty(objClass, 'debug', { get: function () { return debug; } })
        Object.defineProperty(objClass, 'markerInfo', { get: function () { return _markerInfo; } })
        Object.defineProperty(objClass, 'constants', { get: function () { return m_constants_def; } })
        Object.defineProperty(objClass, 'pos', {
            get: function () { return m_pos; }, set(v) {
                // console.log("set position", v);
                m_pos = v;
            }
        });
        /**
         * append to buffer listener callback
         * @var {null|(value:string)} 
         */
        Object.defineProperty(objClass, 'appendToBufferListener', {
            get: function () { return m_appendToBufferListener; }, set(v) { 
                m_appendToBufferListener = v;
            }
        });
        Object.defineProperty(objClass, 'output', {
            get: function () { return _formatterBuffer.output; },
        });
        Object.defineProperty(objClass, 'depth', {
            get() { return m_depth; },
            /**
             * set the depth
             * @param {number} v depth 
             */
            set(v) {
                m_depth = v;
            }
        });
        objClass.getLineRangeContent = function () {
            const q = this;
            return q.line.substring(q.range.start, q.range.end);
        };
        objClass.unshiftMarker = (o) => {
            _markerInfo.unshift(o);
        };
        objClass.shiftMarker = () => {
            return _markerInfo.shift();
        };
        objClass.empty = empty;

        function empty(l) {
            return (!l && l.length == 0)
        }
        function is_emptyObj(q) {
            return Object.keys(q).length == 0
        }
        function pushState() {
            let _keys = Object.keys(objClass);
            let _state = {};
            _keys.forEach(i => {
                let t = typeof (objClass[i]);
                if (/function|object/.test(t))
                    return;
                let _i = Object.getOwnPropertyDescriptor(objClass, i);
                if (!_i || (_i.get && _i.set)) {
                    _state[i] = objClass[i];
                }
            })
            _states.unshift({ ..._state });
        }
        function popState() {
            let s = _states.shift();
            if (s) {
                for (let i in s) {
                    objClass[i] = s[i];
                }
            }
        }

        objClass.pushState = pushState;
        objClass.popState = popState;
        /**
         * treat how to update the current buffer before add it to listener
         * @param {string} s 
         * @param {*} value 
         * @param {*} _marker 
         * @returns new buffer value
         */
        objClass.updateBufferValue = function (s, value, _marker) {
            // allow listener to treate buffer value
            // + | tranform before update 
            if (empty(value)) {
                return s;
            }
            const { listener } = this;
            if (listener?.joinBuffer) {
                return listener.joinBuffer(s, value, _marker);
            }
            return this.joinBuffer(s, value);
        };

        objClass.joinBuffer = function (buffer, value) {
            const { lineJoin, noSpaceJoin } = this;
            let s = buffer;
            if (lineJoin) {
                let join = ' ';
                if (noSpaceJoin) {
                    join = '';
                }
                s = [s.trimEnd(), value.trimStart()].join(join);
                this.lineJoin = false;
            } else {
                s += value;
            }
            return s;
        }
        function _shiftMarkerInfo(marker, tokenChains) {
            if (_formatter.isSpecialMarker(marker)) {
                if ((typeof (marker.shiftIdConstant) == 'function') && marker.shiftIdConstant())
                    tokenChains.shift();
            }
        }
        /**
         * append to buffer
         * @param {string} value 
         * @param {PatternMatchInfo} _marker 
         * @param {*} _marker 
         */
        objClass.appendToBuffer = function (value, _marker, treat = true) {
            const { debug, engine } = this;
            debug && Debug.log("[append to buffer] - ={" + value + '}');
            let _buffer = value;
            if (m_appendToBufferListener){
                value = m_appendToBufferListener(value, _marker, treat, this);
            }
            else{ 
                const { listener, tokenChains } = this;
                if (treat && listener?.renderToken) {
                    _shiftMarkerInfo(_marker.marker, tokenChains); 
                    _marker.name && tokenChains.unshift(_marker.name);
                    _buffer = listener.renderToken(_buffer, tokenChains, _marker.tokenID, engine, debug, _marker);
                }
                this.formatterBuffer.appendToBuffer(_buffer);
            }
            _marker.value = { source: value, value: _buffer };
        }
        /**
         * treat begin captures
         * @param {*} _marker 
         * @param {*} matches 
         * @returns 
         */
        objClass.treatBeginCaptures = function (patternInfo) {
            const { marker, group } = patternInfo;
            // + | do capture treatment 
            let _cap = { ...marker.captures, ...marker.beginCaptures };
            if (is_emptyObj(_cap)) {
                return;
            }
            // + | clone and reset indices before generate  
            let _s = CaptureRenderer.CreateFromGroup(group, marker.name);
            if (_s) {
                let _g = _s.render(this.listener, _cap, false, this.tokenChains,  this);
                patternInfo.startOutput = _g;
                return _g;
            }
            return null; // this.treatCaptures(_cap, marker, group);
        };
        objClass.treatEndCaptures = function (markerInfo, endMatch) {
            let _cap = { ...markerInfo.captures, ...markerInfo.endCaptures };
            if (is_emptyObj(_cap)) {
                return endMatch[0];
            }
            const { marker, group } = markerInfo;
            const { debug } = this;
            const q = this;
            const fc_handle_end = function (value, cap, id, listener, option) {
                const { tokens, engine, debug, tokenID } = option;
                if (cap.patterns) {
                    value= Utils.TreatPatternValue(value, cap.patterns, markerInfo.group, q); 
                } else {
                    // treat buffer marker 
                    const op = [];
                    value = _formatter.treatMarkerValue(cap, value, op);
                    value = listener.renderToken(value, tokens, tokenID, engine, debug, cap);
                }
                return value;

            };
            debug && Debug.log('::TreatEndCapture:: #' + marker.name);
            let _s = CaptureRenderer.CreateFromGroup(endMatch, marker.name);
            if (_s) {
                const q = this;
                let _g = _s.render(this.listener, _cap, fc_handle_end, this.tokenChains,
                    this
                );
                markerInfo.endOutput = _g;
                return _g;
            }
            return null; //this.treatCaptures(_cap, marker, endMatch);
        }
        function getRenderOption(q) {
            return {
                debug: q.debug,
                engine: q.engine,
                formatter: _formatter
            };
        }

        /**
         * deprecated use only renderer to treat value 
         * @param {*} _cap 
         * @param {*} _marker 
         * @param {*} endMatch 
         * @deprecated
         * @returns 
         */
        objClass.treatCaptures = function (_cap, _marker, endMatch) {
            // let transformed = _marker.endRegex(_marker.group); 
            // use replaceWith to change the value at specied capture 
            let list = [];
            list.markers = {};
            let prop = null;
            for (let i in _cap) {
                list.push(i);
                let d = _cap[i];
                if (!(i in endMatch)) {
                    _formatter.pushError(101);
                    continue;
                }
                let value = endMatch[i];


                if (d.transform) {
                    value = Utils.StringValueTransform(value, d.transform);
                }
                if (d.name) {
                    prop = new NameOnlyConstantPattern();
                    prop.name = d.name;
                    list.markers[i] = {
                        marker: prop,
                        value: value
                    };
                }
                endMatch[i] = value;
            }
            return list;
        }

        /**
         * move to this location
         * @param {number} newPosition 
         */
        objClass.moveTo = function (newPosition) {
            this.pos = newPosition;
        }
        objClass.restoreBuffer = function ({ state }) {
            _formatterBuffer = state.formatterBuffer;
        };
        objClass.newBuffer = function (id) {
            _formatterBuffer = new FormatterBuffer;
            _formatterBuffer.id = id;
        };
        objClass.saveBuffer = function () {
            _bufferState.push({
                output: this.output,
                formatterBuffer: this.formatterBuffer
            });
            this.newBuffer('_save_buffer_');
        };
        objClass.restoreSavedBuffer = function () {
            let buffer = _bufferState.pop();
            if (buffer) {
                this.restoreBuffer({ state: buffer });
            }
        }


        objClass.store =
            /**
             * store and clear formatter buffer  
             * @param {bool} startBlock 
             */
            function (startBlock = false) {
                const { listener } = this;
                if (listener) {
                    const _ctx = this;
                    const { buffer, output, depth, formatterBuffer } = _ctx;
                    listener.store.apply(null, [{ buffer, output, depth, tabStop, formatterBuffer, _ctx, startBlock }]);
                }
                _formatterBuffer.clear();
            }

        objClass.flush =
            /**
           * flush with what is in the buffer - and clear buffer 
           * @param {bool} clear 
           * @returns 
           */
            function (clear) {
                const _ctx = this;
                const { buffer, output, listener } = _ctx;
                let l = '';
                if (listener?.output) {
                    l = listener.output.apply(null, [clear, { buffer, output, lineFeed, _ctx }]);
                } else {
                    l = this.output.join(lineFeed);
                }
                //+| clear output and buffer 
                if (clear) {
                    this.formatterBuffer.clear();
                    output.length = 0;
                }
                return l;
            }
        objClass.appendLine = function () {
            const { listener } = this; const { lineFeed } = _formatter.settings;
            if (listener) {
                return listener.appendLine(lineFeed,
                    this.formatterBuffer, {
                    store: () => {
                        this.store();
                    }
                });
            } else {
                return _formatter.appendToBuffer(lineFeed);
            }
        };
    }
    storeAndUpdateBuffer() {
        this.store();
        let _buffer = this.flush(true);
        if (_buffer.length > 0) {
            this.formatterBuffer.appendToBuffer(_buffer);
        }
    }
    /**
     * store current buffer to output
     * @param {*} useDepth 
     * @param {*} blockStarted 
     */
    storeToOutput({ buffer = null, useDepth = false, blockStarted = false, clear = false }) {
        buffer = buffer || this.buffer;
        if (buffer && (buffer.length > 0)) {
            if (useDepth)
                this.store(blockStarted);
            else {
                let l = this.buffer;
                if (l.length) {
                    this.output.push(l);
                }
            }
        }
        if (clear) {
            this.formatterBuffer.clear();
        }
    }
    appendExtaOutput() {
        this.debug && Debug.log('append extra output');
        this.output.push('');
    }
}



exports.FormatterOptions = FormatterOptions;