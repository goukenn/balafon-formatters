"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const { Utils } = require("./Utils");
const { Patterns } = require("./Patterns");
const { RefPatterns } = require("./RefPatterns");
const { JSonParser } = require("./JSonParser");
const { Debug } = require("./Debug");
const { FormatterListener } = require("./FormatterListener");
const { FormatterSetting } = require("./FormatterSetting");
const { PatternMatchInfo } = require("./PatternMatchInfo");
const { CaptureInfo } = require("./CaptureInfo");
const { CaptureRenderer } = require("./CaptureRenderer");
const { FormatterBuffer } = require("./FormatterBuffer");
const { prefetch } = require("webpack");

// + | --------------------------------------------------------
// + | export pattern match information 
// + | --------------------------------------------------------
Utils.Classes = {
    RefPatterns,
    Patterns,
    PatternMatchInfo,
    CaptureInfo
};


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
        let m_objClass;
        let m_errors = [];
        let m_info = {
            isSubFormatting: 0,
            captureGroup: null
        };
        this.debug = false;
        this.patterns = [];
        this.repository = {};

        Object.defineProperty(this, 'listener', { get() { return m_listener; }, set(value) { m_listener = value } })
        Object.defineProperty(this, 'errors', { get() { return m_errors; } })
        /**
         * get format info : use to update some current state
         */
        Object.defineProperty(this, 'info', { get() { return m_info; } })
        Object.defineProperty(this, 'objClass', { get() { return m_objClass; } })


        this.pushError = (e) => {
            this.m_errors.push(
                { 101: 'not in capture.' }[e]
            );
        }
        this._storeObjClass = function (s) {
            m_objClass = s;
            delete this._storeObjClass;//  = null;
        };

    }

    get lineFeed() {
        return this.m_option.lineFeed;
    }
    set lineFeed(value) {
        this.m_option = value;
    }
    json_keys() {
        const n = 'repository';
        let tab = Object.keys(this);
        let idx = tab.indexOf(n);
        delete (tab[idx]);
        tab.unshift(n);
        return tab;
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
        const patterns = Utils.ArrayParser(Patterns, RefPatterns);
        const parse = {
            patterns,
            repository(d, parser) {
                let _out = {};
                let _o = null;
                const { registry } = parser;
                for (let i in d) {
                    _o = new Patterns();
                    JSonParser._LoadData(parser, _o, d[i], i, _o);
                    parser.initialize(_o);
                    _out[i] = _o;
                }
                parser.repositoryKey = null;
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
        const _names = {};
        let _registryExpression = null;
        const formatter = Utils.JSonParseData(Formatters, data, {
            initialize(m) {
                if (((m instanceof Patterns) || (m instanceof CaptureInfo)) && (m.name)) {
                    this.registerName(m.name);
                }
            },
            registerName(n) {
                if (n.length <= 0) return;
                _names[n] = 1;
            }
        });
        Object.defineProperty(formatter, 'registerNames', { get() { return _names; } });
        formatter._funcRegistryExpression = function () {
            if (_registryExpression != null) {
                return _registryExpression;
            }
            let registry = {};
            let _entry = [];
            for (let i in _names) {
                if (i == 'global') {
                    throw new Error('global is reserved');
                }
                Utils.DefineProp(i, undefined, registry);
                let n = i.split('.')[0];
                if (_entry.indexOf(n) == -1) {
                    _entry.push(n);
                }
            }
            _registryExpression = { namespaces: _entry, registry };
            return _registryExpression;
        };
        return formatter;
    }
    static CreateDefaultOption() {
        return new FormatterSetting;
    }
    #createListener() {
        const { listener } = this;
        let _o = null;
        if (listener) {
            _o = listener();
        }
        return _o || new FormatterListener();
    }
    /**
     * init marker definition
     * @param {*} option 
     * @returns 
     */
    #initDefinition(option) {
        const _rg = option || this.settings || Formatters.CreateDefaultOption();
        const { lineFeed, tabStop } = _rg;
        const { debug } = this;
        const _markerInfo = [];
        const _states = [];
        let m_depth = _rg.depth || 0;
        let _formatter = this;
        let _info = this.#createListener();
        let m_pos = 0;
        let _formatterBuffer = new FormatterBuffer;
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
            continue: false,
            lineJoin: false,
            lineFeedFlag: false,
            output: [], // output result
            markerDepth : 0, // store handleMarker stack
            tokenList:[], // store entry token list
            listener: _info,
            debug: _formatter.debug,
            lineFeed,
            state: '', // current state mode 
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


        Object.defineProperty(objClass, 'formatterBuffer', { get: function () { return _formatterBuffer; } })
        Object.defineProperty(objClass, 'buffer', { get: function () { return _formatterBuffer.buffer; } })
        Object.defineProperty(objClass, 'outputBufferInfo', { get() { return _outputBufferInfo; } })
        Object.defineProperty(objClass, 'tokenChains', { get() { 
            const _tokens = _formatter.getTokens(); 
            let r = _tokens;
            if(this.tokenList?.length>0){
                r = this.tokenList.concat(_tokens);
            } 
            return r;
        } 
        });
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

        /**
         * append to buffer
         * @param {string} value 
         * @param {*} _marker 
         */
        objClass.appendToBuffer = function (value, _marker, treat = true) {
            this.debug && Debug.log("[append to buffer] - ={" + value + '}');
            let _buffer = value;// this.buffer;
            const { listener, tokenChains } = this;
            if (treat && listener?.renderToken) {  
                // _marker.name && tokenChains.unshift(_marker.name);
                _buffer = listener.renderToken(_buffer, tokenChains, _marker.tokenID);
                
            }
            this.formatterBuffer.appendToBuffer(_buffer);
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
                let _g = _s.render(this.listener, _cap, false, _formatter.getTokens());
                patternInfo.startOutput = _g;
                return;
            }
            return this.treatCaptures(_cap, marker, group);
        };
        objClass.treatEndCaptures = function (markerInfo, endMatch) {
            let _cap = { ...markerInfo.captures, ...markerInfo.endCaptures };
            if (is_emptyObj(_cap)) {
                return endMatch[0];
            }
            const { marker, group } = markerInfo;
            const { debug } = this;
            debug && Debug.log('::TreatEndCapture::');
            let _s = CaptureRenderer.CreateFromGroup(endMatch, marker.name);
            if (_s) {
                const q = this;
                let _g = _s.render(this.listener, _cap, (value, cap, id, listener) => {
                    if (cap.patterns) {
                        let _bckCapture = _formatter.info.captureGroup;
                        _formatter.info.captureGroup = markerInfo.group;
                        debug && Debug.log('---::::treatEndCaptures::::--- contains patterns');
                        if (_formatter.settings.useCurrentFormatterInstance) {
                            pushState();
                            // backup setting
                            let _bck = {
                                patterns: _formatter.patterns,
                                buffer: q.buffer,
                                output: q.output,
                                formatterBuffer: q.formatterBuffer.bufferSegments.slice(0),
                                lineCount: q.lineCount,
                                markerInfo: q.markerInfo.slice(0),
                                line: q.line,
                                pos: q.pos,
                                depth: q.depth,
                                tokenList : q.tokenList.slice(0),
                                markerDepth: q.markerDepth
                            };
                            // clean setting
                            q.output = [];
                            q.formatterBuffer.clear();// = new 
                            q.lineCount = 0;
                            q.depth = 0;
                            q.markerDepth = 0;//_bck.markerDepth;
                            q.tokenList.length = 0;//_bck.tokenList;
                            _markerInfo.length = 0;
                            if (_markerInfo.name){
                                q.tokenList.unshift(_markerInfo.name);
                                q.markerDepth = 1;
                            } 
                            _formatter.info.isSubFormatting++;
                            _formatter.patterns = cap.patterns;
                            value = _formatter.format(value);
                            _formatter.info.isSubFormatting--;
                            _formatter.patterns = _bck.patterns;
                            // restore setting
                            q.output = _bck.output;
                            q.lineCount = _bck.lineCount;
                            q.line = _bck.line;
                            q.pos = _bck.pos;
                            q.depth = _bck.depth;
                            q.markerDepth = _bck.markerDepth;
                            q.tokenList = _bck.tokenList;
                            _bck.markerInfo.forEach(a => _markerInfo.push(a));
                            _bck.formatterBuffer.forEach(a => q.formatterBuffer.bufferSegments.push(a));
                            popState();

                        } else {
                            // passing value to pattern 
                            let n_formatter = Formatters.CreateFrom({ patterns: d.patterns });
                            value = n_formatter.format(value);
                        }
                        _formatter.info.captureGroup = _bckCapture;
                    }


                    return value;
                });
                markerInfo.endOutput = _g;
                return _g;
            }
            // let transformed = _marker.endRegex(_marker.group); 
            // use replace with to change the value at specied capture 
            // let list = [];
            // list.markers = {};
            // let prop = null;
            // let _bckCapture = _formatter.info.captureGroup;
            // _formatter.info.captureGroup = markerInfo.group;
            // for (let i in _cap) {
            //     list.push(i);
            //     let d = _cap[i];
            //     if (!(i in endMatch)) {
            //         this.pushError(101);
            //         continue;
            //     }
            //     let value = endMatch[i];
  
            
            //     if (d.name) {
            //         prop = new NameOnlyConstantPattern();
            //         prop.name = d.name;
            //         prop.isClosingBlock = d.isClosingBlock;
            //         list.markers[i] = {
            //             marker: prop,
            //             value: value,
            //             parent: markerInfo
            //         };
            //     }
            //     if (d.patterns) {
            //         debug && Debug.log('---::::treatEndCaptures::::--- contains patterns');
            //         if (_formatter.settings.useCurrentFormatterInstance) {
            //             pushState();
            //             // backup setting
            //             let _bck = {
            //                 patterns: _formatter.patterns,
            //                 buffer: this.buffer,
            //                 output: this.output,
            //                 lineCount: this.lineCount,
            //                 markerInfo: this.markerInfo.slice(0),
            //                 line: this.line,
            //                 pos: this.pos
            //             };
            //             // clean setting
            //             this.output = [];
            //             this.buffer = [];
            //             this.lineCount = 0;
            //             _markerInfo.length = 0;
            //             _formatter.info.isSubFormatting++;
            //             _formatter.patterns = d.patterns;
            //             value = _formatter.format(value);
            //             _formatter.info.isSubFormatting--;
            //             _formatter.patterns = _bck.patterns;
            //             // restore setting
            //             this.output = _bck.output;
            //             this.buffer = _bck.buffer;
            //             this.lineCount = _bck.lineCount;
            //             this.line = _bck.line;
            //             this.pos = _bck.pos;
            //             _bck.markerInfo.forEach(a => _markerInfo.push(a));
            //             popState();

            //         } else {
            //             // passing value to pattern 
            //             let n_formatter = Formatters.CreateFrom({ patterns: d.patterns });
            //             value = n_formatter.format(value);
            //         }
            //     }

            //     endMatch[i] = value;
            // }
            // _formatter.info.captureGroup = _bckCapture;
            // return list;
            return this.treatCaptures(_cap, marker, endMatch);
        }
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
                    this.pushError(101);
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
        objClass.restoreBuffer = function (data) {
            this.output = data.state.output;
            _formatterBuffer = data.state.formatterBuffer;
        },
            objClass.newBuffer = function () {
                this.output = [];
                _formatterBuffer = new FormatterBuffer;
            }

        objClass.store = function (startBlock = false) {
            const { listener } = this;
            if (listener) {
                const _ctx = this;
                const { buffer, output, depth } = _ctx;
                listener.store.apply(null, [{ buffer, output, depth, tabStop, _ctx, startBlock }]);
            }
            _formatterBuffer.clear();
        }
        /**
         * flush and clear buffer 
         * @param {bool} clear 
         * @returns 
         */
        objClass.flush = function (clear) {
            const _ctx = this;
            const { buffer, output, listener } = _ctx;
            let l = '';
            if (listener) {
                l = listener.output.apply(null, [clear, { buffer, output, lineFeed, _ctx }]);
            } else {
                l = this.output.join(lineFeed);
            }
            if (clear) {
                this.output = [];
                this.formatterBuffer.clear();
            }
            return l;
        }
        this._storeObjClass(objClass);
        return objClass;

    }
    /**
     * 
     * @param {string|string[]} data 
     * @param {*} option format option 
     * @returns 
     */
    format(data, option) {
        if (!Array.isArray(data)) {
            if (typeof (data) == 'string') {
                data = [data];
            }
            else throw new Error('argument not valid');
        }
        let objClass = this.objClass;
        if (!objClass) {
            objClass = this.#initDefinition(option);
        }
        let _matcherInfo = null;
        let _formatter = this;
        // let pos = 0;
        const { debug, lineFeed } = objClass;
        option = objClass;
        // + | ------------------------------------------------------------
        // + | START : FORMATTER LOGIC
        // + | ------------------------------------------------------------
        data.forEach((line) => {
            const option = objClass;
            objClass.debug && Debug.log('read:[' + objClass.lineCount + "]::: " + line);
            objClass.resetRange();
            objClass.line = line;
            objClass.pos = 0;
            objClass.continue = false;
            objClass.lineCount++;


            if (_matcherInfo) {
                if (!_matcherInfo.marker.allowMultiline) {
                    throw new Error(`marker '${_matcherInfo.name}' do not allow multi line definition.`);
                }
                objClass.continue = true;
                objClass.lineJoin = false;
                objClass.startLine = true;
                _matcherInfo = _formatter._handleMarker(_matcherInfo, objClass, _info);

            } else {
                objClass.line = objClass.line.trimStart();
            }
            if (line.length <= 0) {
                return;
            }
            objClass.startLine = false;
            let ln = objClass.length;
            let pos = objClass.pos;
            const { debug } = objClass;
            while (pos < ln) {
                objClass.continue = false;
                if (_matcherInfo) {
                    objClass.continue = true;
                    objClass.storeRange(objClass.pos);
                    _matcherInfo = _formatter._handleMarker(_matcherInfo, objClass);
                } else {
                    _matcherInfo = Utils.GetPatternMatcher(this.patterns, objClass);
                    if (_matcherInfo) {
                        objClass.storeRange(pos, _matcherInfo.index);
                        _matcherInfo = _formatter._handleMarker(_matcherInfo, objClass);
                    } else {
                        objClass.appendToBuffer(objClass.line.substring(objClass.pos), objClass.constants.GlobalConstant);
                        objClass.pos = ln;
                    }
                }
                pos = objClass.pos;
                if (!_matcherInfo){
                    objClass.markerDepth = 0;
                    objClass.tokenList.length = 0;
                }else {
                    objClass.markerDepth = Math.max(--objClass.markerDepth, 0);
                    objClass.tokenList.shift();
                }
            }
            objClass.lineJoin = true;
            if (objClass.markerDepth){
                objClass.markerDepth = Math.max(--objClass.markerDepth, 0);
            }
        });

        debug && console.log('...end...');
        if (objClass.markerInfo.length > 0) {
            // missing close marker info
            debug && console.log('.....contains marker info .....');
            let q = null;
            let _info = objClass.listener;
            while (q = objClass.markerInfo.shift()) {
                this._restoreBuffer(objClass, q);
                objClass.formatterBuffer.appendToBuffer(q.content);
                if (q.marker.isBlock) {
                    objClass.depth = Math.max(--objClass.depth, 0);;
                    objClass.output.push(objClass.buffer); 
                    objClass.formatterBuffer.clear();
                }

            }
        }
        objClass.store();
        const _output = objClass.output.join(lineFeed);
        // + | clear buffer list  
        this.objClass.output = [];
        this.objClass.formatterBuffer.clear();

        return _output;
    }
    _isBlockAndStart(_marker, option) {
        return _marker.isBlock && !option.continue;
    }

    _startBlock(option) {
        option.depth++;
        const { output, tabStop, depth } = option;
        option.listener?.startNewBlock({ buffer: '', output, tabStop, depth });
    }
    getTokens() {
        return [this.scopeName];//'constant';
    }
    getMarkerCaptures(_markerInfo, end = false) {
        const _type = _markerInfo.marker.matchType;
        if (_type == 0) {
            const s = end ? _markerInfo.marker.endCaptures : _markerInfo.marker.beginCaptures;
            return { ..._markerInfo.marker.captures, ...s };
        }
        return { ..._markerInfo.marker.captures };
    }
    /**
     * do replace with
     * @param {*} value 
     * @param {*} _formatter 
     * @param {*} replace_with 
     * @param {*} group 
     * @param {*} _marker markerInfo
     * @returns 
     */
    static DoReplaceWith(value, _formatter, replace_with, group, _marker) {
        let g = group;
        let _rp = replace_with; // 
        let m = '';
        if (g) {
            m = Utils.ReplaceRegexGroup(_rp, g); // check for regex presentation
            let cp = new RegExp(m, 'd');
            let check = m.replace(/(?<=(^|[^\\]))(\(|\))/g, ''); // remove capture brackets
            let _in = value.replace(value, check);
            // passing exec to formatt new value
            let matches = cp.exec(_in);
            const _tokens = _formatter.getTokens();
            g = CaptureRenderer.CreateFromGroup(matches, _tokens);
            let out = g.render(_formatter.objClass.listener, _formatter.getMarkerCaptures(_marker), false, _tokens);
            // console.log("the in ", _in, out);
            return out;

        } else {
            //treat:
            _rp = _rp.substring(1).slice(0, -1)
            if (_rp=='(?:)'){
                _rp='';// empty string
            }
            m = _rp.replace(/\\\//g, "/");
        }
        value = value.replace(value, m);
        return value;
    }

    /**
     * core handle marker handle marker 
     * @param {PatternMatchInfo} _marker 
     * @param {*} option 
     */
    _handleMarker(_marker, option) {
        if (!_marker) return;
        const { name } = _marker;
        if (option.markerDepth==0){
            option.tokenList.length = 0;
        }
        if (name)
            option.tokenList.unshift(name);
        option.markerDepth++;

        if (!option.continue) {
            this._updatedPatternMatch(_marker, option); 
            option.storeRange(option.pos);
        }
        /**
         * each callback must return a marker or null 
         * */
        const handle = this._handleCallback(_marker.marker.matchType, option);
        if (!handle || (typeof (handle) != "function")) {
            throw new Error("marker type handler is not a valid callback");
        }
        return handle.apply(this, [_marker, option]);
    }
    /**
     * replace with condition 
     * @param {PatternMatchInfo} _marker 
     * @param {*} value 
     * @param {*} group 
     * @returns 
     */
    _operationReplaceWith(_marker, value, group) {
        let _formatter = this;
        const { replaceWith, replaceWithCondition } = _marker;
        if (replaceWith) {
            let _rpw = Utils.RegExToString(replaceWith);
            const _cond = replaceWithCondition;
            let match = _cond?.match;

            let g = group;
            if (!g && _formatter.info.isSubFormatting > 0) {
                g = _formatter.info.captureGroup;
            }
            if (match) {
                let _op = _cond.operator || '=';
                let _s = Utils.ReplaceRegexGroup(_cond.check, g);
                if (/(!)?=/.test(_op)) {
                    let r = match.test(_s);
                    if (_op) {
                        if (((_op == '=') && !r) || ((_op == '!=') && (r))) {
                            return value;
                        }
                    }
                } else if (/(\<\>)=/.test(_op)) {
                    let _ex = match.toString().replace(/\\\//g, '');
                    if (
                        ((_op == ">=") && (_s >= _ex)) ||
                        ((_op == "<=") && (_s <= _ex))
                    ) {
                        if (_s >= _ex) return value;
                    }
                }

            }
            value = Formatters.DoReplaceWith(value, _formatter, _rpw, g, _marker);

        }
        return value;
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
        option.debug && Debug.log('--:: Handle match marker :--');
        option.state = 'match';
        let c = _marker.group[0];
        // + | update cursor position
        option.pos += c.length;
        this._updateMarkerChild(_marker);
        // + | marker is not a line feed directive or buffer is not empty
        if ((!_marker.lineFeed) || (option.buffer.length > 0)) { 
            // treat - tranform token and tranfrom 
            const _op = [];
            c = this._treatMarkerValue(_marker, c, _op);
            if (_op.indexOf('replaceWith')==-1){
                option.appendToBuffer(c, _marker);
            } else {
                option.formatterBuffer.appendToBuffer(c);//, _marker);
            }
            if (_marker.lineFeed) {
                option.lineFeedFlag = true;
            }
        }
        return _marker.parent;
    }
    _treatMarkerValue(_marker, c, op){
        
        if (_marker.replaceWith){
            c = this._operationReplaceWith(_marker, c, null);
            op.push('replaceWith'); 
        }
        if (_marker.transform){
            c = Utils.StringValueTransform(c, _marker.transform); 
            op.push('transform');
        }
        return c;
    }
    /**
     * append constant
     * @param {} patternInfo 
     * @param {*} data 
     * @param {*} option 
     */
    _appendConstant(patternInfo, data, option) {
        let _inf = new PatternMatchInfo;
        // let _buffer = '';
        _inf.use({ marker: option.constants.PrevLineFeedConstant, line: option.line });
        patternInfo.childs.push(_inf);

        if (patternInfo.isBlockStarted && !patternInfo.newLine) {
            let _buffer = option.buffer;// .flush(true);
            option.output.push(_buffer);
            option.formatterBuffer.clear();
            option.appendToBuffer(data, _inf);
            option.store();
            _buffer = option.flush(true);
            option.formatterBuffer.clear();
            option.formatterBuffer.appendToBuffer(_buffer);
            patternInfo.newLine = true;

        } else {
            option.appendToBuffer(data, _inf);
        }
    }
    _updateMarkerInfoBlock(_old, option) {
        let _buffer = _old.content;
        let _marker = _old.marker;
        let _content = (_old.useEntry && _old.entryBuffer.length > 0) ? option.formatterBuffer.getContent(1) : option.buffer;
        option.formatterBuffer.clear();
        if (_old.useEntry) {
            option.formatterBuffer.appendToBuffer(_old.entryBuffer);
            option.store();
        } else {
            option.output.push('');
        }
        this._startBlock(option);
        option.formatterBuffer.appendToBuffer(_content);
        option.store();


        let _sbuffer = _buffer.trimEnd() + option.flush(true);
        let _lf = '';
        _buffer = '';
        _old.blockStarted = true;
        _marker.isBlockStarted = true;
        this._initUpdatedisBlockStartInformation(_marker, option);
        _old.useEntry = false;// ''
        if (_sbuffer) {
            _buffer += _lf + _sbuffer;
        }
        _old.startBlock = 0;
        _old.content = _buffer;
        return _buffer;
    }
    /**
     * handle marker info 
     * @param {PatternMatchInfo} patternInfo 
     * @param {*} option 
     * @returns 
     */
    _handleBeginEndMarker2(patternInfo, option) {
        option.state = 'begin/end';
        const { debug, listener, line, markerInfo, startLine } = option;
        const { group } = patternInfo;
        debug && Debug.log('-------------: start begin/end handle marker 2 :----------------------');

        let _endRegex = null;
        let _start = true;
        let _line = '';
        let _matcher = null;
        let _old = null;
        let _buffer = null;
        let _p = null; // end matcher 
        // get _old marker to continue matching selection  
        if ((markerInfo.length > 0) && (markerInfo[0].marker == patternInfo) && (_old = markerInfo.shift())) {
            _start = _old.start; // update the marker to handle start definition
            _buffer = this._updateOldMarker(_old, patternInfo, startLine, option);
        } else if (patternInfo.start) {
            // + | treat begin captures and update buffer
            option.treatBeginCaptures(patternInfo);
            patternInfo.start = false;
            this._updateParentProps(patternInfo, true, option);
            const { parent } = patternInfo;
            if (parent) {
                if (parent.isBlock && this._isChildBlock(patternInfo) && 
                !parent.isBlockStarted) { 
                    if (markerInfo.length > 0){
                        this._updateMarkerInfoBlock(markerInfo[0], option); 
                    } 
                }
            }

        }


        _buffer = _buffer || patternInfo.startOutput;
        _endRegex = patternInfo.endRegex;// _endRegex || _marker.endRegex(_marker.group);
        let _next_position = patternInfo.group.index + patternInfo.group.offset;
        // treat patterns
        if (_start) {
            // + | on start before handle 
            option.pos = _next_position;
            const { parent } = patternInfo;
            if (parent && parent.isBlock && parent.isBlockStarted && this._isChildBlock(patternInfo)) {
                // update the block definition to child block 
                // option.store();
                option.output.push('');
                //option.formatterBuffer.bufferSegments.unshift(_buffer);
                //_buffer='';// ..output.push('');
            }
        }
        _line = line.substring(option.pos);

        let _continue_with_marker = false;
        _matcher = (_line.length > 0) &&
            (patternInfo.patterns && (patternInfo.patterns.length > 0)) ?
            Utils.GetPatternMatcher(patternInfo.patterns, option, patternInfo) : null;
        _p = _line.length > 0 ? _endRegex.exec(_line) : null;
        if (_p) {
            _p.index += option.pos;
        }


        if (_line.length == 0) {
            this._updateMarkerInfoOld(patternInfo, _old, _buffer, _endRegex, option);
            return patternInfo;
        }
        if (_matcher == null) {
            // no child matcher found
            if (_p == null) {
                // no end - found 
                _continue_with_marker = true;
                // update cursor 
                this._appendConstant(patternInfo, _line, option);
                option.pos = option.line.length;
            } else {
                // ---------------------------------------------------------------
                // END FOUND
                // ---------------------------------------------------------------
                return this._handleFoundEndPattern2(_buffer, _line, patternInfo, _p, option, _old);
            }
        }
        else {

            // compared index and handle child
            if ((_p == null) || (_matcher.group.index < _p.index)) {
                // handle matcher  
                this._updateMarkerInfoOld(patternInfo, _old, _buffer, _endRegex, option);
                option.storeRange(option.pos, _matcher.group.index);
                if (option.range.start != option.range.end) {
                    this._updatedPatternMatch(patternInfo, option);
                    option.storeRange(option.pos);
                }
                //option.continue = false;
                return this._handleMarker(_matcher, option);
            }
            // check if same 
            if (_matcher.group.index == _p.index) {
                option.storeRange(option.pos);
                let _pattern = option.line.substring(option.range.start, _p.index);
                if (_pattern.trim().length > 0) {
                    // + possibility of element prev constant element before end group match
                    option.storeRange(option.pos, _p.index);
                    this._updateMarkerInfoOld(patternInfo, _old, _buffer, _endRegex, option);
                    this._appendConstant(patternInfo, _pattern, option);
                    // option.appendToBuffer(_pattern, option.constants.PrevLineFeedConstant);

                    option.pos = _p.index;

                    return patternInfo;
                }
                return this._handleSameGroup2(patternInfo, _matcher, _p, _old, _buffer, option, _endRegex);
            }
            // priority to current marker 
            return this._handleFoundEndPattern2(_buffer, _line, patternInfo, _p, option, _old);
            // throw new Error("Detected after not handle");
        }
        if (_continue_with_marker) {
            this._updateMarkerInfoOld(patternInfo, _old, _buffer, _endRegex, option);
            return patternInfo;
        }

        // + | default append 
        listener.append(group[0], patternInfo);
        // + | move forward
        option.moveTo(_next_position);
        return null;
    }
    _updatedPatternMatch(_marker, option) {
        let _prev = option.line.substring(option.range.start, option.range.end);
        if (_prev.length > 0) {
            this._appendConstant(_marker, _prev, option);
            option.pos += _prev.length;
        }
    }
    /**
     * determine that the pattern is a child block
     * @param {*} patternInfo 
     * @returns bool
     */
    _isChildBlock(patternInfo) {
        const { parent } = patternInfo;
        let r = false;
        let { requestParentBlockCondition } = parent;
        if (parent && requestParentBlockCondition) {

            r = this._isEmptyRequestBlock({
                childs: [patternInfo],
                _marker: parent,
                condition: requestParentBlockCondition
            });
        }

        return r;
    }
    _handleFoundEndPattern2(_buffer, _line, _marker, _p, option, _old) {
        // calculate next position 
        const { debug } = option;
        const _next_position = _p.index + _p[0].length;
        let _append = option.line.substring(option.pos, _p.index);
        let _sblock = _marker?.parent?.isBlock;
        let _p_host = ((option.markerInfo.length > 0) ? option.markerInfo[0] : null);
        let _b = option.treatEndCaptures(_marker, _p);
        let _close_block = false;
        const q = this;
        let _updateBuffer = function () {
            if (_buffer.length > 0) {
                // + | direct append to buffer
                option.formatterBuffer.appendToBuffer(_buffer);
                _buffer = '';
            }
            if ((_append.trim().length > 0)) {
                // + | append constant marker definition 
                q._appendConstant(_marker, _append, option);
                _append = '';
            }
        }

        debug && Debug.log(`--::handleFoundEndPattern2::--#${_marker.name}`);
        // + | full fill pattern buffer 
        _updateBuffer();
        // + | update parent host - check update properties for end 
        this._updateMarkerChild(_marker, option);
        // + | node division 
        if (_marker.isBlock && _marker.blockStartInfo) {
            // just remove block before store 
            option.depth = Math.max(--option.depth, 0);
            // reset block value;
            _marker.isBlock = (_old && _old.oldBlockStart);
            _close_block = true;
            //_marker.isBlockDefinition = null;
            _buffer = option.buffer; // backup buffer 
            option.store();
        }
        // + | append to buffer 
        if (_b.length > 0) {
            option.appendToBuffer(_b, _marker, false);
            _b = '';
        }
        if (_close_block) {
            option.store();
            _buffer = option.flush(true);
            option.formatterBuffer.appendToBuffer(_buffer);
        }
        if (_old != null) {

            // + | presentation and restore old buffer.
            if ((_old.marker == _marker)) {
                _buffer = option.buffer;
                // - so st treat buffer 
                if (!_old.useEntry && _marker.isBlock) {
                    // remove entry and replace with {entry}\n\t // storage
                    let entry = _old.entryBuffer;
                    option.formatterBuffer.clear();
                    option.formatterBuffer.appendToBuffer('--');
                    option.store(true);
                    let _rm = option.flush(true).replace('--', '');
                    _buffer = _buffer.replace(new RegExp("^" + entry), entry + _rm);
                }
                option.restoreBuffer(_old);
                option.formatterBuffer.appendToBuffer(_buffer);
                _buffer = '';
            }
        }


        // + | determine childs
        if (_marker.childs.length > 0) {
            debug && Debug.log(`#${_marker.name} have ${_marker.childs.length} childs`);
        }
        if (_marker?.parent?.newLine) {
            _marker.parent.newLine = false;
        }

        option.moveTo(_next_position);

        return _marker.parent;
    }

    /**
     * check if this marker will be consider as an empty block if requested
     * @param { {childs: [], _marker,condition}} option  
     */
    _isEmptyRequestBlock({ childs, _marker, condition }) {
        if (childs.length == 0) {
            return false;
        }
        const _tchilds = childs.slice(0);
        if (condition) {
            let r = true;
            let q = null;
            let expression = this._funcRegistryExpression();
            const list = expression.namespaces.join(',');
            let fc = new Function("registry", "child", "marker", `const {${list}} = registry; return ${condition};`);
            while (_tchilds.length > 0) {
                q = _tchilds.shift();

                try {
                    r = fc.apply({ child: q }, [
                        expression.registry, q, _marker]);
                }
                catch (e) {
                    console.error("error : ", e);
                    return true;
                }
                if (r) {
                    return true;
                }
            }
            return false;
        }
        return true;
    }
    /**
     * update marker child 
     * @param {*} _marker 
     */
    _updateMarkerChild(_marker, option) {
        const { parent } = _marker;
        if (!parent) return;

        parent.childs.push({
            name: _marker.name,
            marker: _marker,
            range: { start: 0, end: 0 }
        });
        this._updateParentProps(_marker, false, option);


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
        option.debug && Debug.log(':::--restore buffer--:::');
        option.restoreBuffer(data);
    }
    _backupMarkerSwapBuffer(option, _marker, l, _endRegex) {
        option.debug && Debug.log('backup and swap buffer.');
        const _inf = {
            marker: _marker,
            start: false,
            // content: l, // define content property
            endRegex: _endRegex,
            startBlock: _marker.isBlock ? 1 : 0, // start join mode 0|block = append new line before 
            // autoStartChildBlock: false, // indicate that child is an autostarted child start bloc
            oldBlockStart: _marker.isBlock, // backup the start source start 
            blockStarted: false, // block stared flags for buffer 
            state: { // backup buffer 
                // buffer: option.buffer,
                buffer: option.formatterBuffer.buffer, // store old buffer
                output: option.output,
                formatterBuffer: option.formatterBuffer
            },
            useEntry: true
        };
        (function (entry) {
            var _content = '';
            Object.defineProperty(_inf, 'entryBuffer', {
                get() {
                    return entry;
                }
            });
            Object.defineProperty(_inf, 'content', {
                get() {
                    return _content;
                },
                set(v) {
                    if (v != _content) {
                        option.debug && Debug.log("store content :" + v)
                        _content = v;
                    }
                }
            });
            Object.defineProperty(_inf, 'childs', {
                get() {
                    return _inf.marker.childs;
                }
            });
        })(l);
        option.unshiftMarker(_inf);
        option.newBuffer();
        // + | start by adding the first segment to buffer
        option.formatterBuffer.appendToBuffer(l);
    }
    _updateOldMarker(_old, _marker, startLine, option) {
        let _sbuffer = '';
        let _lf = _old.startBlock == 1 ? option.lineFeed : '';
        let _buffer = _old.content;
        const _info = option.listener;
        const { debug } = option;
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
                _buffer = '';
            }
        } else {
            // append current buffer to 
            if (_marker.isBlock && !_old.blockStarted && !_marker.isBlockStarted) {
                _sbuffer = this._updateMarkerInfoBlock(_old, option);
                _lf = '';

                // debug && Debug.log(":::inner block start :: #" + _marker.name);
                // let _content = (_old.useEntry && _old.entryBuffer.length > 0) ? option.formatterBuffer.getContent(1) : option.buffer;
                // option.formatterBuffer.clear();
                // if (_old.useEntry) {
                //     option.formatterBuffer.appendToBuffer(_old.entryBuffer);
                //     option.store();
                // } else {
                //     option.output.push('');
                // }
                // this._startBlock(option);
                // option.formatterBuffer.appendToBuffer(_content);
                // option.store();


                // _sbuffer = _buffer.trimEnd() + option.flush(true);
                // _lf = '';
                // _buffer = '';
                // _old.blockStarted = true;
                // _marker.isBlockStarted = true;
                // this._initUpdatedisBlockStartInformation(_marker, option);
                // _old.useEntry = false;// '';
            }
            else {
                if ((option.output.length > 0) || _old.startBlock) {
                    option.store(_old.startBlock);
                    _sbuffer = option.flush(true);
                    _lf = '';

                } else {
                    _sbuffer = option.buffer;
                    option.flush(true);
                    _old.useEntry = false;
                }
            }

        }
        if (_sbuffer) {
            _buffer += _lf + _sbuffer;
        }
        _old.startBlock = 0;
        _old.content = _buffer;
        return _buffer;
    }

    _handleSameGroup2(_marker, _matcher, _p, _old, _buffer, option, _endRegex) {
        if (_matcher.group[0].length == 0) {
            // matcher is empty and must past to end group
            if (_endRegex.test(_buffer)) {
                return this._handleFoundEndPattern2(_buffer, option.line, _marker, option, _old);
            }
        }

        // + | update parent markerin of before handle marker 
        if ((option.markerInfo.length == 0) || (option.markerInfo[0] !== _marker)) {
            this._updateMarkerInfoOld(_marker, _old, _buffer, _endRegex, option);
        }
        return this._handleMarker(_matcher, option);
    }
    // _handleEndBlock2(_marker, option) {

    // }
    /**
     * update parent property
     * @param {PatternMatchInfo} _marker 
     * @param {bool} _start 
     */
    _updateParentProps(_marker, _start, option) {
        const { parent, updateParentProps, requestParentBlockCondition } = _marker;
        const _list = ['isBlock', 'lineFeed'];
        if (parent && updateParentProps) {
            _list.forEach(a => {
                if (!(a in parent.updatedProperties) && (a in updateParentProps)) {
                    let s = updateParentProps[a];
                    if (a == _list[0]) {
                        if (s && (requestParentBlockCondition)) {
                            s = this._isEmptyRequestBlock({
                                childs: _marker.childs,
                                _marker,
                                condition: requestParentBlockCondition
                            });
                        }
                    }
                    if (parent[a] != s) {
                        parent[a] = s;
                        parent.updatedProperties[a] = a;
                    }
                }
            });

        }
        if (!_start) {
            this._initUpdatedisBlockStartInformation(_marker, option);
        }
    }
    _initUpdatedisBlockStartInformation(_marker, option) {
        const { parent } = _marker;
        if (parent) {
            if (('isBlock' in parent.updatedProperties) && (_marker.isBlockStarted)) {
                if (parent.isBlock && !parent.isBlockStarted && !parent.blockStartInfo) {
                    // update parent block information 
                    parent.isBlockStarted = true;
                    parent.blockStartInfo = {
                        depth: option.depth
                    }
                }
            }
        }
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
    transform = [function (v) {
        if (v.trim().length == 0) return ''; return v;
    }, 'joinSpace']
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