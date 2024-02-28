"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const { Utils } = require("./Utils");
const { Patterns } = require("./Patterns");
const { RefPatterns } = require("./RefPatterns");
const { JSonParser } = require("./JSonParser");
const { Debug } = require("./Debug");
const { FormatterListener } = require("./FormatterListener");
const { FormatterSetting } = require("./FormatterSetting");

/**
 * formatters entry point
 */
class Formatters {
    patterns;
    repository;
    /**
     * @var {?string}
     */
    scopeName;
    /**
    * @var {?bool}
    */
    debug; // allow debug
    /**
     * use to configure general setting
     */
    settings; 
   
    constructor() {
        let m_listener;
        let m_errors = [];
        this.debug = false;
        this.patterns = [];
        this.repository = {};

        Object.defineProperty(this, 'listener', {get(){return m_listener;}, set(value){ m_listener = value}})
    
        this.pushError = (e)=>{
            this.m_errors.push(
                {101:'not in capture.'}[e]
            );
        }
    }

    get lineFeed() {
        return this.m_option.lineFeed;
    }
    set lineFeed(value) {
        this.m_option = value;
    }
    /**
     * validate current field name
     * @param {*} field_name 
     * @param {*} d 
     * @returns bool
     */
    json_validate(field_name, d, throw_on_error) {
        const validator = {
            patterns(d) {
                return Array.isArray(d);
            },
            repository(d) {
                return typeof (d) == 'object';
            },
            debug(d) {
                return typeof (d) == 'boolean' || /(yes|no|1|0)/.test(d);
            },
            settings(d) {
                return (d == null) || typeof (d) == 'object';
            },
            scopeName(d) {
                return (d == null) || typeof (d) == 'string';
            }
        };
        let f = validator[field_name];
        if (f && !f(d)) {
            if (throw_on_error) {
                throw new Error(`[${field_name}] is not valid`);
            }
            return false;
        }
        return true;
    }
    json_parse(parser, fieldname, data, refKey) {
        const patterns = Utils.ArrayParser(Patterns);
        const parse = {
            patterns,
            repository(d, parser) {
                let _out = {};
                let _o = null;
                for (let i in d) {
                    _o = new Patterns();
                    JSonParser._LoadData(parser, _o, d[i]);
                    _out[i] = _o;
                }
                return _out;
            },
            debug(d) {
                if (typeof (d) == 'boolean') {
                    return d;
                }
                return !(!d);
            },
            settings(d, parser) {
                if (d == null) {
                    return null;
                }
                let m = JSonParser._LoadData(parser, new FormatterSetting, d);
                return m;
            }
        };
        let fc = parse[fieldname];
        if (fc) {
            return fc(data, parser, refKey);
        }
        return data;
    }
    static CreateFrom(data) {
        const formatter = Utils.JSonParseData(Formatters, data);

        return formatter;
    }
    static CreateDefaultOption() {
        return new FormatterSetting;
    }
    #createListener(){
        const { listener } = this;
        let _o = null;
        if (listener){
            _o = listener();
        }
        return _o || new FormatterListener();
    }
    format(data, option) {
        if (!Array.isArray(data)) {
            if (typeof (data) == 'string') {
                data = [data];
            }
            else throw new Error('argument not valid');
        }

        const _rg = option || this.settings || Formatters.CreateDefaultOption();
        const { lineFeed, tabStop } = _rg;
        const { debug } = this;
        let depth = _rg.depth || 0;
        let _marker = null;
        let _formatter = this;
        let _matcher = null;
        // buffering info to handle buffer info
        let _info = this.#createListener(); 
        const _markerInfo = [];

        let m_pos = 0;
        const m_constants_def = {
            PrevLineFeedConstant: new PrevLineFeedConstantPattern,
            PrevConstant: new PrevConstantPattern,
            GlobalConstant: new GlobalConstantPattern,
        };
        let objClass = {
            ..._rg,
            line: '',
            pos: 0,
            lineCount: 0,
            depth,
            continue: false,
            lineJoin: false,
            lineFeedFlag: false,
            buffer: '',
            output: [], // output result
            listener: _info,
            debug: _formatter.debug,
            lineFeed,
            range: {
                start: 0, // start position
                end: 0    // number end position range
            },
            resetRange() {
                this.storeRange(0, 0);
            },
            /**
             * store range 
             * @param {number} start 
             * @param {number} end if optional 
             */
            storeRange(start, end) {
                this.range.start = start;
                this.range.end = typeof (end) == 'undefined' ? start : end;
            }
        };
        Object.defineProperty(objClass, 'length', { get: function () { return this.line.length; } })
        Object.defineProperty(objClass, 'tabStop', { get: function () { return tabStop; } })
        Object.defineProperty(objClass, 'lineFeed', { get: function () { return lineFeed; } })
        Object.defineProperty(objClass, 'debug', { get: function () { return debug; } })
        Object.defineProperty(objClass, 'markerInfo', { get: function () { return _markerInfo; } })
        Object.defineProperty(objClass, 'constants', { get: function () { return m_constants_def; } })
        Object.defineProperty(objClass, 'pos', {
            get: function () { return m_pos; }, set(v) {
                // console.log("set position", v);
                m_pos = v;
            }
        });

        objClass.unshiftMarker = (o) => {
            _markerInfo.unshift(o);
        };
        objClass.shiftMarker = () => {
            return _markerInfo.shift();
        };
        function empty(l) {
            return (!l && l.length == 0)
        }
        function is_emptyObj(q){
            return Object.keys(q).length == 0
        }
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
            // global treatment 
            if (_marker.transform) {
                value = Utils.StringValueTransform(value, _marker.transform);
            }
            if (this.listener.treatBuffer) {
                return this.listener.treatBuffer.append(s, value, _marker, this);
            }
            return this.joinBuffer(s, value); 
        };

        objClass.joinBuffer = function (buffer, value){
            const { lineJoin, noSpaceJoin} = this;
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

        /**
         * append to buffer
         * @param {string} value 
         * @param {*} _marker 
         */
        objClass.appendToBuffer = function (value, _marker) {
            let _buffer = this.buffer;
            _buffer = this.updateBufferValue(_buffer, value, _marker)
            this.buffer = _buffer;
        }

        objClass.treatBeginCaptures = function(_marker, endMatch){
            let _cap = { ..._marker.captures, ..._marker.beginCaptures};
            if (is_emptyObj(_cap)){
                return;
            }
            return this.treatCaptures(_cap, _marker, endMatch);
        };
        objClass.treatEndCaptures = function (_marker, endMatch){
            let _cap = { ..._marker.captures, ..._marker.endCaptures};
            if (is_emptyObj(_cap)){
                return;
            } 
            // let transformed = _marker.endRegex(_marker.group); 
            // use replaceWith to change the value at specied capture 
            let list = [];
            list.markers = {};
            let prop = null;
            for(let i  in _cap){
                list.push(i);
                let d = _cap[i];
                if (!(i in endMatch)){
                    this.pushError(101);
                    continue;
                }
                let value = endMatch[i];

                if (d.replaceWith){
                    let m =  Utils.ReplaceRegexGroup(d.replaceWith.toString(), _marker.group);
                    value = value.replace(value, m); 
                }
                if (d.nextTrimWhiteSpace){
                    // TODO: Trim next buffer space 
                }
                if (d.transform){
                    value = Utils.StringValueTransform(value, d.transform);
                     
                }
                if (d.name){
                    prop = new NameOnlyConstantPattern();
                    prop.name = d.name; 
                    list.markers[i] = {
                        marker: prop,
                        value : value
                    };
                }
                endMatch[i] = value;
            }  
            return list;
        }
        objClass.treatCaptures = function (_cap, _marker, endMatch){
 // let transformed = _marker.endRegex(_marker.group); 
            // use replaceWith to change the value at specied capture 
            let list = [];
            list.markers = {};
            let prop = null;
            for(let i  in _cap){
                list.push(i);
                let d = _cap[i];
                if (!(i in endMatch)){
                    this.pushError(101);
                    continue;
                }
                let value = endMatch[i];

                if (d.replaceWith){
                    let m =  Utils.ReplaceRegexGroup(d.replaceWith.toString(), _marker.group);
                    value = value.replace(value, m); 
                }
                if (d.nextTrimWhiteSpace){
                    // TODO: Trim next buffer space 
                }
                if (d.transform){
                    value = Utils.StringValueTransform(value, d.transform);
                     
                }
                if (d.name){
                    prop = new NameOnlyConstantPattern();
                    prop.name = d.name; 
                    list.markers[i] = {
                        marker: prop,
                        value : value
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


        objClass.store = function(){
            const { listener } = this;
            if (listener){
                const _ctx = this;
                const {buffer, output, depth} = _ctx;
                listener.store.apply(null, [{buffer, output, depth, _ctx}]);
                this.buffer = '';
            }
        }

        objClass.flush = function(clear){
            const { listener } = this;
            let l = '';
            if (listener){
                const _ctx = this;
                const {buffer, output} = _ctx;
                l = listener.output.apply(null, [clear, {buffer, output,lineFeed, _ctx}]);
            }
            if (clear)
            this.buffer = '';
            return l;
        }

        _info.objClass = objClass;
        // + | ------------------------------------------------------------
        // + | START FORMATTER LOGIC
        // + | ------------------------------------------------------------
        data.forEach((line) => {
            objClass.debug && Debug.log('read: ' + objClass.lineCount + " :> " + line);
            objClass.resetRange();
            objClass.line = line;
            objClass.pos = 0;
            objClass.continue = false;
            objClass.lineCount++;

            if (_marker) {
                if (!_marker.allowMultiline) {
                    throw new Error(`marker '${_marker.name}' do not allow multi line definition.`);
                }
                objClass.continue = true;
                objClass.lineJoin = false;
                objClass.startLine = true;
                _marker = _formatter._handleMarker(_marker, objClass, _info);

            } else {
                objClass.line = objClass.line.trimStart();
            }
            if (line.length <= 0) {
                return;
            }
            objClass.startLine = false;
            let ln = objClass.length;
            let pos = objClass.pos;
            while (pos < ln) {
                objClass.continue = false;
                if (_marker) {
                    objClass.continue = true;
                    objClass.storeRange(objClass.pos);
                    _marker = _formatter._handleMarker(_marker, objClass, _info);
                } else {
                    _matcher = Utils.GetPatternMatcher(this.patterns, objClass);
                    if (_matcher) {
                        objClass.storeRange(pos, _matcher.index);
                        _marker = _formatter._handleMarker(_matcher, objClass, _info);
                    } else {
                        objClass.appendToBuffer(objClass.line.substring(objClass.pos), objClass.constants.GlobalConstant);
                        objClass.pos = ln;
                    }
                }
                pos = objClass.pos;
            }
            objClass.lineJoin = true;
        });

        debug && console.log('.....end.....');
        if (objClass.markerInfo.length > 0) {
            // missing close marker info
            let q = null;
            while (q = objClass.markerInfo.shift()) {
                this._restoreBuffer(objClass, q);
                if (q.marker.isBlock) {
                    objClass.buffer += q.content;
                    objClass.depth--;
                    objClass.output.push(objClass.buffer);
                    objClass.buffer = '';
                    _info.appendAndStore(
                        q.marker.blockEnd
                    );
                }

            }
        }
        objClass.store();
        return objClass.output.join(lineFeed);
    }
    _isBlockAndStart(_marker, option) {
        return _marker.isBlock && !option.continue;
    }
    _startNewBlock(_marker, option) {
        if (this._isBlockAndStart(_marker, option)) {
            option.debug && Debug.log('start block:');
            option.buffer = option.buffer.trimEnd();
            option.depth++;
        }
    }

    /**
     * core handle marker handle marker 
     * @param {*} _marker 
     * @param {*} option 
     */
    _handleMarker(_marker, option) {
        if (!_marker) return;

        if (!option.continue) {
            let _prev = option.line.substring(option.range.start, option.range.end);
            if (_prev.length > 0) {
                option.appendToBuffer(_prev, option.constants.PrevLineFeedConstant);
                option.pos += _prev.length;
            }
            option.storeRange(option.pos);
        }
        /**
         * each callback must return a marker or null 
         * */
        const handle = this._handleCallback(_marker.matchType, option);
        if (!handle || (typeof (handle) != "function")) {
            throw new Error("marker type handler is not a valid callback");
        }
        return handle.apply(this, [_marker, option]);
    }

    /**
     * from type retrieve the handler type 
     * @param {*} type 
     * @returns 
     */
    _handleCallback(type, option) {
        return {
            "0": option.listener?.handleBeginEndMarker || this._handleBeginEndMarker2,
            "1": option.listener?.handleMatchMarker || this._handleMatchMarker
        }[type]
    }
    _handleMatchMarker(_marker, option) {
        option.debug && Debug.log('Handle match marker')
        let c = _marker.group[0];
        // + | update cursor position
        option.pos += c.length;
        // + | marker is not a line feed directive or buffer is not empty
        if ((!_marker.lineFeed) || (option.buffer.length > 0)) {
            option.appendToBuffer(c, _marker);
            if (_marker.lineFeed) {
                option.lineFeedFlag = true;
            }
        }
        return _marker.parent;
    }
    _handleBeginEndMarker2(_marker, option) {
        const { debug, listener, line, markerInfo, startLine } = option;
        const { group } = _marker;
        debug && Debug.log('-------------: handle marker 2 :----------------------');

        let _endRegex = null;
        let _start = true;
        let _line = '';
        let _matcher = null;
        let _old = null;
        let _buffer = '';
        let _p = null; // end matcher 
        // get _old marker to continue matching selection  
        if ((markerInfo.length > 0) && (markerInfo[0].marker == _marker) && (_old = markerInfo.shift())) {
            _start = _old.start; // update the marker to handle start definition
            _buffer = this._updateOldMarker(_old, _marker, startLine, option);
        }


        _endRegex = _endRegex || _marker.endRegex(_marker.group);
        _buffer = _buffer || _marker.group[0];
        let _next_position = _marker.group.index + _marker.group.offset;
        // treat patterns
        if (_start) {
            // before handle 
            option.pos = _next_position; // group.index + group[0].length;
        }
        _line = line.substring(option.pos);

        let _continue_with_marker = false;
        _matcher = (_line.length > 0) &&
            (_marker.patterns && (_marker.patterns.length > 0)) ?
            Utils.GetPatternMatcher(_marker.patterns, option) : null;
        _p = _line.length > 0 ? _endRegex.exec(_line) : null;
        if (_p) {
            _p.index += option.pos;
        }
        

        if (_line.length == 0) {
            this._updateMarkerInfoOld(_marker, _old, _buffer, _endRegex, option);
            return _marker;
        } 
        if (_matcher == null) {
            // no child matcher found
            if (_p == null) {
                // no end - found 
                _continue_with_marker = true;
                // update cursor 
                listener.append(_line);
                option.pos = option.line.length;
            } else {
                // ---------------------------------------- -----------------------
                // END FOUND
                // ----------------------------------------------------------------
                return this._handleFoundEndPattern(_buffer, _line, _marker, _p, option, _old); 
            }
        }
        else {
            // compared index and handle child
            if ((_p == null) || (_matcher.group.index < _p.index)) {
                // handle matcher 
                this._updateMarkerInfoOld(_marker, _old, _buffer, _endRegex, option);
                option.storeRange(option.pos, _matcher.group.index);
                return this._handleMarker(_matcher, option);
            }
            // check if same 
            if (_matcher.group.index == _p.index) {
                return this._handleSameGroup2(_marker, _matcher, _p, _old, _buffer, option, _endRegex);
            }
            throw new Error("not handle");
        }
        if (_continue_with_marker) {
            this._updateMarkerInfoOld(_marker, _old, _buffer, _endRegex, option);
            return _marker;
        }

        // + | default append 
        listener.append(group[0], _marker);
        // + | move forward
        option.moveTo(_next_position);
        return null;
    }
    _handleFoundEndPattern(_buffer, _line, _marker, _p, option, _old){
        const {listener} = option;
        const _end_capture = _p[0].length == 0;

        // calculate next position 
        const _next_position = _p.index + _p[0].length;
        // ent treatmen 
        let s =  option.treatEndCaptures(_marker, _p);
        let _b = _p[0];
        let _append = option.line.substring(option.pos, _p.index);
        
        if (!s && (_append != _b) && (_append.length>0)){
            // fix that capture not added with data .
            if (!_end_capture)
            _buffer = option.updateBufferValue(_buffer, _append, _marker);
        }// else {
        option.appendToBuffer(_buffer, _marker); 
        _buffer = '';
        //}

        if (s){
            // change marker definition group 
            if ( 0 in s.markers){
                let g = s.markers[0];
                _marker = g.marker || _marker;
            }  
        }  
        option.appendToBuffer(_b, _marker);  
        option.moveTo(_next_position);

        if (_old && (_old.marker ==_marker)){ 
            // + | update a restore folder 
            // + | restore and update buffer
            const _cbuffer = option.buffer; 
            let _tbuffer= option.flush(true); 
            _tbuffer += _cbuffer;
            this._restoreBuffer(option, _old); 
            
            if (_tbuffer.length>0){
                option.buffer += _tbuffer;
            }

        }

        return _marker.parent;
    }

    _updateMarkerInfoOld(_marker, _old, _buffer, _endRegex, option) {
        if (_old) {
            _old.content = _buffer;
            option.markerInfo.unshift(_old);
        } else {
            this._backupMarkerSwapBuffer(option, _marker, _buffer, _endRegex);
        }
    }

    /**
     * restore buffer
     * @param {*} option 
     * @param {*} data 
     */
    _restoreBuffer(option, data) {
        option.debug && Debug.log('restore buffer');
        option.buffer = data.state.buffer;
        option.output = data.state.output;
    }
    _backupMarkerSwapBuffer(option, _marker, l, _endRegex) {
        option.debug && Debug.log('backup and swap buffer.');
        const _inf = {
            marker: _marker,
            start: false,
            // content: l,
            endRegex: _endRegex,
            startBlock: _marker.isBlock ? 1 : 0, // start join mode 0|block = append new line before 
            state: {
                buffer: option.buffer,
                output: option.output
            }
        };
        (function () {
            var _content = '';
            Object.defineProperty(_inf, 'content', {
                get() {
                    return _content;
                },
                set(v) {
                    if (v != _content) {
                        console.log("store content :" + v)
                        _content = v;
                    }
                }
            });
        })();
        _inf.content = l;
        option.unshiftMarker(_inf);
        option.buffer = '';
        option.output = [];
    }
    _updateOldMarker(_old, _marker, startLine, option) {
        let _sbuffer = '';
        let _lf = _old.startBlock == 1 ? option.lineFeed : '';
        let _buffer = _old.content;
        const _info = option.listener;
        // console.log("_buffer content = "+_buffer);

        if (startLine) {
            if (_marker.preserveLineFeed) {
                _buffer += option.lineFeed;
            }
            if ((option.output.length > 0) || _old.startBlock) {
                _info.store();
                _buffer = _buffer.trimEnd();
                option.output.unshift('');
                _sbuffer = option.flush(true);
                _lf = '';
            }
        } else {
            // append current buffer to 

            if ((option.output.length > 0) || _old.startBlock) {
                option.store();
                _sbuffer = option.flush(true);
                _lf = '';

            } else {
                _sbuffer = option.buffer;
                option.flush(true);
                option.buffer = '';
            }

        }
        if (_sbuffer) {
            _buffer += _lf + _sbuffer;
        }
        _old.startBlock = 0;
        //  
        //  + | update old buffer content
        // this._restoreBuffer(option, _old);
        _old.content = _buffer;
        return _buffer;
    }
    // _handleBeginEndMarker(_marker, option) {
    //     // start line context . 
    //     const { listener, startLine, debug } = option;

    //     let _old = null, _endRegex = null, _matcher = null, _buffer = null;
    //     let _start = true;
    //     const _info = listener;
    //     console.log("---- begin/end ----");
    //     // move group forward
    //     // restore previous info marker 
    //     if ((option.markerInfo.length > 0) && (option.markerInfo[0].marker === _marker)) {
    //         _old = option.markerInfo.shift();
    //         // + | update buffer 
    //         // + | continue reading with this marker
    //         // + | update marker 
    //         _endRegex = _old.endRegex;
    //         _start = _old.start;
    //         _buffer = this._updateOldMarker(_old, _marker, startLine, option);
    //     }

    //     let _match_start = _marker.group[0];
    //     if (_start) {
    //         option.pos += _match_start.length;
    //         if (this._isBlockAndStart(_marker, option)) {
    //             this._startNewBlock(_marker, option);
    //             _match_start = _marker.blockStart;
    //         }

    //     }
    //     _endRegex = _endRegex || _marker.endRegex(_marker.group);
    //     _matcher = Utils.GetPatternMatcher(_marker.patterns, option);
    //     _buffer = ((_buffer != null) ? _buffer : _match_start);
    //     let l = option.line.substring(option.pos);

    //     if (l.length == 0) {
    //         if (_old) {
    //             //continue pattern
    //             option.unshiftMarker(_old);
    //             return _old.marker;
    //         }
    //         this._backupMarkerSwapBuffer(option, _marker, _buffer, _endRegex);
    //         return _marker;
    //     }

    //     let l_index = 0;
    //     let _p = l.length > 0 ? _endRegex.exec(l) : null;

    //     if ((_p == null) && (_matcher == null)) {
    //         console.log('both are is null');
    //     }


    //     if (_p) {
    //         l_index = _p.index;
    //         // + | exec and fix end position
    //         _p.index += option.pos;
    //     }
    //     if (_matcher == null) {
    //         // + | NO PATTERNS MATCH - END REACH
    //         if (_p) {
    //             // + | --------------------------------------------------
    //             // + | END FOUND
    //             // + | -------------------------------------------------- 
    //             l = l.substring(0, l_index)
    //             // + | block-start and end-on single line treatmen
    //             _info.treatEndCapture(_marker, _p, _endRegex);

    //             if (_marker.isBlock) {
    //                 return this._handleEndBlockMarker(_marker, _p, option, l, _start, _buffer, _endRegex, _old);
    //             }
    //             // TODO: not a block 
    //             let _end_def = _p[0];
    //             if (_old) { // restore old buffer 
    //                 this._restoreBuffer(option, _old);
    //             }
    //             _buffer = (_start ? _marker.group[0] : _buffer) + l.substring(0, l_index);
    //             _buffer = _info.treatEndBufferCapture(_marker, _p, _endRegex, _buffer);
    //             _end_def = _p[0];
    //             l = _buffer + _end_def;

    //             // + | move cursor to contain [ expression ]
    //             option.pos += l_index + _p[0].length;
    //             // consider parent to match if - transformProperty
    //             if (_marker.parent && _marker.transformToken) {
    //                 debug && console.log("-- // transform token // ");
    //                 let bck_ln = option.line;
    //                 let bck_pos = option.pos;
    //                 option.line = l;
    //                 option.pos = 0;
    //                 // console.log("460: "+_marker.parent.isBlock);
    //                 // _info.append("Before:", _marker, true); 
    //                 let _tmark = this._handleMarker(_marker.parent, option);
    //                 option.line = bck_ln;
    //                 option.pos = bck_pos;
    //                 return _tmark;
    //             }
    //             _info.append(l, _marker, true);
    //             return _marker.parent;
    //         } else {
    //             // matcher and _p is null 
    //             if (startLine && !_marker.allowMultiline) {
    //                 throw new Error('do not allow multiline');
    //             }
    //             if (_marker.isBlock && _start) {
    //                 this._backupMarkerSwapBuffer(option, _marker, '', _endRegex);
    //                 _info.appendAndStore(l.trim());
    //                 option.output.unshift(_buffer);
    //                 option.markerInfo[0].content = option.flush(true);
    //                 option.pos = option.line.length;
    //                 return _marker;
    //             }
    //             // update group definition 
    //             // on start add buffer if no 
    //             if (_start) {
    //                 l = ((_buffer != null) ? _buffer : _marker.group[0]) + l;
    //                 this._backupMarkerSwapBuffer(option, _marker, l, _endRegex);
    //             } else {
    //                 if (_old) { // keep active the _old marker info 
    //                     option.debug && Debug.log("keep old state and update oldstate buffer");
    //                     if (startLine) {
    //                         _info.appendAndStore(l);
    //                     } else {
    //                         _old.content += l;
    //                     }
    //                     option.unshiftMarker(_old);
    //                 }
    //             }
    //             option.pos = option.line.length;
    //             return _marker;
    //         }
    //     } else {
    //         if (_p) {
    //             if (_matcher.group.index < _p.index) {
    //                 l = _buffer;//+ l.substring(0, _matcher.group.index) + _matcher.group[0];
    //                 // + | update range position - then handle again
    //                 option.storeRange(option.pos, _matcher.group.index);
    //                 // + | leave the position
    //                 // option.pos = option.range.end - 1;
    //                 if (_old) {
    //                     option.unshiftMarker(_old);
    //                 } else {
    //                     this._backupMarkerSwapBuffer(option, _marker, l, _endRegex);
    //                 }
    //                 option.continue = false;
    //                 option.storeRange(option.pos, _matcher.index);
    //                 return this._handleMarker(_matcher, option);
    //             }
    //             if (_matcher.group.index == _p.index) {
    //                 // + | matcher and end marker match the same position.
    //                 // + | - need to pass group or change the behaviour of the parent
    //                 return this._handleSameGroup(_marker, _matcher, _p, _old, _buffer, option, _endRegex);
    //             }
    //             return _matcher.parent;
    //         }
    //         // option.pos += _matcher.index - 1;
    //         // reduce the matching invocation 
    //         if (_marker.isBlock && !_old) {
    //             // 
    //             // let f = this._handleStartBlockMarker(_marker, _matcher, option, l, _start, _buffer, _endRegex, _old);
    //             this._backupMarkerSwapBuffer(option, _marker, _buffer, _endRegex);
    //             option.storeRange(option.pos, _matcher.index);
    //             let __s = this._handleMarker(_matcher, option, _info, startLine);
    //             return __s;
    //         }

    //         if (_old) {
    //             option.unshiftMarker(_old);
    //         } else {
    //             this._backupMarkerSwapBuffer(option, _marker, _buffer, _endRegex);
    //         }

    //         option.continue = false;
    //         option.storeRange(option.pos, _matcher.index);
    //         let __s = this._handleMarker(_matcher, option, _info, startLine);
    //         return __s;
    //     }
    // }
    _handleSameGroup2(_marker, _matcher, _p, _old, _buffer, option, _endRegex) {
        if (_matcher.group[0].length == 0) {
            // matcher is empty and must past to end group
            if (_endRegex.test(_buffer)) {
                return this._handleEndBlock2(_marker);
            }
        }
    }
    _handleEndBlock2(_marker, option) {

    }
    /**
     * internal function 
     * @param {*} _marker 
     * @param {*} _matcher matcher match 
     * @param {*} _p end match
     * @param {*} _old 
     * @param {*} _buffer 
     * @param {*} option 
     * @param {*} _endRegex calculated end regex
     * @returns 
     */
    _handleSameGroup(_marker, _matcher, _p, _old, _buffer, option, _endRegex) {
        const t = _matcher.matchType;
        let l = '';
        const { listener } = option;
        switch (t) {
            case 0: // begin/end matching
                throw new Error('not implement begin/end same group');
            case 1: // direct matching
                if (_matcher.group[0].length == 0) {
                    // passing handle to parent buffer
                    let _start = false;
                    _marker.block = {
                        start: _marker.group[0],
                        end: _p[0]
                    };
                    l = option.line.substring(option.pos, _matcher.group.index);
                    option.pos = _p.index + _p[0].length;
                    return this._handleEndBlockMarker(_marker, _p, option, l, _start, _buffer, _endRegex, _old, {
                        tokenID: _matcher.tokenID || _marker.tokenID
                    });
                } else {
                    // just append to buffer - but clear 
                    listener.append(_p[0], _marker);
                    option.store();
                    _buffer += listener.output(true);
                    // _buffer += listener.objClass.buffer;

                    this._updateParentProps(_matcher, option)
                    // _marker.isBlock = true; // update parent property 
                    option.continue = false;
                    // option.startBlock = true;
                    _marker.isBlock && this._startNewBlock(_marker, option);


                    _marker.block = {
                        start: _buffer,
                        end: Utils.ReplaceRegexGroup('/' + _marker.block.end + '/', _marker.group)
                    };

                    if (!_old || (_old.marker != _marker)) {
                        this._backupMarkerSwapBuffer(option, _marker, _buffer, _endRegex);
                        _old = option.markerInfo[0];
                    } else {
                        _old.content = _buffer;
                        option.unshiftMarker(_old);
                    }
                    if (_marker.isBlock) {
                        option.listener.startNewBlock(_marker);
                    }
                    _old.start = false;
                    option.pos += _p[0].length;
                    return _marker;
                }
                break;
        }
        return _marker;
    }
    /**
     * update parent property
     * @param {*} _matcher 
     */
    _updateParentProps(_matcher, option) {
        if (!_matcher.updateParentProps)
            return;
        const { isBlock, lineFeed } = _matcher.updateParentProps;
        _matcher.parent.isBlock = isBlock || _matcher.parent.isBlock;
        _matcher.parent.lineFeed = lineFeed || _matcher.parent.lineFeed;
    }
    _handleEndBlockMarker(_marker, _p, option, l, _start, _buffer, _endRegex, _old, info) {
        const _info = option.listener;
        let _end = _marker.blockEnd;
        info = info || {};
        option.debug && Debug.log("// handle EndBlock - ");

        if (_start) {
            option.debug && Debug.log("start and end on single line : " + l);
            l = l.trim();
            if (l.length == 0) {
                // + | just append (block-start+block-end)
                _info.append(_buffer + _end.trim(), new EmptyBlockPattern);
                option.depth--;

            } else {
                // + | just indent block definition 
                this._backupMarkerSwapBuffer(option, _marker, _buffer, _endRegex);
                _info.appendAndStore('', _marker);  // start block
    
                _info.append(l); // append constant
                _info.store();
                option.depth--;
                _info.append(_end, { ..._marker, ...info }); // end block
                _info.store();
                let g = option.flush(true);
                _old = option.markerInfo.shift();
                _buffer = [_old.content, g].join(option.lineFeed);
                this._restoreBuffer(option, _old);
                _info.append(_buffer, new BlockDefinitionPattern);
            }
        } else {
            option.output.push(_buffer);
            if (l.length > 0) {
                _info.appendAndStore(l);
            }
            option.depth--;
            _info.appendAndStore(_end);
            _buffer = option.flush(true);
            _old && this._restoreBuffer(option, _old);

            _info.appendAndStore(_buffer, new BlockDefinitionPattern)
        }
        // + | update position 
        option.pos = _p.index + _p[0].length;
        // not start block 
        return _marker.parent;
    }


    _getMatchList() {
        const _list = [];

        return _list;
    }
    _renderMatchList(_list, option) {
        const { listener } = option;

        _list.forEach((o) => {
            listener.append(o.value, o.marker);
            if (o.marker.lineFeed) {
                listener.store();
            }
        });
    }
}

class SpecialMeaningPatternBase extends Patterns {
    get isSpecial() { return true; }
}

class BlockPatternBase extends SpecialMeaningPatternBase {
    get isBlock() { return true; }
}
class EmptyBlockPattern extends BlockPatternBase {
    name = 'system.empty.block';
    get isEmptyBlock() { return true; }
}
class BlockDefinitionPattern extends BlockPatternBase {
    get isBlockDefinition() { return true };
    name = 'system.block.definition';
}

/**
 * use to debug constant list 
 */
class SystemConstantPattern extends SpecialMeaningPatternBase {
    tokenID = 'constant';
    transform = [function(v){ 
        if (v.trim().length == 0) return ''; return v;},'joinSpace']
}

class PrevLineFeedConstantPattern extends SystemConstantPattern {
    name = 'system.prev.line.feed.constant'
}

class GlobalConstantPattern extends SystemConstantPattern {
    name = 'system.global.line.constant';

}

class PrevConstantPattern extends SystemConstantPattern {
    name = 'system.prev.line.constant';
}
class NameOnlyConstantPattern extends SpecialMeaningPatternBase { 
    get matchType() {
        return 3;
    }
}

exports.Formatters = Formatters;
exports.Utils = Utils;
exports.Patterns = Patterns;
exports.JSonParser = JSonParser;