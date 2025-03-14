"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const { PatternMatchInfo } = require("./PatternMatchInfo");
const { Utils } = require("./Utils");
const { Debug } = require("./Debug");
const { FormatterBuffer } = require("./FormatterBuffer");
const { FormatterLineMatcher } = require("./FormatterLineMatcher");
const { FormatterLineSegment } = require("./FormatterLineSegment");
const { FormatterListener } = require("./FormatterListener");

/**
 * @typedef IFormatSourceOption
 * @type
 * @property {?string} name
 * @property {?string} constantName
 * @property {?number} depth
 */

/**
 * @typedef IFormatterOptions
 * @funcion newBuffer 
 * @property {string} line current line definition
 * @property { boolean } isEOL detect that is end off line; 
 */

/**
 * class used to expose formatter option 
 * @type IFormatterOptions
 * @property {FormatterLineMatcher} lineMatcher 
 * @function joinBuffer
 */
class FormatterOptions {
    // private 
    #m_lineSegments;

    // sourceLine;
    // line;

    /**
     * position on operate line 
     */
    // pos = 0;
    /**
     * current line cursor
     */
    lineCount = 0;

    /**
     * line offset
     */
    lineOffset = 0;
    
    continue = false;
    lineJoin = false;
    skipTreatEnd = false;
    skipTreatWhile = false;
    markerDepth = 0; // store handleMarker stack
    loopInfo;

    /**
     * get or set last marker depth
     * @var {*}
     */
    lastMarker;

    /**
     * format source option
     * @var {undefined|IFormatSourceOption}
     */
    sourceOption;
    /**
     * join with flag string
     * @var {?string}
     */
    joinWith;
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
     * flag to skip update start line logic
     */
    skipUpdateStartLine = false;

    /**
     * on stream buffer handler skip marker flag
     */
    skipMarkerFlag = false;

    /**
     * next mode
     * @var {number}
     */
    nextMode = 1;

    /**
     * last rendered token 
     */
    lastToken;

    /**
     * last segment
     */
    lastSegment;

    /**
     * flag to store last define
     */
    lastDefineStates;

    /**
     * flag: use to indicate the line is starting
     * @var {boolean}
     */
    startLine; 

    /**
     * flag : skip end of line
     */
    skipEndOfLine;

    /**
     * flag: start line reading 
     */
    get startReading(){
        return this.formatter?.startReading;
    }

    /**
     * flag: newly block start
     * @var {null|undefined|bolean}
     */
    startBlock;

    /**
     * transform marker style
     * @var {*}
     */
    matchTransformFlag; 
 
    /**
     * get or set last marker Pattern - to skip for next get global pattern loop. skip only one
     */
    lastEmptyMarkerPattern;

    /**
     * flag: value used to glue with next trimmed line;
     * @var {undefined|string}
     */
    nextGlueValue; 

 
    get lineSegments(){
        return this.#m_lineSegments;
    }

    /**
     * 
     * @param {*} marker 
     * @returns 
     */
    pushConditionalContainer(marker){
        const { conditionalContainer } = this;
        if (marker.isBlockConditionalContainer){
            conditionalContainer.push({marker, start:true});
            return true;
        }
        return false;
    }
    popConditionalContainer(){
        const { conditionalContainer } = this;
        return conditionalContainer.pop();
    }

    /**
     * @var {boolean}
     */
    isConditionalBlockStart(){
        const { conditionalContainer } =  this;
        if (conditionalContainer.length>0){
            let i = conditionalContainer[conditionalContainer.length-1];
            return i.start;
        }
        return false;
    }

    /**
     * top conditional block container
     * @returns 
     */
    topConditionalBlockContainer(){
        const { conditionalContainer } =  this;
        if (conditionalContainer.length>0){
            return conditionalContainer[conditionalContainer.length-1];
        }  
        return null;
    }
 
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
        const c_lineMatcher = new FormatterLineMatcher(this);
        const c_conditionalContainer = [];
        // initialize conditional field
        let { lineFeed, tabStop } = {lineFeed:_rg?.lineFeed || _formatter.info.lineFeed || "\n", 
            tabStop: _rg?.tabStop || _formatter.info.tabStop || "\t"};
        this.#m_lineSegments = new FormatterLineSegment;
        let m_isCapturing = false;

        
        let m_depth = _rg?.depth || 0;
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
        let m_formatterListener = null;
        // inject setting property
        for (let i in _rg) {
            if (['depth', 'line', 'tabStop', 'lineFeed'].indexOf(i) != -1) {
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
        });
        

        Object.defineProperty(option, 'conditionalContainer', {get(){return c_conditionalContainer; }});
        Object.defineProperty(option, 'lineMatcher', {get(){return c_lineMatcher; }});
        Object.defineProperty(option, 'sourceLine', {get(){return c_lineMatcher.sourceLine; }});
        Object.defineProperty(option, 'line', {get(){
            return c_lineMatcher.line; 
        }, set(v){ c_lineMatcher.line = v;}});        
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
        Object.defineProperty(option, 'isEOL', { 
            get(){
                return this.pos >= this.length;
            }
        } );
        Object.defineProperty(option, 'isCapturing', {
            get: function () { return m_isCapturing; }
        });

        Object.defineProperty(option, 'buffer', { get: function () { return _formatterBuffer.buffer; } })
        Object.defineProperty(option, 'data', { get: function () { return _formatterBuffer.data; } })
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
        Object.defineProperty(option, 'debug', { get: function () { return debug; } })
        Object.defineProperty(option, 'markerInfo', { get: function () { return _markerInfo; } })
        Object.defineProperty(option, 'constants', { get: function () { return m_constants_def; } })
        Object.defineProperty(option, 'pos', {
            get: function () { 
                return c_lineMatcher.position; 
            }, 
            set(v){
                c_lineMatcher.position = v;
            }
        });
        /**
         * debug offset 
         */
        Object.defineProperty(option, 'offset', {
            get: function () { 
                return c_lineMatcher.offset; 
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
        Object.defineProperty(option, 'dataOutput', {
            get: function () { return _formatterBuffer.dataOutput; },
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

        Object.defineProperty(option, 'lineFeed', {get(){
            return lineFeed;
        }});

        function empty(l) {
            return (!l && l.length == 0)
        }
        function is_emptyObj(q) {
            return Object.keys(q).length == 0
        }
        /**
         * push object state
         */
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
        /**
         * pop object state
         */
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

        /**
         * 
         * @param {*} buffer 
         * @param {*} value 
         * @returns 
         */
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
         * @param {string|{buffer:string, data:string}} value 
         * @param {PatternMatchInfo} _marker 
         * @param {?boolean} treat render token with listener  
         * @param {*} _marker 
         */
        option.appendToBuffer = function (value, _marker, treat = true, raise=true) {
            
            if (!value){
                // buffer is undefined or null
                return;
            }
            
            const { debug, formatterBuffer } = this;
            debug?.feature('append-to-buffer') && (()=>{
                Debug.log("[append to buffer] - ");
                console.log(value);
            });
            let _buffer = value;
            let _storeBuffer = (value, data, _marker, treat)=>{
                let _buffer = value;        
                let _data = data;        
                if (m_appendToBufferListener) {
                    value = m_appendToBufferListener(value, _marker, treat, this);
                }
                else {
                    if (treat){
                        _buffer = this.treatValueBeforeStoreToBuffer(_marker, _buffer);
                    } 
                    const marked = _marker.markedInfo();
                    formatterBuffer.appendToBuffer({
                        buffer: _buffer, data: _data, marked});
                }
            };
            let _def_value = null;

            if (typeof(value) == 'object' ){
                // passing object 
                // encapsulate buffer but not data
                _storeBuffer(value.buffer, value.data, _marker, false); 
                _buffer = option.buffer;
                _def_value = {source: value.data, value: value.buffer};
            }
            else if (value.length > 0) {
                if (m_appendToBufferListener) {
                    value = m_appendToBufferListener(value, _marker, treat, this);
                }
                else {
                    if (treat){
                        _buffer = this.treatValueBeforeStoreToBuffer(_marker, _buffer);
                    } 
                    // TODO: update marker info
                    const marked =  _marker.markedInfo();

                    formatterBuffer.appendToBuffer({
                        buffer: _buffer, data: value, marked});
                }
            }
            _marker.value = _def_value || { source: value, value: _buffer };
            if (raise)
                _formatter.onAppendToBuffer(_marker, _buffer, option);
            if (_buffer?.trim().length>0){
                option.glueValue = null;
            }
        };

        option.useGlue = (_marker, _cm_value)=>{
             // + | update or reset glue value
             if (_marker.isGlueValue && _cm_value) {
                option.glueValue = _cm_value;
            } else {
                option.glueValue = null;
            }
        };
        option.treatValueBeforeStoreToBuffer = function (_marker, _buffer){
            const { listener, tokenChains, engine } = this;
            if (listener?.renderToken) {
                _shiftMarkerInfo(_marker.marker, tokenChains);
                // + | shift to token marker info 
                (()=>{
                    // + | add extra to to token chains
                    _marker.name && !_marker.isShiftenName && tokenChains.unshift(_marker.name);
                    
                })()
                const tokenID = getTokenID(_marker);
                _buffer = listener.renderToken(_buffer, tokenChains, tokenID, engine, debug, _marker, option);
            }
            return _buffer;
        }
        /**
         * treat begin captures
         * @param {*} _marker 
         * @param {*} matches 
         * @returns 
         */
        option.treatBeginCaptures = function (patternInfo, _captures, _outdefine) {
            const { marker, group } = patternInfo; 
            // + | do capture treatment 
            let _cap = _captures || Utils.BeginCaptures(marker);
            if (is_emptyObj(_cap)) {
                return;
            } 
            let _s = null;  
            // + | use capture to treat and pattern to continue reading
            // + | clone and reset indices before generate  
            _s = CaptureRenderer.CreateFromGroup(group, marker.name);
            if (_s) {
                _outdefine =_outdefine || {};
                let _g = _renderCaptures( ()=>{
                    return  _s.render(this.listener, _cap, false, this.tokenChains, this, _outdefine);
                });
                patternInfo.startOutput = _g;
                this.lastDefineStates = _outdefine;
                return _g;
            }
            return null;
        };
        option.treatEndCaptures = function (markerInfo, endMatch, captures, _outdefine) {
            let _cap = captures || { ...markerInfo.captures, ...markerInfo.endCaptures };
            if (is_emptyObj(_cap)) {
                if (endMatch[0].length>0)
                    return option.treatValueBeforeStoreToBuffer(markerInfo, endMatch[0]);
                return;
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
                    value = listener.renderToken(value, tokens, tokenID, engine, debug, cap,q);
                }
                return value;

            };
            debug?.feature('treat-capture') && Debug.log('--:::TreatEndCapture:::--' + marker);
            let def = endMatch;
            let _s = CaptureRenderer.CreateFromGroup(def, marker.name);
            if (_s) { 
                _outdefine = _outdefine || {};
                let _g = _renderCaptures(()=>{
                    let _g = _s.render(this.listener, _cap, fc_handle_end, this.tokenChains,
                        q, _outdefine
                    );
                    return _g;
                }); 
                markerInfo.endOutput = _g;
                this.lastDefineStates = _outdefine;
                debug?.feature('treat-capture') && (()=>{
                    Debug.log('--::: end captures result :::--');
                    console.log({endOuput:_g});
                })();
                return _g;
            }
            return null; 
        }

        /**
         * 
         */
        function _renderCaptures(callback){
            let q = option;
            let _bck = q.skipEmptyMatchValue;
            q.skipEmptyMatchValue = false;
            m_isCapturing= true;
            let _g = callback();
            m_isCapturing = false;
            q.skipEmptyMatchValue = _bck;
            return _g;
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
        option.moveTo = function (newPosition, newOffset) { 
            if (newOffset){
                this.lineMatcher.setPosition(newPosition, newOffset)
            } else {
                this.pos = newPosition;
            }
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
        /**
         * save buffer
         */
        option.saveBuffer = function () {
            m_saveCount++;
            _bufferState.push({
                output: this.output,
                formatterBuffer: this.formatterBuffer
            });
            this.newBuffer('_save_buffer_');
        };

        /**
         * restore saved buffer
         */
        option.restoreSavedBuffer = function () {
            let buffer = _bufferState.pop();
            if (buffer) {
                this.restoreBuffer({ state: buffer });
                m_saveCount--;
            }
        };

        /**
         * store definition
         * @param {*} startBlock 
         */
        option.store =
            /**
             * store and clear formatter buffer  
             * @param {bool} startBlock 
             */
            function (startBlock = false){
                const _ctx = this;
                const { buffer, data, output, dataOutput, depth, formatterBuffer, listener } = _ctx;
                const _args = { buffer, output,data, dataOutput, depth, tabStop, formatterBuffer, _ctx, startBlock };
                if (listener?.store) {
                    listener.store.apply(null, [_args]);
                } else {
                    if (!m_formatterListener){
                        m_formatterListener = new FormatterListener;
                    }
                    m_formatterListener.store(_args);
                }
                _formatterBuffer.clear();
            };

        option.flush =
           /**
           * flush with what is in the buffer - and clear buffer 
           * @param {bool} clear clear buffer list 
           * @param {{dataOutput:string, buffers: { bufferSegments: [*], dataSegments: [*]} }} refdata reference data return on buffer clear 
           * @returns 
           */
            function (clear, refdata) {
                const _ctx = this;
                const { buffer, output, listener, dataOutput, formatterBuffer} = _ctx;
                let l = '';
                let data = null;
                if (listener?.output) {
                    l = listener.output.apply(null, [{ buffer, output, dataOutput, lineFeed, _ctx }]);
                } else {
                    l = output.join(lineFeed);
                }
                data = dataOutput.join(lineFeed);
                //+| clear output and buffer 
                if (clear) {
                    if (refdata){
                        refdata.dataOutput = data;
                        refdata.buffers = formatterBuffer.joinSegments();
                    }
                    formatterBuffer.clearAll();
                    output.length = 0;
                }
                return l;
            }
        option.appendLine = 
            /**
             * 
             * @returns 
             */
            function () {
            const { listener } = this; 
            const { lineFeed } = _formatter.settings;
            if (listener?.appendLine) {
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
     * 
     * @param {PatternMatchInfo} sourcePattern 
     * @param {string} buffer 
     * @returns {_gbuffer:string, _cpos:number}
     */
    treatAndFormat(sourcePattern, buffer){
        let _cpos = buffer.length;
        const _s = sourcePattern.streamFormatter;
        if (_s){
            if (typeof(_s)=='function'){
                buffer = formatter(buffer);
            } else if ((typeof(_s) == 'object') && _s.format){
                buffer = _s.format(buffer);
            } 
            // update the new line
            this.line = buffer + option.line.substring(_cpos);
        }
        return {_gbuffer: buffer, _cpos: buffer.length};
    }
    /**
     * start loop detected 
     */
    loopStart(){
        if (this.loopInfo == null){
            // + | init loop start
            this.loopInfo = {
                position: 0,
                matcher: null,
                count: 0
            };
        } else {
            // + | reset loop start
            this.loopInfo.position = 0;
            this.loopInfo.matcher= null;
            this.loopInfo.count = 0;
        }
    }
    get sourceOffset(){
        return this.lineOffset + this.offset;
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
        this.lineFeedFlag =
        this.skipTreatEnd = 
        this.skipTreatWhile = 
        false;
        this.lineCount = 0;
        this.markerDepth = 0;
        this.nextMode = 1;
        // reset glue flags
        this.joinWith = null;
        this.lastDefineStates = null;
        this.transformMarker = null;
        this.lineSegments.clear();
        this._resetFlags();
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
    _resetFlags(){
        this.glueValue = null;
        this.lastEmptyMarkerPattern = null;
        this.skipEndOfLine = false;
    }
    /**
     * set source line 
     * @param {*} v 
     * @param {undefined|number} position 
     * @param {undefined|number} offset 
     */
    setSourceLine(v, position, offset){
        this.lineMatcher.sourceLine = v;
        if ((position != undefined) && (position>=0)){
            this.setPosition(position, offset);
        }
    }

    /**
     * set position and offset 
     * @param {number} position 
     * @param {undefined|number} offset 
     */
    setPosition(position, offset){ 
        this.lineMatcher.setPosition(position, offset);
    }
    /**
     * 
     * @param {*} _marker 
     * @param {*} _old 
     */

    onBeginEndFound(_marker, _old){
        this._resetFlags();
        this.cleanNewOldBuffers();
        // set the nextGlueValue to use.
        if (_marker.nextGlueValue){
            this.nextGlueValue = _marker.nextGlueValue;
        }
        if (_marker.isBlockConditionalContainer){
            if (this.topConditionalBlockContainer()==_marker){

                this.popConditionalContainer();
            }
        }
    }
    onBeginWhileFound(){

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
            let _rdata = option.data;
            option.restoreBuffer(_old);
            if (_rbuffer) {
                option.formatterBuffer.appendToBuffer(
                    {
                    source:_rbuffer, data: _rdata});
            }
        }
        return _old;
    }
    /**
     * get if reading is in real start line
     * @var {boolean}
     */
    get startLineReading(){
        return this.startLine && (this.line == this.sourceLine);
    }
    /**
     * return shift markerInfo from list
     * @param {PatternMatchInfo} marker 
     * @param {bool} throwError 
     * @returns 
     */
    shiftFromMarkerInfo(marker, throwError = true) {
        if (this.markerInfo.length > 0) {
            if (this.markerInfo[0].marker === marker) {
                return this.markerInfo.shift();
            }
            if (throwError) {
                throw new Error('missing markerInfo [shift Marker Info] ');
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
    getBufferContent(clear, refData){
        const option = this;
        let _buffer = option.buffer;
        let _cm = option.flush(true, refData);
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
    /**
     * get marker info
     */
    get peekMarkerInfo(){
        return this.markerInfo.length>0? this.markerInfo[0] : null;
    }

    appendExtraOutput() {
        this.debug?.feature('append-extra-prefix-line') && Debug.log('---:append extra output:---');
        const { listener, output , dataOutput} = this;
        FormatterOptions.AppendExtraLiveOutput({ listener, output, dataOutput });
    }
    /**
     * flush and get data
     * @param {*} clear 
     * @returns {{buffer:string, data: string}}
     */
    flushAndData(clear){
        const _refData = {};
        const _buffer = this.flush(clear, _refData);
        return {buffer: _buffer, data: _refData.dataOutput };
    }
    static AppendExtraLiveOutput({ listener, output, dataOutput }) {
        if (listener?.appendExtraOutput) {
            listener.appendExtraOutput({ output: output });
        } else{
            output.push('');
            dataOutput.push('');
        }
    }
    get bufferSegmentState(){
        const { formatterBuffer } = this;
        return {
            bufferSegment : formatterBuffer.bufferSegment,
            dataSegment : FormatterBuffer.dataSegment
        };
    }
    /**
     * get buffer states
     */
    get bufferState(){
        return {
            buffer: this.buffer,
            data : this.data,
            output:  this.output.slice(0),
            dataOutput:  this.dataOutput.slice(0),
            bufferSegments : this.formatterBuffer.bufferSegments,
            dataSegments : this.formatterBuffer.dataSegments,
        };
    }

    constantPattern(){
        let _c =  this.sourceOption?.constantName || this.sourceOption?.name;
        if (_c){

            let _g = this.constants.refConstantClass;

            return new _g(_c); 
        }
        return this.constants.GlobalConstant; 
    }
}



exports.FormatterOptions = FormatterOptions;