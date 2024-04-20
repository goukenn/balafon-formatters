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
    /**
     * operate line
     * @var {string}
     */
    line = '';
    /**
     * store default source line
     * @var {string}
     */
    sourceLine = '';
    /**
     * position on operate line 
     */
    pos = 0;
    /**
     * current line cursor
     */
    lineCount = 0;
    
    continue = false;
    lineJoin = false;
    markerDepth = 0; // store handleMarker stack
    /**
     * flag to call on end of file
     */
    EOF = false;
    /**
     * flag to set on en of line
     */
    EOL = false;

    TOEND = false;
    /**
     * store global output result 
     */
    // output = [];   // output result global output result 
    tokenList = [];// store entry token list
    /**
     * line feed flag in order to store on next root operation
     * @var {?boolean} 
     */
    lineFeedFlag = false;
    state = ''; // current state mode 
    range = {
        start: 0, // start position
        end: 0    // number end position range
    };
    /**
     * get or set the current stream option
     */
    stream;
    /**
     * store chain of new created OldBuffers
     */
    newOldBuffers = [];

    /**
     * activate the hold buffer list 
     */
    holdBufferState = false;
    /**
     * flag for glue value : used to skip entry data for match.
     */
    glueValue = null;

    /**
     * flag formatter skip start empty line flag
     */
    skipEmptyMatchValue = false; 

    /**
     * next mode
     * @var {number}
     */
    nextMode = 1;

    /**
     * .ctr
     * @param {*} _formatter 
     * @param {*} _formatterBuffer 
     * @param {*} _listener 
     * @param {*} m_constants_def 
     * @param {*} _rg 
     */
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
        const option = this;
        let m_saveCount = 0;
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
        this.isRootFormatterBuffer = function (formatter_buffer) {
            return formatter_buffer === _formatterBuffer;
        }
        Object.defineProperty(option, 'isCurrentFormatterBufferIsRootBuffer', {
            get() {
                return this.isRootFormatterBuffer(this.formatterBuffer);
            }
        })
        Object.defineProperty(option, '_saveCount', { get: function () { return m_saveCount; } })
        Object.defineProperty(option, 'streamBuffer', { get: function () { return this.stream?.buffer; } })
        Object.defineProperty(option, 'listener', { get: function () { return _listener; } })
        Object.defineProperty(option, 'formatter', { get: function () { return _formatter; } })
        Object.defineProperty(option, 'formatterBuffer', { get: function () { return _formatterBuffer; } })
        Object.defineProperty(option, 'blockStarted', {
            get: function () { return _blockStarted; }, set(v) {
                _blockStarted = v;
            }
        });
        Object.defineProperty(option, 'buffer', { get: function () { return _formatterBuffer.buffer; } })
        Object.defineProperty(option, 'outputBufferInfo', { get() { return _outputBufferInfo; } })
        Object.defineProperty(option, 'tokenChains', {
            get() {
                const _tokens = _formatter.getTokens();
                let r = _tokens;
                if (this.tokenList?.length > 0) {
                    r = this.tokenList.concat(_tokens);
                }
                return r;
            }
        });
        Object.defineProperty(option, 'length', { get: function () { return this.line.length; } })
        // Object.defineProperty(objClass, 'tabStop', { get: function () { return tabStop; } })
        // Object.defineProperty(objClass, 'lineFeed', { get: function () { return lineFeed; } })
        Object.defineProperty(option, 'debug', { get: function () { return debug; } })
        Object.defineProperty(option, 'markerInfo', { get: function () { return _markerInfo; } })
        Object.defineProperty(option, 'constants', { get: function () { return m_constants_def; } })
        Object.defineProperty(option, 'pos', {
            get: function () { return m_pos; }, set(v) {
                m_pos = v;
            }
        });
        /**
         * append to buffer listener callback
         * @var {null|(value:string)} 
         */
        Object.defineProperty(option, 'appendToBufferListener', {
            get: function () { return m_appendToBufferListener; }, set(v) {
                m_appendToBufferListener = v;
            }
        });
        Object.defineProperty(option, 'output', {
            get: function () { return _formatterBuffer.output; },
        });
        Object.defineProperty(option, 'depth', {
            get() { return m_depth; },
            /**
             * set the depth
             * @param {number} v depth 
             */
            set(v) {
                m_depth = v;
            }
        });
        option.getLineRangeContent = function () {
            const q = this;
            return q.line.substring(q.range.start, q.range.end);
        };
        option.unshiftMarker = (o) => { 
            _markerInfo.unshift(o);
        };
        option.shiftMarker = () => { 
            return _markerInfo.shift();
        };
        option.empty = empty;

        function empty(l) {
            return (!l && l.length == 0)
        }
        function is_emptyObj(q) {
            return Object.keys(q).length == 0
        }
        function pushState() {
            let _keys = Object.keys(option);
            let _state = {};
            _keys.forEach(i => {
                let t = typeof (option[i]);
                if (/function|object/.test(t))
                    return;
                let _i = Object.getOwnPropertyDescriptor(option, i);
                if (!_i || (_i.get && _i.set)) {
                    _state[i] = option[i];
                }
            })
            _states.unshift({ ..._state });
        }
        function popState() {
            let s = _states.shift();
            if (s) {
                for (let i in s) {
                    option[i] = s[i];
                }
            }
        }

        option.pushState = pushState;
        option.popState = popState;
        /**
         * treat how to update the current buffer before add it to listener
         * @param {string} s 
         * @param {*} value 
         * @param {*} _marker 
         * @returns new buffer value
         */
        option.updateBufferValue = function (s, value, _marker) {
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

        option.joinBuffer = function (buffer, value) {
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
        function getTokenID(marker) {
            while (marker) {
                if (marker.tokenID) {
                    return marker.tokenID;
                }
                if (marker.fromGroup) {
                    if (marker.fromGroup.tokenID) {
                        return marker.fromGroup.tokenID;
                    }
                }

                marker = marker.parent;
            }
            return null;
        }
        /**
         * append to buffer
         * @param {string} value 
         * @param {PatternMatchInfo} _marker 
         * @param {?boolean} treat render token with listener  
         * @param {*} _marker 
         */
        option.appendToBuffer = function (value, _marker, treat = true, raise=true) {
            const { debug, engine } = this;
            debug && Debug.log("[append to buffer] - ={" + value + '}');
            let _buffer = value;
            if (value.length > 0) {
                if (m_appendToBufferListener) {
                    value = m_appendToBufferListener(value, _marker, treat, this);
                }
                else {
                    const { listener, tokenChains } = this;
                    if (treat && listener?.renderToken) {
                        _shiftMarkerInfo(_marker.marker, tokenChains);
                        // + | shift to token marker info 
                        (()=>{
                            // + | add extra to to token chains
                            _marker.name && !_marker.isShiftenName && tokenChains.unshift(_marker.name);
                            
                        })()
                        const tokenID = getTokenID(_marker);
                        _buffer = listener.renderToken(_buffer, tokenChains, tokenID, engine, debug, _marker);
                    }
                    this.formatterBuffer.appendToBuffer(_buffer);
                }
            }
            _marker.value = { source: value, value: _buffer };
            if (raise)
            _formatter.onAppendToBuffer(_marker, _buffer, option);
        }

        /**
         * treat begin captures
         * @param {*} _marker 
         * @param {*} matches 
         * @returns 
         */
        option.treatBeginCaptures = function (patternInfo) {
            const { marker, group } = patternInfo;
            const { formatter } = this;
            // + | do capture treatment 
            let _cap = { ...marker.captures, ...marker.beginCaptures };
            if (is_emptyObj(_cap)) {
                return;
            }
            const _capKeys = Object.keys(_cap);
            let _s = null;
            // if ((_capKeys.length == 1) && (0 in _cap)){
            //     const op = [];
            //     _s = CaptureRenderer.CreateFromGroup( group, marker.name);

            //     let mm = _s.render(this.listener, _cap, false, this.tokenChains,  this);
            //     console.log(new_g, "data: ");

            // }
            // + | use capture to treat and pattern to continue reading
            // + | clone and reset indices before generate  
            _s = CaptureRenderer.CreateFromGroup(group, marker.name);
            if (_s) {
                let _g = _s.render(this.listener, _cap, false, this.tokenChains, this);
                patternInfo.startOutput = _g;
                return _g;
            }
            return null; // this.treatCaptures(_cap, marker, group);
        };
        option.treatEndCaptures = function (markerInfo, endMatch) {
            let _cap = { ...markerInfo.captures, ...markerInfo.endCaptures };
            if (is_emptyObj(_cap)) {
                return endMatch[0];
            }
            const { marker } = markerInfo;
            const { debug } = this;
            const q = this;
            const fc_handle_end = function (value, cap, id, listener, option) {
                const { tokens, engine, debug, tokenID } = option;
                if (cap.patterns) {
                    value = Utils.TreatPatternValue(value, cap.patterns, markerInfo.group, q);
                } else {
                    // treat buffer marker 
                    const op = [];
                    value = _formatter.treatMarkerValue(cap, value, op);
                    value = listener.renderToken(value, tokens, tokenID, engine, debug, cap);
                }
                return value;

            };
            debug && Debug.log('--:::TreatEndCapture:::--' + marker.name);
            let def = endMatch;
            if ((endMatch[0].length==0) && (_cap)&&(endMatch.input.length>0)){
             
                const p = Utils.GetNextCapture(endMatch.input, markerInfo.endRegex);
                p.index = endMatch.index; 
                p.indices = [[0, p[0].length]];
                def = p;
            } 
            let _s = CaptureRenderer.CreateFromGroup(def, marker.name);
            if (_s) { 
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
        option.treatCaptures = function (_cap, _marker, endMatch) {
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
        option.moveTo = function (newPosition) {
            this.pos = newPosition;
        }
        /**
         * restore buffer 
         * @param {*} param0 
         */
        option.restoreBuffer = function ({ state }) {
            _formatterBuffer = state.formatterBuffer;
        };
        option.newBuffer = function (id) {
            _formatterBuffer = new FormatterBuffer;
            _formatterBuffer.id = id;
        };
        option.saveBuffer = function () {
            m_saveCount++;
            _bufferState.push({
                output: this.output,
                formatterBuffer: this.formatterBuffer
            });
            this.newBuffer('_save_buffer_');
        };
        option.restoreSavedBuffer = function () {
            let buffer = _bufferState.pop();
            if (buffer) {
                this.restoreBuffer({ state: buffer });
                m_saveCount--;
            }
        }


        option.store =
            /**
             * store and clear formatter buffer  
             * @param {bool} startBlock 
             */
            function (startBlock = false) {
                const _ctx = this;
                const { buffer, output, depth, formatterBuffer, listener } = _ctx;
                if (listener) {
                    listener.store.apply(null, [{ buffer, output, depth, tabStop, formatterBuffer, _ctx, startBlock }]);
                }
                _formatterBuffer.clear();
            }

        option.flush =
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
                    l = listener.output.apply(null, [{ buffer, output, lineFeed, _ctx }]);
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
        option.appendLine = function () {
            const { listener } = this; 
            const { lineFeed } = _formatter.settings;
            if (listener) {
                return listener.appendLine(lineFeed,
                    this.formatterBuffer, this, {
                    store: () => {
                        this.store();
                    }
                });
            } else {
                return _formatter.appendToBuffer(lineFeed, this);
            }
        };
    }

    /**
     * reset flags definition
     */
    reset(){
        this.lineJoin = 
        this.skipEmptyMatchValue = 
        this.holdBufferState = 
        this.EOF=
        this.EOL=
        this.startLine=
        this.lineFeedFlag=
        false;
        this.glueValue = null;
        this.lineCount = 0;
        this.markerDepth = 0;
        this.nextMode = 1;

    }
    cleanNewOldBuffers() {
        const option = this;
        if (this.holdBufferState && option.newOldBuffers.length > 0) {
            // On this Process handling clean all new Buffers
            let count = option.newOldBuffers.length;
            while (count > 0) {
                let tq = option.shiftMarker();
                let q = option.newOldBuffers.pop();
                if (tq !== q) {
                    throw new Error('invalid configuration');
                }
                count--;
                let bf = option.buffer;
                option.restoreBuffer(q);
                if (bf.length > 0) {
                    option.appendToBuffer(bf);
                }
            }
        }
    }
    /**
     * shift and restore from
     * @param {*} from 
     * @param {*} throwError 
     * @returns 
     */
    shiftAndRestoreFrom(from, throwError){
        const option = this;
        let _old = option.shiftFromMarkerInfo(from, throwError);
        if (_old) {
            // unshif and restore buffer 
            let _rbuffer = option.buffer;
            option.restoreBuffer(_old);
            if (_rbuffer) {
                option.formatterBuffer.appendToBuffer(_rbuffer);
            }
        }
        return _old;
    }
    /**
     * return shift markerInfo from list
     * @param {*} marker 
     * @param {bool} throwError 
     * @returns 
     */
    shiftFromMarkerInfo(marker, throwError = true) {
        if (this.markerInfo.length > 0) {
            if (this.markerInfo[0].marker === marker) {
                return this.markerInfo.shift();
            }
            if (throwError) {
                throw new Error('missing markerInfo');
            }
        }
        return null;
    }
    storeAndUpdateBuffer() {
        this.store();
        let _buffer = this.flush(true);
        if (_buffer.length > 0) {
            this.formatterBuffer.appendToBuffer(_buffer);
        }
    }
    getBufferContent(clear){
        const option = this;
        let _buffer = option.buffer;
        let _cm = option.flush(true);
        if (clear){
            option.formatterBuffer.clear();
        }
        return _cm+_buffer;
    }
    peekFirstMarkerInfo() {
        if (this.markerInfo.length > 0) {
            return this.markerInfo[0];
        }
        return null;
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
    appendExtraOutput() {
        this.debug && Debug.log('---:append extra output:---');
        const { listener, output } = this;
        FormatterOptions.AppendExtraLiveOutput({ listener, output });
    }
    static AppendExtraLiveOutput({ listener, output }) {
        if (listener?.appendExtraOutput) {
            listener.appendExtraOutput({ output: output });
        } else
            output.push('');
    }
}



exports.FormatterOptions = FormatterOptions;