"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const { NativeRegExp } = require('./NativeRegExp');
const { FormatterCloseParentInfo } = require('./FormatterCloseParentInfo');
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
const { FormatterOptions } = require("./FormatterOptions");
const { FormattingCodeStyles } = require("./FormattingCodeStyles");
const { HandleFormatting, FormattingMode, formattingSetupPatternForBuffer } = require("./Formattings/FormattingMode");
const { FormatterMarkerInfo } = require("./FormatterMarkerInfo");
const { RegexUtils } = require("./RegexUtils");
const { BlockInfo } = require("./BlockInfo");
const { FormatterPatternException } = require("./FormatterPatternException");
const { FormatterToken } = require("./FormatterToken");
const { FormatterDebugger } = require("./FormatterDebugger");
const { FormatterEndMissingExpression } = require("./FormatterEndMissingExpression");
const { FormatterEndMissingEngine } = require("./FormatterEndMissingEngine");
const { FormatterSegmentJoin } = require("./FormatterSegmentJoin");


// + | --------------------------------------------------------
// + | export pattern match information 
// + | --------------------------------------------------------
Utils.Classes = {
    RefPatterns,
    Patterns, // replacement 
    PatternMatchInfo, // 
    CaptureInfo, // replacement
    CaptureRenderer,
    FormatterBuffer,
    FormatterOptions,
    FormattingCodeStyles,
    Debug,
    RegexUtils,
    BlockInfo,
    FormatterPatternException,
    FormatterCloseParentInfo,
    FormatterToken,
    FormatterDebugger,
    FormatterEndMissingExpression,
    FormatterSegmentJoin
};

let sm_globalEngine;
/**
 * @var engine formatter
 */
let sm_engine_formatter;
/**
 * formatters entry point
 */
class Formatters {
    /**
     * store object reference of lint errors
     */
    lintErrors;
    /**
     * array of patterns to inject
     */
    patterns;
    /**
     * repository to inject
     */
    repository;
    /**
     * @var {?string}
     */
    scopeName;

    /**
     * selector definition to implements
     * @var {?string}
     * "L:source.language"
     */
    injectionSelector;
    /**
    * @var {?bool}
    */
    debug; // allow debug
    /**
     * use to configure general setting
     */
    settings;

    /**
     * comment description 
     */
    comment;

    /**
     * array to declare used token id.
     * @var {?string[]}
     */
    tokens;

    foldingStartMarker;

    foldingStopMarker;

    fileTypes;

    uuid;

    firstLineMatch;


    /**
     * get engine formatter
     * @var {null|{resolve(name:string):PatterMatchErrorInfo}}
     */
    static get EngineFormatter() {
        return sm_engine_formatter;
    }
    /**
     * set the engine formatter
     */
    static set EngineFormatter(value) {
        sm_engine_formatter = value;
    }

    /**
     * set global engine
     */
    static get GlobalEngine() {
        return sm_globalEngine;
    }
    /**
     * set global engine
     */
    static set GlobalEngine(v) {
        sm_globalEngine = v;
    }

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

        /**
         * get or set the listener info
         */
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

    skipFormat() {

        if (!('skip_r' in this)) {
            const q = this;
            (function () {
                let _skip = true;
                Object.defineProperty(q, 'skip_r', {
                    get() {
                        return _skip;
                    },
                    set(v) {
                        _skip = v;
                    }
                });
            })();
        }

    }
    // + | ------------------------------------------------------------------------
    // + | raise event 
    // + | 
    onAppendToBuffer(_marker, _buffer, option) {
        this.formatting?.onAppendToBuffer(this, _marker, _buffer, option);
        // + | ---------------------------------------------------------------------
        // + | reset flag every time something append to buffer
        // + |
        option.startLine = false;
        option.lineFeedFlag = false;
        option.blockStart = false;
        option.matchTransform = null;
    }
    /**
     * get the line feed
     */
    get lineFeed() {
        return this.m_option.lineFeed;
    }
    /**
     * set the line feed
     */
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
    /**
     * 
     * @param {*} parser 
     * @param {*} fieldname 
     * @param {*} data 
     * @param {*} refKey 
     * @returns 
     */
    json_parse(parser, fieldname, data, refKey) {
        const _pattern_class = parser.patternClassName || Patterns;
        const patterns = Utils.ArrayPatternsFromParser(parser, Patterns, RefPatterns);
        const parse = {
            debug(d) {
                if (typeof (d) == 'boolean') {
                    if (d) {
                        return FormatterDebugger.DebugAll();
                    }
                    return null;
                }
                return FormatterDebugger.Load(d);
            },
            lintErrors(d, parser) {
                const _lints = {};
                for (let i in d) {
                    let s = d[i];
                    let lint = new FormatterLintError;
                    lint.code = parseInt(i);
                    if (typeof (s) == 'string') {
                        lint.message = s;
                    } else {
                        const { message, fix, concept } = s;
                        lint.fix = fix;
                        lint.message = message;
                        lint.concept = concept;
                    }
                    _lints[i] = lint;
                }
                return _lints;
            },
            patterns,
            repository(d, parser) {
                let _out = {};
                let _o = null;
                const { registry } = parser;
                for (let i in d) {
                    _o = new _pattern_class();
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
            },
            tokens(d, parser) {
                if (Array.isArray(d)) {
                    return d;
                }
                return null;
            }
        };
        let fc = parse[fieldname];
        if (fc) {
            return fc(data, parser, refKey);
        }
        return data;
    }
    /**
     * create and load the formatting marker 
     * @param {string} name 
     * @param {undefined|string|InjectedClass} pattern_class_name 
     * @returns {null|Formatters}
     */
    static Load(name, pattern_class_name) {
        const data = require("../formatters/" + name + ".btm-syntax.json");
        if (data) {
            return Formatters.CreateFrom(data, pattern_class_name)
        }
        return null;
    }
    /**
     * create module from btm-format
     * @param {*} data btn-format data 
     * @param {undefined|string|InjectedClass} pattern_class_name 
     * @returns {null|Formatters}
     */
    static CreateFrom(data, pattern_class_name) {
        const _names = {};
        let _registryExpression = null;
        NativeRegExp.Save();
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
        }, pattern_class_name);
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
                i.split(' ').forEach(m => {

                    Utils.DefineProp(m, undefined, registry);
                    let n = m.split('.')[0];
                    if (_entry.indexOf(n) == -1) {
                        _entry.push(n);
                    }
                });
            }
            _registryExpression = { namespaces: _entry, registry };
            return _registryExpression;
        };
        if (!formatter.settings) {
            formatter.settings = new FormatterSetting();
        }

        Object.defineProperty(formatter, 'formatting', { get() { return formatter.settings.getCodingStyleFormatting(); } });
        Object.defineProperty(formatter, 'registryClassName', { get() { return pattern_class_name; } });
        NativeRegExp.Restore();
        return formatter;
    }
    static CreateDefaultOption() {
        return new FormatterSetting;
    }
    #createListener() {
        const { listener } = this;
        let _o = null;
        if (listener) {
            if (typeof (listener) == 'function')
                // + | invoke function listener creator
                _o = listener.apply(this);
            else
                _o = listener;
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

        let _listener = this.#createListener();

        let _formatterBuffer = new FormatterBuffer;
        _formatterBuffer.id = '_global_';
        const m_constants_def = {
            PrevLineFeedConstant: new PrevLineFeedConstantPattern,
            PrevConstant: new PrevConstantPattern,
            GlobalConstant: new GlobalConstantPattern,
            StreamLineConstant: new StreamLineConstantPattern,
            StreamBufferConstant: new StreamBufferConstantPattern
        };
        let objClass = new FormatterOptions(this, _formatterBuffer, _listener, m_constants_def, _rg);
        this._storeObjClass(objClass);
        return objClass;
    }
    /**
     * transform data to 
     * @param {string|string[]} data 
     * @param {string} target
     * @param {*} option 
     */
    transformTo(data, target, option) {
        throw new Error('transform not implement');
    }
    _initDebug() {
        let { debug } = this;
        if ((!debug === null) || (debug == undefined) || (debug instanceof FormatterDebugger))
            return;
        if (typeof (debug) == 'boolean') {
            debug = debug ? FormatterDebugger.DebugAll() : null;
        } else if (debug && !(debug instanceof FormatterDebugger)) {
            debug = FormatterDebugger.Load(debug);
        } else
            debug = null;
        this.debug = debug;
    }
    /**
     * format the data
     * @param {string|string[]} data 
     * @param {*} option format option 
     * @returns 
     */
    format(data, option) {
        this._initDebug();
        NativeRegExp.Save();

        if (!Array.isArray(data)) {
            if (typeof (data) == 'string') {
                data = data.split("\n");
            }
            else throw new Error('argument not valid');
        }
        if (typeof (this.scopeName) == 'undefined') {
            throw new Error('scopeName is not defined');
        }
        /**
         * @type {FormatterOptions}
         */
        let objClass = this.objClass;
        if (!objClass) {
            objClass = this.#initDefinition(option);
        } else {
            if (this.info.isSubFormatting == 0) {
                objClass.reset();
            }
        }
        let _matcherInfo = null;
        let _formatter = this;
        let _trimStart = true;
        // let pos = 0;
        const { debug, lineFeed } = objClass;
        const { tabStop, useIndent } = this.settings;

        if (!this.info?.isSubFormatting) {
            objClass.blockStarted = false;
        }
        if (this.info?.isSubFormatting) {
            _trimStart = false;
        }
        // option = objClass;
        // + | ------------------------------------------------------------
        // + | START : FORMATTER LOGIC
        // + | ------------------------------------------------------------
        const _output_fc = () => {
            const { formatting } = _formatter;

            function _update_start_line_flag(_start_line_flag, option) {
                const { pos } = option;
                if (!_start_line_flag && option.skipMarkerFlag && (option.range.start < pos)) {
                    let _l = option.line.substring(option.range.start, pos);
                    if (_l.trim().length > 0)
                        option.appendToBuffer(_l, option.constants.GlobalConstant);
                    option.storeRange(pos);
                    option.skipMarkerFlag = false;
                }
            }
            const _is_sub_formatting = _formatter.info.isSubFormatting > 0;
            const {lineMatcher} = objClass; 
            data.forEach((line) => {
                let _start_line_flag = false; // flag to handle end streaming content
                if (this.skip_r) {
                    return;
                }
                /**
                 * @type {FormatterOptions} 
                 */
                const option = objClass;
                debug?.feature('read-line') && Debug.log('read:[' + objClass.lineCount + "]:::" + line);
                objClass.resetRange();
                lineMatcher.sourceLine = line;
                objClass.line = line;
                objClass.pos = 0;
                objClass.continue = false;
                objClass.lineCount++;
                objClass.markerDepth = 0;
                objClass.startLine = true;


                if (_matcherInfo) {
                    if (!_matcherInfo.marker.allowMultiline) {
                        throw new Error(`marker '${_matcherInfo.name}' do not allow multi line.`);
                    }
                    objClass.continue = _matcherInfo.marker.newLineContinueState;
                    objClass.lineJoin = false;
                    _matcherInfo = _formatter._handleMarker(_matcherInfo, objClass);

                } else {
                    let _nextLine = (_trimStart && !useIndent ? objClass.line.trimStart() : objClass.line);
                    if (objClass.nextGlueValue){
                        _nextLine = objClass.nextGlueValue + _nextLine; 
                        objClass.nextGlueValue = null;
                    }
                    objClass.line = _nextLine; 
                    // update the source line
                    lineMatcher.sourceLine = objClass.line;
                    _trimStart = true;
                }
                if (line.length <= 0) {
                    return;
                }
                let ln = objClass.length;
                let pos = objClass.pos;
                _formatter._updateLineFeed(objClass);
                while (pos < ln) {
                    objClass.continue = false;
                    _start_line_flag = true;
                    objClass.markerDepth = 0;
                    if (_matcherInfo) {
                        objClass.continue = true;
                        objClass.storeRange(objClass.pos);
                        _matcherInfo = _formatter._handleMarker(_matcherInfo, objClass);
                    } else {
                        _matcherInfo = Utils.GetPatternMatcher(this.patterns, objClass);
                        if (_matcherInfo) {
                            this._updateLineFeed(objClass, objClass.startLine);
                            objClass.storeRange(pos, _matcherInfo.index);
                            _matcherInfo = _formatter._handleMarker(_matcherInfo, objClass);
                            _update_start_line_flag(false, objClass);
                        } else {
                            objClass.markerDepth = 0;
                            let p = objClass.line.substring(objClass.pos);
                            if (!_is_sub_formatting)
                                p = p.trimEnd();
                            if (objClass.lineFeedFlag) {
                                p = _trimStart && !useIndent ? p.trimStart() : p;
                            }
                            if (p.length > 0) {
                                this._updateLineFeed(objClass, objClass.startLine);
                                objClass.appendToBuffer(p, objClass.constants.GlobalConstant);
                            }
                            objClass.pos = ln;
                        }
                    }
                    pos = objClass.pos;
                    ln = objClass.length; 
                    if (this.skip_r) {
                        return;
                    }
                    _update_start_line_flag(_start_line_flag, objClass);
                }
                _update_start_line_flag(_start_line_flag, objClass);

                objClass.lineJoin = true;
                if (_matcherInfo) {
                    if (ln >= pos) {
                        objClass.EOL = true;
                        _matcherInfo = _formatter._handleCheckCloseMarker(_matcherInfo, objClass);
                        objClass.EOL = false;
                    } else {
                        this._updateMarkerFormatting(_matcherInfo, objClass);
                    }
                }
                formatting.updateEndLineUpdateMode(_matcherInfo, option);
            });
            if (this.skip_r) {
                this.skip_r = false;
                return null;
            }
            ((option) => {
                // + | close matcher 
                if (_matcherInfo) {
                    if (!this.info.isSubFormatting) {
                        debug && Debug.log('...EOF...' + _matcherInfo.toString());
                        option.EOF = true;                       
                        option.lineMatcher.reset();
                        let _start = false;
                        let _marker_info = option.peekMarkerInfo;
                        while (_matcherInfo) { // close matcher - handle 
                            if (_start) {
                                _marker_info = option.peekMarkerInfo;
                            }
                            _matcherInfo = _formatter._handleMarker(_matcherInfo, objClass);
                            _start = true;
                        }
                        option.EOF = false;
                    } else {
                        throw new Error('missing close definition');
                    }
                }
            })(objClass);

            debug?.feature('end') && (() => {
                Debug.log('...end...');
                console.log({
                    depth: objClass.depth
                });
            })();
            if ((objClass.markerInfo.length > 0) && (this.info.isSubFormatting == 0)) {
                const _formatting = this.formatting;
                // missing close marker info 
                while (objClass.markerInfo.length > 0) {
                    let _old = objClass.shiftMarker();
                    this._handleLastExpectedBlock(_old, objClass, _formatting);
                }

            } else {
                objClass.markerInfo.length = 0;
            }
            objClass.store();
            let _output = "";

            if (!this.info?.isSubFormatting && (objClass.tokenList.length > 0)) {
                throw new Error('token list have childs');
            }
            if (!this.info?.isSubFormatting && this.listener) {
                // * call end listener 
                const { listener } = this.objClass;
                const { endContent, endOutput, treatOutput } = listener;
                if (treatOutput) {
                    _output = listener.treatOutput({ output: objClass.output, lineFeed, tabStop, option: this.objClass });
                } else {
                    _output = objClass.output.join(lineFeed).trimEnd();
                }
                if (endOutput) {
                    _output += listener.endOutput({ lineFeed });
                }
                if (endContent) {
                    _output += listener.endContent();
                }
            } else {
                _output = objClass.output.join(lineFeed);
                if (!this.info?.isSubFormatting) {
                    _output = _output.trimEnd();
                }
            }
            // + | clear buffer list  
            this.objClass.formatterBuffer.clearAll();
            return _output;
        };
        let _output = null;
        try {
            _output = _output_fc();
        } catch (e) {
            if (this.error) {
                if (!Array.isArray(this.error)) {
                    this.error = [this.error];
                }
                this.error.push(e.message);
            }
            else {
                this.error = e.message;

            }
            debug && console.error('Error : ' + e.message);
        }
        NativeRegExp.Restore();
        return _output;
    }
    _updateLineFeed(option, startLine = false) {
        if (option.skipUpdateStartLine) {
            option.skipUpdateStartLine = !1;
            return;
        }
        option.startLine = startLine;
        if (option.lineFeedFlag) {
            if (!option.formatterBuffer.isEmpty) {
                option.store();
                option.lineFeedFlag = !1;
            }
            option.startLine = true;
        }
    }
    /**
     * check for closing do not update markerInfo - specification 
     * @param {*} patternInfo 
     * @param {FormatterOptions} option 
     */
    _handleCheckCloseMarker(patternInfo, option) {
        const { debug } = option;
        debug && Debug.log("---::check close marker::---" + patternInfo.toString());
        let _p = null;
        let _matcher = null;
        let _line = option.line.substring(option.pos);
        // for check get and check if _old is avaiable 
        // let _old = (markerInfo.length > 0) && (markerInfo[0].marker == patternInfo) ? markerInfo[0] : null;
        ({ _p, _matcher } = this.detectPatternInfo(_line, patternInfo, option));
        if (_p && (_matcher == null)) {
            return this._handleMarker(patternInfo, option);
        }
        if (_p && _matcher) {
            if (_matcher.group.index == _p.index) {
                // + | priority to pattern info
                // + | ---------------------
                let _tpret = this._handleMarker(patternInfo, option);
                // + | same group end - 
                // let _tret = this._handleSameGroupMatch(_matcher, option);

                return _tpret;

            } else {
                return this._handleMarker(_matcher, option);
            }
        } else if (_matcher){
            // + | a matcher that target end on line
            return this._handleMarker(_matcher, option);
        }
        return patternInfo;
    }
    _handleSameGroupMatch(_matcher, option) {
        this._checkStartBlockDefinition(_matcher, option);
        let _ref = this._handleMarker(_matcher, option);
        return _ref;
    }
    /**
     * update marker formatting mode
     * @param {*} _marker 
     * @param {*} option 
     * @param {*} force 
     */
    _updateMarkerFormatting(_marker, option, force=false) {
        // | update formatting 
        const { formatting } = this;
        if (_marker.formattingMode) {
            formatting.formatBufferMarker(this, _marker, option, force);
        } else {
            this._updateNextMode(option, _marker, force);
        }
    }
    updateBuffedValueAsToken(_buffer, _marker, option) {
        option.formatterBuffer.clear();
        option.appendToBuffer(_buffer, _marker);
        option.store();
        _buffer = option.flush(true);
        option.formatterBuffer.appendToBuffer(_buffer, _marker);
    }
    _lastExpectedMatchResult(marker, option, _old) {
        const _formatting = this.formatting;
        const { endMissingValue, group, isEndCaptureOnly } = marker;
        let _p = [];
        let regex = '';


        if (!isEndCaptureOnly) {
            if ((endMissingValue != undefined) && (endMissingValue !== null)) {

                if (endMissingValue instanceof FormatterEndMissingExpression) {
                    const engine = FormatterEndMissingEngine.Get(this.scopeName);
                    // _value = _old?.data.dataSegment.join('') || group[0];
                    let _cvalue = endMissingValue.load(group,
                        (s) => Utils.ReplaceRegexGroup(Utils.RegExToString(s), group),
                        engine, _old?.data, marker, option);
                    if (_old) {
                        // + update value - content value
                        _old.content = _cvalue;
                        _p = Utils.CreateEndMatch('');
                        return _p;
                    }
                } else {
                    regex = Utils.ReplaceRegexGroup(endMissingValue, group);
                }
            } else {
                if (_old && _old.marker.end.toString() != "/$/d")
                    regex = Utils.ReplaceRegexGroup(Utils.RegExToString(marker.end), group);
            }
            //remove escaped litteral
            regex = regex ? regex.replace(/\\/g, "") : '';
        }
        _p.push(regex);
        _p.indices = [[0, regex.length]];
        _p.index = 0;
        _p.input = '\0';
        return _p;
    }
    _handleLastExpectedBlock(_old, option, _formatting) {

        const { marker } = _old;
        const _group = marker.group;
        if (marker.marker.throwErrorOnEndSyntax) {
            throw new Error('invalid syntax');
        }
        if (marker.isEndCaptureOnly) {
            return;
        }
        let regex = '';
        const line = option.line;
        let _append = line.substring(_group.index);

        if (_old.marker.end.toString() != "/$/d")
            regex = Utils.ReplaceRegexGroup(Utils.RegExToString(marker.end), _group, 'end');
        regex = regex.replace(/\\/g, ""); //remove escaped litteral
        _formatting.onLastExpectedBlockStart({ option, _old });
        let _p = [];
        let f = null;
        _p.push(regex);
        _p.indices = [[0, regex.length]];
        _p.index = 0;
        if (marker.isBlock) {
            option.line = regex;
            option.pos = 0;
            let _buffer = option.buffer;
            f = _formatting.onLastExpectedBlock({
                mode: marker.mode,
                buffer: _buffer,
                option: option,
                formatter: this
            });

            f = f == null ? _old.content + option.flush(true) : f;
            return this._handleFoundEndPattern(f, regex, marker, _p, option, _old);
        }

        const _ln = _append.length;
        _p.index = _ln;
        _append += regex;
        option.pos = _ln;
        option.storeRange(_ln);
        return this._handleFoundEndPattern('', _append, marker, _p, option, _old);
    }

    _isBlockAndStart(_marker, option) {
        return _marker.isBlock && !option.continue;
    }

    /**
     * 
     * @param {FormatterOptions} option 
     */
    _startBlock(option) {
        option.depth++;
        const { output, tabStop, depth, formatterBuffer, listener } = option;
        if (typeof (listener?.startNewBlock) == 'function') {
            listener.startNewBlock({ buffer: '', formatterBuffer, output, tabStop, depth });
        }
        // + | 
        // + | begin start block 
        // + | 
        option.startBlock = true;
    }
    /**
     * get new tokens array 
     * @returns 
     */
    getTokens() {
        return [this.scopeName];
    }
    /**
     * get Marker captures depending on markerInfo
     * @param {CaptureInfo|PatternMatchInfo} _markerInfo 
     * @param {*} end 
     * @returns 
     */
    getMarkerCaptures(_markerInfo, end = false) {

        if (_markerInfo instanceof CaptureInfo) {
            return _markerInfo.captures;
        }
        const { marker } = _markerInfo;
        if (!marker) {
            return null;
        }
        const _type = marker.matchType;
        if (_type == 0) {
            const s = end ? marker.endCaptures : marker.beginCaptures;
            return { ...marker.captures, ...s };
        }
        return { ...marker.captures };
    }

    /**
     * register token name
     * @param {PatternMatchInfo} marker 
     * @param {FormatterOptions} option 
     */
    _registerTokenName(marker, option) {
        const { name, isShiftenName, matchType } = marker;
        const { tokenList } = option;
        //+ | add token to global token list 
        if (name && (matchType == 0) && (!isShiftenName)) {
            Utils.StoreTokens(name, tokenList);
            marker.isShiftenName = true;
        }
    }
    _updatePrevPatternPrevConstant(_marker, option){
        this._updatePatternPrevConstant(_marker, option);
        option.storeRange(option.pos);
    }
    /**
     * core handle marker handle marker 
     * @param {PatternMatchInfo} _marker 
     * @param {*} option 
     */
    _handleMarker(_marker, option) {
        if (!_marker) return;
        if (!option.continue) {
            this._updatePrevPatternPrevConstant(_marker, option);
        }

        const { matchType } = _marker.marker;
        this._registerTokenName(_marker, option);
        option.markerDepth++;
         // + | each callback must return a marker or null 
        const handle = this._handleCallback(matchType, option) ||
            ((m, option) => m.handleMarkerListener ? m.handleMarkerListener(option) : null)(_marker.marker, option);
        if (!handle || (typeof (handle) != "function")) {
            throw new Error("marker type handler is not a valid callback." + matchType);
        }
        let ret = handle.apply(this, [_marker, option]);
        this._updateFormatModeFromTo(_marker, ret, option);
        return ret;
    }
    /**
     * replace with condition 
     * @param {PatternMatchInfo} _marker 
     * @param {*} value 
     * @param {*} group 
     * @param {*} option 
     * @param {*} _refObj 
     * @param {boolean} treat 
     * @returns 
     */
    _operationReplaceWith(_marker, value, group, option, _refObj, treat=true) {
        let _formatter = this;
        const { replaceWith, replaceWithCondition } = _marker;
        let g = group;
        _refObj = _refObj || {};
        if (!replaceWith) {
            _refObj.replaced = false;
            return value;
        }
        let _tab = replaceWith;

        if (_tab instanceof ReplaceWithCondition) {
            _tab = [_tab];
        }
        if (Array.isArray(_tab)) {
            _tab = _tab.slice(0);

            // + array of replace with conditions
            while (_tab.length > 0) {
                const q = _tab.shift();
                const { expression, match, captures } = q;
                if (!expression) {
                    // + | skip missing expression
                    continue;
                }
                if (match) {
                    const _p = { replaced: true, g, _rpw: null };
                    const tvalue = Utils.ReplaceWithCheck(expression, value, q, _p);
                    if (_p.replaced) {
                        const { _rpw } = _p;
                        value = Utils.DoReplaceWith(tvalue, _formatter, _rpw, g, _marker, option, captures, treat);

                        return value;
                    }
                }
            }
        }
        else {
            let _rpw = Utils.RegExToString(replaceWith);
            const _cond = replaceWithCondition;
            let match = _cond?.match;
            const _captures = _cond?.captures;

            if (match) {
                let _op = _cond.operator || '=';
                let _s = Utils.ReplaceRegexGroup(_cond.check, g);
                if (/(!)?=/.test(_op)) {
                    let r = match.test(_s);
                    if (_op) {
                        if (((_op == '=') && !r) || ((_op == '!=') && (r))) {
                            _refObj.replaced = false;
                            return value;
                        }
                    }
                } else if (/(\<\>)=/.test(_op)) {
                    let _ex = match.toString().replace(/\\\//g, '');
                    if (
                        ((_op == ">=") && (_s >= _ex)) ||
                        ((_op == "<=") && (_s <= _ex))
                    ) {
                        if (_s >= _ex) {
                            _refObj.replaced = false;
                            return value;
                        }
                    }
                }
            }

            value = Utils.DoReplaceWith(value, _formatter, _rpw, g, _marker, option, _captures, treat);
            return value;
        }
        _refObj.replaced = false;
        return value;
    }
    /**
     * from type retrieve the handler type 
     * @param {*} type 
     * @returns 
     */
    _handleCallback(type, option) {
        // console.log("handle ::::::::::::::::::::::::::::::::::::"+type);
        return {
            "0": option.listener?.handleBeginEndMarker || this._handleBeginEndMarker,
            "1": option.listener?.handleMatchMarker || this._handleMatchMarker,
            "2": option.listener?.handleBeginWhile || this._handleBeginWhile,
            "3": option.listener?.handleMatchTransform || this._handleMatchTransform,
        }[type]
    }
    _handleMatchTransform(marker, option) {
        const { parent } = marker;
        let _cm_value = marker.group[0];
        option.matchTransform = marker;
        let op = [];
        _cm_value = this.treatMarkerValue(marker, _cm_value, op, option, marker.group);
        if (_cm_value.length > 0) {
            option.appendToBuffer(_cm_value, marker);
        }
        option.matchTransform = marker;
        return parent;

    }
    /**
     * on end handler
     * @param {PatternMatchInfo} markerInfo 
     * @param {FormatterOptions} option 
     */
    _onEndHandler(markerInfo, option) {
        const { tokenList } = option;

        if (markerInfo.isShiftenContentName) {
            this._shiftPatternContentName(markerInfo, option);
        }
        if ((markerInfo.isShiftenName) && (tokenList.length > 0)) {
            Utils.UnshiftTokens(markerInfo.name, tokenList);
            markerInfo.isShiftenName = false;
        }
    }
    /**
     * 
     * @param {*} _cm_value 
     * @param {*} _marker 
     * @param {*} option 
     * @param {FormatterMatchTreatment} _op 
     * @param {*} group 
     * @param {boolean} group match treatment
     * @returns 
     */
    _treatMatchValue(_cm_value, _marker, option, _op, group, treat = true) {
        group = group || _marker.group;
        const _ref_segment = treat ? {} : true;
        _cm_value = this.treatMarkerValue(_marker, _cm_value, _op, option, this._getMatchGroup(group), _ref_segment);
        if (treat) {
            if (_op.treated) { 
                _op.data = _ref_segment.segments.dataSegment.join('');
                return _cm_value;
            }
            const _bck = _cm_value;
            _cm_value = this._treatMatchResult(_cm_value, _op, _marker, option);
            // + | update op.data  to store data to store after match treated
            if ((_op.indexOf('replaceWith') != -1) || (_cm_value != _bck)) {
                _op.data = _bck;
            }
        }
        return _cm_value;
    }
    /**
     * treat transform capture
     * @param {*} _cm_value 
     * @param {*} _marker 
     * @param {*} _captures 
     * @returns 
     */
    _treatTransform(_cm_value, _marker, _captures) {
        const _tmatch = _marker.transformMatch || _marker.match;
        _captures = _marker.transformCaptures || _captures;
        if ((_cm_value.length > 0) && (_captures)) {

            // + passing transformed to data
            const _group = _tmatch ? _tmatch.exec(_cm_value) : null;
            if (_group) {
                // copy groups
                _group.index = _marker.group.index;
                _marker.group.length = 0;
                _marker.group.indices = _group.indices;
                _group.forEach(a => _marker.group.push(a));
            } else {
                if (_marker.matchType == 1)
                    throw new Error("failed transform error match error. use transform capture to handle")
            }
        }
        return { _captures };
    }
    _treatMatchResult(_cm_value, _op, _marker, option) {
        let _captures = _marker.captures;
        if (_op.indexOf('transform') != -1) {
            ({ _captures } = this._treatTransform(_cm_value, _marker, _captures));
        }
        if (_op.indexOf('replaceWith') == -1) {
            if (_captures) {
                _cm_value = option.treatBeginCaptures(_marker, _captures);
            }
        }
        if (_marker.patterns?.length > 0) {
            const new_value = Utils.TreatPatternValue(_cm_value, _marker.patterns, _marker.group, option);
            _cm_value = new_value || _cm_value;
        }
        return _cm_value;
    }

    _getMatchGroup(group) {
        const _formatter = this;
        return (_formatter.info.isSubFormatting > 0) ?
            _formatter.info.captureGroup : group;
    }
    _operateOnFramebuffer(_marker, option, _old) {
        return HandleFormatting.apply(this, [_marker, option, _old]);
    }
    /**
     * handle to end 
     */
    _handleToEndPattern(_marker, line, option) {
        const bck = { line: option.line, pos: option.pos };
        let _ret = null;

        if (_marker.isStreamCapture) {
            // + | Update Stream Marker Info
            this._updateMarkerOldContentOrSwapBuffer(_marker, null, '', _marker.endRegex, option);
        }
        option.line = line;
        option.pos = 0;
        option.TOEND = true;
        _ret = this._handleMarker(_marker, option);
        option.TOEND = false;
        option.line = bck.line;
        option.pos = bck.pos + option.pos;
        return _ret;
    }
    /**
     * detected array operation
     * @param {{replaceWith:string|RegExp, transform:string|string[]}} _marker 
     * @param {string} c value 
     * @param {string[]} op detected operatrion
     * @param {*} option to handle start line transform 
     * @param {*} group to handle start line transform 
     * @param {?boolean} treat to handle start line transform 
     * @returns 
     */
    treatMarkerValue(_marker, c, op, option, group, treat=true) {
        if (_marker.replaceWith) {
            // + | do replaceWith - replace 
            const _refObj = { replaced: true };
            c = this._operationReplaceWith(_marker, c, group || _marker.group, option, _refObj, treat);
            if (_refObj.replaced)
                op.push('replaceWith');
        }
        if (_marker.transform && (op.indexOf('replaceWith') == -1)) {
            // + | do transform
            c = Utils.StringValueTransform(c, _marker.transform);
            op.push('transform');
        }
        if (option && (option.startLine) && _marker.startLineTransform) {
            c = Utils.StringValueTransform(c, _marker.startLineTransform);
            op.push('startLineTransform');
        }
        return c;
    }
    /**
     * append constant
     * @param {*} patternInfo 
     * @param {string} value 
     * @param {FormatterOptions} option 
     * @param {bool} append_child append to child 
     * @param {FormatterOptions} option 
     */
    _appendConstant(patternInfo, value, option, append_child = true, constant_type_marker) {
        let { debug, listener } = option;
        let { formatting } = this;
        debug && Debug.log('--::appendConstant::--[' + value + ']');

        if (option.startBlock && (value.trim().length == 0)) {
            return;
        }


        value = formatting.treatConstantValue(value, patternInfo, option);

        let _inf = new PatternMatchInfo;
        _inf.use({ marker: constant_type_marker || option.constants.PrevLineFeedConstant, line: option.line, index: -2, formatting });
        formattingSetupPatternForBuffer(patternInfo, option);
        const fc_update = () => {
            formatting.updateBufferConstant(value, patternInfo.mode, _inf, option);
        }
        if (append_child) {
            patternInfo.childs.push(_inf);
        }
        if (listener?.appendConstant) {
            listener.appendConstant({ update: fc_update, patternInfo, data: value, option, _inf });
        } else {
            fc_update();
        }
        // + | 
        // + | missing update pattern mode from constant logic
        // + |
        patternInfo.mode = _inf.mode;
    }

    /**
     * detect an start streaming pattern 
     * @param {*} patternInfo 
     * @param {*} _line 
     * @param {*} _endRegex 
     * @param {*} option 
     * @returns 
     */
    _startStreamingPattern(patternInfo, _line, _endRegex, option, _error, _old, _buffer, end_line = false) {
        const { debug } = option;
        const { group } = patternInfo;
        let _nextOffset = option.line.length;

        debug?.feature('stream-start') && Debug.log("---::: START STREAMING :::--"+patternInfo.toString());
        // + switch depending on formatting mode
        if (patternInfo.formattingMode == 4) {
            // + | start formatting with streaming object 
            option.pos = patternInfo.index;
            const _streaming = this._createStreamConstantPattern(patternInfo, '', _endRegex, option);
            // this._updateMarkerOldContentOrSwapBuffer(patternInfo, _old, _buffer, _endRegex, option);            
            return _streaming;
        }
        // start streaming need to catch startLine before swapping buffer
        let _startLine = option.startLine;

        if (_old) {
            const _oldMarker = _old.marker;
            if ((_oldMarker != patternInfo) || (option.pos < group.index)) {
                option.storeRange(option.pos, group.index);
                this._updateStreamRangeModeToHolder(_oldMarker, option, _old);
            }
            option.markerInfo.unshift(_old);
        } else {
            _old = this._updateMarkerOldContentOrSwapBuffer(patternInfo, null, _buffer, _endRegex, option);
        }
        option.startLine = _startLine;
        if (end_line) {
            option.appendToBuffer(_line, patternInfo);
            option.pos = _nextOffset;
        } else {
            let _p, _matcher;
            ({ _p, _matcher } = this.detectPatternInfo(_line, patternInfo, option));
            if (_p && !_matcher) {

                let select = Utils.GetNextCapture(_line, patternInfo.endRegex, option);
                let _buffer = this._updateOldMarkerContent(_old, option);
                option.formatterBuffer.appendToBuffer(_buffer);
                let _endpos =  option.pos + select.index;
                option.storeRange(option.pos, _endpos);
                let _bool = option.shiftFromMarkerInfo(patternInfo, true);
                option.restoreBuffer(_bool);    
                if (option.pos!= _endpos){
                    this._updatePrevPatternPrevConstant(patternInfo, option);
                } else {
                    option.pos = _endpos;
                }
                this._onEndHandler(patternInfo, option);
                option.skipMarkerFlag = false;
                return patternInfo.parent; 
            }
            else {
                // handle the next 
                if (_matcher) {
                    this._registerTokenName(patternInfo, option);
                    return this._handleMarker(_matcher, option);
                }
            }


        }
        return patternInfo;
    }

    //------------------------------------------
    //#region handle pattern property 
    _handleInstructionSeperatorProperty(_marker, option, _e) {
        const _cm_value = _e.value;
        if (_marker.isInstructionSeparator) {
            let b = this.settings.isInstructionSeperator(_cm_value.trim());
            _e.isInstructionSeparator = b;
        }
    }
    _handleMatchCaptureDefinition(_marker, option, _e, { _old, group, match }) {
        let _cm_value = group[0];// _e.value;
        const { parent } = _marker;
        const _formatting = this.formatting;
        let b = _e.isInstructionSeparator;
        let _cond = _old && ((_cm_value.length == 0) || (_cm_value.trim().length == 0)
            && (!_formatting.allowEmptySpace(_old.marker.mode, option))) &&
            _marker.isMatchCaptureOnly;
        if (_cond) {
            _e.handle = true;
            let _gcm_value = Utils.GetNextCapture(group.input, match, option);
            _cm_value = _gcm_value[0];
            if (_marker.isInstructionSeparator) {
                b = this.settings.isInstructionSeperator(_cm_value.trim());
            }

            if (parent && (group.offset == 0)) {
                // + | match capture only definition
                if (_old && b) {
                    _formatting.onEndInstruction(_marker, option);
                }
                // + | passing to handle parent group
                if (parent.endGroup?.index == group.index) {
                    let _g = this._handleToEndPattern(parent, _cm_value.trim(), option);
                    if (b && !option.formatterBuffer.isEmpty) {
                        option.store();
                        if (_marker.isBlock) {
                            // + | close block 
                            _g = this._closeBlockEntry(option, _marker, _g, _marker.closeParentData);
                        }
                    }
                    return _g;
                }
                if (_marker.closeParent) {
                    return this._closeMarker(_marker, parent, option, _marker.closeParentData);
                }
            }//
            return parent;
        }
    }
    appendJoinToBuffer(value, option) {
        option.appendToBuffer(value, new JoinMarkerPattern());
    }
    _storeMatchValueHandler(_marker, option, _e, _extra) {
        const { _op, _old, _skip_value } = _extra;
        let _cm_value = _e.value;
        let _data = _e.data;
        const { debug, formatterBuffer} = option;
        const _formatting = this.formatting;
        const b = _e.isInstructionSeparator || false;
        const _is_join = option.joinWith && option.startLine;
        const _store_to_buffer = function (_cm_value, _data, option) {
            if (_data != undefined) {
                const s = { buffer: _cm_value, data: _data };
                Utils.UpdateMarkedSegment(s, _marker);
              
                debug.feature('match-value-handler') && (()=>{
                    Debug.log('inject value handler '); 
                    console.log(s);
                })();
                formatterBuffer.appendToBuffer(s);
            } else {
                option.appendToBuffer(_cm_value, _marker);
            }
        };

        if (b || (!_marker.lineFeed) || (option.buffer.length > 0) || (_cm_value.length > 0)) {

            if (_op.indexOf('replaceWith') == -1) {
                if (_is_join) {
                    // join entry with join value
                    this.appendJoinToBuffer(option.joinWith, option);

                }
                _store_to_buffer(_cm_value, _data, option);

            } else {
                if ((option.glueValue == _cm_value)) {
                    this._onEndHandler(_marker, option);
                    return _marker.parent;
                }
                // + | check to add empty space before append.
                if (!option.skipEmptyMatchValue || (_cm_value.trim().length > 0)) {
                    if (_is_join) {
                        // join entry with join value
                        option.formatterBuffer.appendToBuffer(option.joinWith);
                    }
                    _store_to_buffer(_cm_value, _data, option);
                    if (option.skipEmptyMatchValue) {
                        option.skipEmptyMatchValue = false;
                    }
                }
            }
            if (_old && b) {
                _formatting.onEndInstruction(_marker, option);
            }
            option.useGlue(_marker, _cm_value);
            this._updateJoinWith(_marker, option);
            _e.storeValue = true;
            this._updateNextMode(option, _marker);
        }
    }
    _updateJoinWith(_marker, option) {
        if (_marker.joinWith) {
            option.joinWith = _marker.joinWith;
        } else {
            option.joinWith = null;
        }
    }
    //#endregion
    //------------------------------------------


    //-------------------------------------------
    //#region MATCH AND BEGIN/END START HANDLER 

    _handleChainHandler(_marker, _chains_match, _e_args, option) {
        while (_chains_match.length > 0) {
            let _handle = _chains_match.shift();
            let _fc = null;
            let _target = null;
            let _cparent = null;
            let _extra_args = null;

            if (Array.isArray(_handle)) {
                _fc = _handle[1];
                _target = _handle[0];
                _extra_args = (2 in _handle) ? _handle[2] : null;
            }
            if (_fc) {
                _cparent = _fc.apply(_target, [_marker, option, _e_args, _extra_args]);
                if (_e_args.handle) {
                    if (_e_args.udpateChild) {
                        this._updateMarkerChild(_marker);
                    }
                    this._onEndHandler(_marker, option);
                    return _cparent;
                }
            }
        }
    }
    _updateOldEntryCapture(_old, _cm_value, option) {
        if (_old && _old.captureEntry) {
            _cm_value = _old.captureEntry + _cm_value;
            _old.captureEntry = null;

            option.saveBuffer();
            option.appendToBuffer(_cm_value, _old.marker);

            _cm_value = option.buffer;
            option.formatterBuffer.clear();
            option.restoreSavedBuffer();
            _old.childs.push(new EntryCapturePattern(_cm_value));

        }
        return _cm_value;
    }

    /**
     * onMatch handle affect only on content match
     * @param {*} _marker 
     * @param {*} option 
     * @returns 
     */
    _handleMatchMarker(_marker, option) {
        // + | - handle :match/match
        option.debug?.feature('match/match') && Debug.log('---::: Handle match marker :::--' + _marker.toString());
        option.state = 'match';
        const { parent, group, match, closeParentData } = _marker;
        // const _formatting = this.formatting;
        const _old = option.parentMatcherInfo;
        let _cm_value = group[0];
        let _next_position = group.index + group.offset;
        let _checkParentInfo, _endCaptureCallback;



        if ((option.pos == _next_position) && (!_marker.closeParent)) {
            // + | update marker formatting
            if (_marker.formattingMode){
                this._updateMarkerFormatting(_marker, option, true);
                option.lastEmptyMarkerPattern = _marker;
                return this._invokeCheckParent(_checkParentInfo, _endCaptureCallback, option, _marker.parent);
            }
            return this._handleStopMarker(_marker, option);
        }
        _cm_value = this._updateOldEntryCapture(_old, _cm_value, option);
        // + | update cursor position
        option.pos = _next_position;
        const _op = FormatterMatchTreatment.Init(_cm_value);
        // + | store update .data

        // + | treat match value
        _cm_value = this._treatMatchValue(_cm_value, _marker, option, _op);

        // + skip empty value
        const _fake_empty = _cm_value.trim().length == 0;
        const _option_glue = option.glueValue;

        let _skip_value = ((option.startLine && _fake_empty)) ||
            (_option_glue && (_option_glue == _marker.isGlueValue)) ||
            (_option_glue && (_option_glue == _cm_value)) ||
            (_cm_value == '');

        if (parent && !_skip_value && parent.isEndCaptureOnly) {
            // passing to parent 
            let _p = parent.endGroup;
            if (_p && (_next_position >= _p.index)) {
                ({ _checkParentInfo, _endCaptureCallback } = this._handleCheckParentInfo(
                    parent, _marker, _p, _old, option, '', '', group.index, "match"));
            }
        }
        // + | inject loging 
        let _e_args = {
            handle: false, value: _cm_value, 'state': 'match', udpateChild: true,
            _skip_value,
            isInstructionSeparator: false,
            data: _op.data
        };
        let _chains_match = [
            [this, this._handleInstructionSeperatorProperty],
            [this, this._handleCloseParentProperty, { closeParentData }],
            [this, this._handleMatchCaptureDefinition, { _old, group, match }],
            [this, function (_marker, option, _e) {
                if (_e._skip_value) {
                    _e.handle = true;
                    _e.udpateChild = false;
                    if (_marker.isBlock && _marker.parent) {
                        // + | close block - consider as a block definition 
                        return this._closeBlockEntry(option, _marker, _marker.parent, closeParentData);
                    }
                    if (_marker.parent) {
                        // +| update next mode with parent
                        this._updateNextMode(option, _marker.parent);
                    }
                    return _marker.parent;
                }
            }],
            [this, this._storeMatchValueHandler, { _op, _old }]
        ];
        let _ret = this._handleChainHandler(_marker, _chains_match, _e_args, option);
        if (_e_args.handle) {
            return this._invokeCheckParent(_checkParentInfo, _endCaptureCallback, option, _ret);
        }
        this._updateMarkerChild(_marker);
        // + | marker is not a line feed directive or buffer is not empty - end instruction directive
        if (!_e_args.storeValue) {
            this._storeMatchValueHandler(_marker, option, _e_args, { _op, _old });
        }
        this._onEndHandler(_marker, option);

        this.formatting.updateMatchNextFormatting(_marker, option);

        if (_marker.closeParent) {
            return this._closeMarker(_marker, parent, option, _marker.closeParentData);
        }
        return this._invokeCheckParent(_checkParentInfo, _endCaptureCallback, option, parent);
    }
    _updateNextMode({ nextMode }, marker) {
        nextMode = marker.mode;
        arguments[0].nextMode = nextMode;
    }
    /**
     * shift pattern content name
     * @param {*} patternInfo 
     * @param {*} option 
     */
    _shiftPatternContentName(patternInfo, option) {
        const { tokenList } = option;
        const name = patternInfo.contentName;
        if (name && patternInfo.isShiftenContentName) {
            if ((tokenList.length > 0)) {
                Utils.UnshiftTokens(name, tokenList);
                patternInfo.isShiftenContentName = false;
            }
            else {
                throw Error('missing contentName');
            }
        }
    }
    /**
     * unshift pattern content name 
     * @param {*} patternInfo 
     * @param {*} option 
     */
    _unshiftPatternContentName(patternInfo, option) {
        const { tokenList } = option;
        const name = patternInfo.contentName;
        if (name && !patternInfo.isShiftenContentName) {
            Utils.StoreTokens(name, tokenList);
            patternInfo.isShiftenContentName = true;
        }
    }

    /**
     * move entryBuffer to parent definition 
     * @param {*} marker
     * @param {FormatterOptions} option
     */
    _updateBlockMarkerPropertyContent(marker, option) {
        const _old = option.peekMarkerInfo;
        const _entryBuffer = _old.entryBuffer;
        let _content = _old.content;
        let _marker = _old.marker;
        let _new_v = _content.startsWith(_entryBuffer) ? _content.substring(_entryBuffer.length) : _content;

        const { formatting } = this;
        const { bufferSegment, dataSegment } = _old.data;
        if (_entryBuffer.length > 0) {
            let idx = bufferSegment.indexOf(_entryBuffer);
            const data = dataSegment[idx];
            // passing to entry buffer 
            _old.state.formatterBuffer.appendToBuffer({ buffer: _entryBuffer, data });
            let _count = 0;
            while (idx >= 0) {
                dataSegment.shift();
                bufferSegment.shift(); 
                idx--;
                _count++;
            }
            FormatterBuffer.ReduceBufferSegmentIndex(_count, bufferSegment); 
            FormatterBuffer.TreatMarkedSegments({dataSegment, bufferSegment}, 'trimmed'); 
        }

        _old.useEntry = false;
        _old.blockStarted = true;
        _marker.isBlockStarted = true;
        this._initUpdatedisBlockStartInformation(marker, option);
        if (_new_v.length > 0) {
            // + | prefix with line fied
            option.saveBuffer();
            option.appendExtraOutput();
            // option.formatterBuffer.appendToBuffer({ buffer: _new_v, data: dataSegment.join('') });
            option.formatterBuffer.appendToBuffer({ dataSegments: dataSegment, bufferSegments:bufferSegment});//  _new_v, data: dataSegment.join('') });
            option.store();
            const _buffer = option.flushAndData(true);
            option.restoreSavedBuffer();
            _new_v = _buffer.buffer;
            // update data segment
            FormatterBuffer.ClearSegments({bufferSegment, dataSegment}); 
            bufferSegment.push(_buffer.buffer);
            dataSegment.push(_buffer.data);


        }
        _old.content = _new_v;
        _old.useEntry = false;
        _old.startBlock = 0;
        formatting.startBlock(_old);
    }
    /**
     * handle marker info 
     * @param {PatternMatchInfo} patternInfo 
     * @param {*} option 
     * @returns 
     */
    _handleBeginEndMarker(patternInfo, option) {
        option.state = 'begin/end'; const { formatting } = this;
        const { debug, line, markerInfo } = option;
        const { parent, lineFeed } = patternInfo;
        debug?.feature('match/begin-end') && Debug.log('--::: begin/end - handle marker :::---#' + patternInfo.toString());

        let _endRegex = null;
        let _start = true;
        let _line = '';
        let _old = null;
        let _buffer = null;
        let _p, _matcher, _error;

        // get _old marker to continue matching selection  

        if ((markerInfo.length > 0) && (_old = option.shiftFromMarkerInfo(patternInfo, false))) {
            _start = false; // update the marker to handle start definition
            _buffer = this._updateOldMarkerContent(_old, option);
        } else if (patternInfo.start) {
            // + | if (transform treat  )
            let _captures = null;
            let _startOutput = { buffer: null, data: null};
            if (patternInfo.transform) {
                // treat match value before 
                let _cm_value = patternInfo.group[0];
                let _op = [];
                _startOutput.data = _cm_value;
                _cm_value = this._treatMatchValue(_cm_value, patternInfo, option, _op, null, false);
                if (_op.indexOf('transform') != -1) {
                    _captures = patternInfo.transformCaptures || null;
                    ({ _captures } = this._treatTransform(_cm_value, patternInfo, _captures));
                }
                // + | update start input 
                _startOutput.buffer= _cm_value;
            }
            // _captures = _captures || Utils.BeginCaptures(patternInfo);
            // + | treat begin captures and update buffer
            const _outdefine = {};
            if (option.treatBeginCaptures(patternInfo, _captures, _outdefine) == undefined) {
                if (_startOutput.buffer.length > 0) {
                    _startOutput.buffer= option.treatValueBeforeStoreToBuffer(patternInfo, patternInfo.startOutput);
                }
            } else {
                _startOutput.buffer =  patternInfo.startOutput;
                _startOutput.data =  _outdefine;
            }

            patternInfo.start = false;
            if (patternInfo.isBlock) {
                // - on base start width K_R coding style 
                patternInfo.isFormattingStartBlockElement = true;
                patternInfo.blockStartInfo = {
                    depth: option.depth
                }
                // +| get formatting element type 
            }
            if (patternInfo.isBlockConditionalContainer){
                option.pushConditionalContainer(patternInfo);
            }
            this._updateParentProps(patternInfo, true, option);
            if (parent) {
                if (parent.isBlock && !parent.isBlockStarted && this._isChildBlock(patternInfo, option)) {
                    // + | start block so that element 
                    if (markerInfo.length > 0) {
                        this._updateBlockMarkerPropertyContent(patternInfo, option);
                    }
                }
            } else {
                if (lineFeed && (option.depth == 0)) {
                    // auto change line feed 
                    if (!option.blockStarted) {
                        option.blockStarted = true;
                    }
                }
            }
            const _mode = patternInfo.mode;
            formatting.updateStartFormatting(_mode, option);
            this._unshiftPatternContentName(patternInfo, option);
            patternInfo.startOutput = _startOutput.buffer;
            patternInfo.startData = _startOutput.data;
        } else {
            throw new Error("missing logic for : " + patternInfo);
        }
        _buffer = _start ? patternInfo.startOutput : _buffer;
        _endRegex = patternInfo.endRegex;
        _line = line.substring(option.pos);

        if (!_start && option.TOEND) {
            _p = patternInfo.endGroup || [''];
            _p.index = 0;
            return this._handleFoundEndPattern(_buffer, _line, patternInfo, _p, option, _old);
        }

        if (option.EOF) {
            // ---------------------------------------------------------------
            // END FOUND
            // ---------------------------------------------------------------
            _p = this._lastExpectedMatchResult(patternInfo, option, _old);
            _buffer = _old.content; 
            return this._handleFoundEndPattern(_buffer, _line, patternInfo, _p, option, _old);
        }

        if (_line.length == 0) {

            // check for end found - 
            ({ _p, _matcher, _error } = this.detectPatternInfo(_line, patternInfo, option));
            if (_p && ((_matcher == null) || (option.EOL))) {
                option.lineMatcher.reset();
                option.pos = _p.index;
                return this._handleFoundEndPattern(_buffer, _line, patternInfo, _p, option, _old);
            }
            this._updateMarkerOldContentOrSwapBuffer(patternInfo, _old, _buffer, patternInfo.endRegex, option);
            return patternInfo;
        }
        // treat patterns
        let _pos = option.pos;
        if (_start) {
            let _next_position = patternInfo.group.index + patternInfo.group.offset;
            // + | on start before handle 
            _pos = _next_position;
            option.pos = _next_position;
        }
        _line = line.substring(_pos);
        // + | start pattern stream capture
        if (_start && patternInfo.isStreamCapture) {
            return this._startStreamingPattern(patternInfo, _line, _endRegex, option, null, null, _buffer, false);
        }
        // + | --------------------------------------------------------        
        // + | DETECT: core match
        // + | --------------------------------------------------------
        ({ _p, _matcher, _error } = this.detectPatternInfo(_line, patternInfo, option));

        if (_error) {
            throw new Error(_error);
        }
        if (_matcher == null) {
            // no child matcher found
            if (_p == null) {

                if (patternInfo.isStreamCapture) {
                    // + | detect buffer empty - buffer detection 
                    return this._startStreamingPattern(patternInfo, _line, _endRegex, option, _error, _old, _buffer, true);
                }
                this._checkStartBlockDefinition(patternInfo, option, _old);
                // no end - found 
                // _continue_with_marker = false;
                // update cursor - start new marker and update - 
                this._updateMarkerOldContentOrSwapBuffer(patternInfo, _old, _buffer, _endRegex, option);
                if (_line.trim().length > 0) {
                    this._appendConstant(patternInfo, _line, option);
                }
                option.pos = option.line.length;
                return patternInfo;
            } else {
                // ---------------------------------------------------------------
                // END FOUND
                // ---------------------------------------------------------------
                return this._handleFoundEndPattern(_buffer, _line, patternInfo, _p, option, _old);
            }
        }
        else {

            // compared index and handle child
            if ((_p == null) || (_matcher.group.index < _p.index)) {
                this._checkStartBlockDefinition(patternInfo, option, _old);

                if (_matcher.isStreamCapture) {
                    // + | detect buffer empty - buffer detection   
                    // + | before startStream . 
                    // _old = 
                    this._updateMarkerOldContentOrSwapBuffer(patternInfo, _old, _buffer, _endRegex, option);
                    // start new stream for new 
                    return this._startStreamingPattern(_matcher, _line, _endRegex, option, _error, null, '', false);
                }
                // + | 

                // handle matcher 
                return this._handleItemFoundCallback().apply(this, [
                    _matcher, patternInfo, _old, _buffer, _endRegex, option
                ]);
            }
            // check if same 
            if (_matcher.group.index == _p.index) {
                if (_matcher.isStartOnly) {
                    // ---------------------------------------------------------------
                    // END FOUND : priority to patternInfo
                    // ---------------------------------------------------------------
                    return this._handleFoundEndPattern(_buffer, _line, patternInfo, _p, option, _old);
                }
                return Formatters.HandleSameGroup(this, patternInfo, _matcher, _p, _old, _buffer, _endRegex, option, null, _line);
            }
            // priority to current marker 
            return this._handleFoundEndPattern(_buffer, _line, patternInfo, _p, option, _old);
        }
    }
    _handleStopMarker(marker, option) {
        const { parent } = marker;
        let r = option.peekMarkerInfo;
        // + | backup 
        let { pos, line, nextMode } = option;
        let s = null;
        if (r?.marker == marker)
            this._closeMarkerByStop(marker, marker.endGroup, option);

        if (parent) {
            r = option.peekMarkerInfo;
            if (r?.marker == parent) {
                let _p = [''];
                _p.index = 0;
                _p.indices = [];
                s = this._closeMarkerByStop(parent, _p, option, {
                    _parentNextMode: nextMode
                })
            }
        }
        // + | restore 
        option.pos = pos;
        option.line = line;
        option.nextMode = nextMode;

        return s;
    }

    // #endregion
    //-------------------------------------------

    /**
     * detect logical pattern info
     * @param {string} _line 
     * @param {PatternMatchInfo} patternInfo 
     * @param {FormatterOptions} option 
     * @param {PatternMatchInfo} parentMatcherInfo to handle parent result for pattern
     * @param {bool} throwError re throw error in detection 
     * @returns 
     */
    detectPatternInfo(_line, patternInfo, option, parentMatcherInfo, throwError = true) {
        let _matcher = null;
        let _p = null;
        let _endRegex = patternInfo.endRegex;

        let _error = null;
        parentMatcherInfo = parentMatcherInfo || patternInfo;
        const { patterns } = patternInfo;
        const _call =  (patterns && (patterns.length > 0));
        const _call_update_regex = (_p, _endRegex)=>{
            _p.sourceRegex = _endRegex;
            _p.type = '_end_';
            _p.offset = _p[0].length;
        };
        try {
            _matcher = _call?Utils.GetPatternMatcher(patterns, option, parentMatcherInfo) : null;
            // if (_call && !_matcher && option.lineMatcher){
            //     _matcher = Utils.GetPatternMatcher(patterns, option, parentMatcherInfo, option.lineMatcher.subLine, option.lineMatcher.offset);
            // }
        }
        catch (e) {
            if (throwError) {
                throw e;
            }
            _error = {
                _line,
                index: e.match.index - option.pos
            }
        }
        // + | fix to end regex
        if (_endRegex) {
            //_p = _endRegex.exec(_line); 
            _p = option.lineMatcher.check(_endRegex);
            if (_p) {
                // _p.index += option.pos;
                _call_update_regex(_p, _endRegex);
            } else if (option.sourceLine != _line) {
                const {lineMatcher} = option;
                // + | possibility to detect a sub line */
                let c = RegexUtils.RemoveCaptureAndLeaveMovementCapture(RegexUtils.RegexToStringRegex(_endRegex));
                //
                let treat = null;
                if (c && c.length>0){
                    // + | treat end priority to movement capture definition 
                    const _pline = (new RegExp(c,'d')).exec(lineMatcher.subLine);
                    treat = _pline;
                }
                const _pline = _endRegex.exec(lineMatcher.subLine);
                if (_pline) {
                    if (treat && (treat.index >= _pline.length)){
                        _p = treat;
                    }else{
                        _p = _pline;
                    } 
                } else if (treat){
                    _p = _pline;
                }
                if (_p){
                    _p.index += lineMatcher.offset;
                    _call_update_regex(_p, _endRegex);
                }
            }
            patternInfo.endGroup = _p;
        }
        return { _p, _matcher, _error };
    }
    _updatePatternPrevConstant(_marker, option, _prev, offset, append_child = true) {
        _prev = _prev || option.getLineRangeContent();
        if (_prev.length > 0){
            offset = offset || 0;
            if (!option.startLine || (_prev.trim().length > 0)) {
                this._appendConstant(_marker, _prev, option, append_child);
            }
            option.pos += (offset || _prev.length);
        }
    }
    /**
     * determine that the pattern is a child block
     * @param {*} patternInfo 
     * @returns bool
     */
    _isChildBlock(patternInfo, option) {
        const { parent } = patternInfo;
        let r = false;
        const requestParentBlockCondition = parent?.requestParentBlockCondition;
        if (requestParentBlockCondition) {
            r = this._isEmptyRequestBlock({
                childs: [patternInfo],
                _marker: parent,
                condition: requestParentBlockCondition
            });
        }
        return r;
    }
    /**
     * update buffer on end
     * @param {*} _marker 
     * @param {*} option 
     * @param {*} param2 
     * @private
     * @returns 
     */
    _updateBuffer(_marker, option, { _append, _buffer, _data }) {
        const q = this;
        const { parent } = _marker;
        const { formatting } = q;
        const { formatterBuffer } = option;
        if (_buffer.length > 0) {
            // + | direct append to buffer
            formatterBuffer.storeToBuffer({_buffer,_data}, option);
            _buffer = '';
        }
        if ((_append.trim().length > 0)) {
            // + | append constant marker definition 
            if (_marker.isFormattingStartBlockElement && !_marker.newLine) {
                _marker.newLine = true;
            }
            if (parent?.isAutoBlockElement) {
                let r = option.buffer;
                option.formatterBuffer.clear();
                if (r.length > 0)
                    option.output.push(r);
                else
                    option.appendExtraOutput();
                q._appendConstant(_marker, _append, option);
                option.store();
                r = option.flush(true);
                option.formatterBuffer.appendToBuffer(r);
            }
            else {
                q._appendConstant(_marker, _append, option);
            }
            _append = '';
        }
        option.nextMode = _marker.mode;
        return { _append, _buffer };
    }
    /**
     * use to handle close parent
     * @param {*} _marker 
     * @param {*} option 
     * @param {{handle:bool}} arg 
     */
    _handleCloseParentProperty(_marker, option, arg = { handle: false }, _extra) {
        const { debug } = option;
        let _handle = false;
        let _data = _extra?.closeParentData;
        if (_data == undefined) {
            return;
        }
        let _g = null;
        debug && Debug.log('---:::CLOSE PARENT PROPERTY:::---' + _marker);
        arg.udpateChild = this._requestUpdateChild(_marker, arg.state);
        let _gparent = _marker.parent;
        if (_gparent) {
            if (_gparent.isBlock) {
                _g = this._closeBlockEntry(option, _marker, _gparent, _data);
            } else {
                _g = this._closeMarkerAndUpdate(_marker, _gparent, option, _data);
            }
        }

        _handle = true;

        arg.handle = _handle;
        return _g;
    }
    _requestUpdateChild(_marker, state) {
        if (state == 'match') {
            return (_marker.group[0].length > 0);
        }
        return true;
    }
    /**
     * close block entry
     * @param {FormatterOptions} option 
     * @param {PatternMatchInfo} _marker current marker 
     * @param {PatternMatchInfo} _parent parent
     * @param {string} data data used to close  
     * @param {boolean} store data used to close  
     */
    _closeBlockEntry(option, _marker, _parent, data = '', store = true) {
        const { formatting } = this;
        if (store && (option.depth > 0))
            option.store();
        option.depth = Math.max(--option.depth, 0);
        if (_marker && _parent) {
            return this._closeMarkerAndUpdate(_marker, _parent, option, data);
        }
    }
    _closeMarkerAndUpdate(_marker, _parent, option, data) {
        const { formatting } = this;
        let _r = this._closeMarker(_marker, _parent, option, data);
        formatting.updateEmptySkipMatchedValueFormatting(_r, option, { mode: _marker.mode, formattingMode: _parent.formattingMode });
        return _r;
    }
    _closeMarker(_marker, _g, option, data = '') {
        const { debug } = option;
        debug && Debug.log(":::CLOSEMARKER:::" + _marker);
        if (_marker?.isBlock) {
            this.formatting.closeMarker(_marker);
            _marker.isBlock = false;
        }
        if (_g) // move to parent 
        {
            const { endGroup } = _g;
            // if (endGroup==null){
            //     // - continue thru parent
            //     return _g;
            // }
            let _value = data;
            let _type = null;
            if (typeof (data) == 'object') {
                _value = data.value;
                _type = data.type;
            }

            if (endGroup && (endGroup[0] != _value)) {
                let p = _g.endRegex.exec(_value) || ((d) => {
                    d.indices = [[0, d[0].length]];
                    d.index = 0;
                    return d;
                })([_value]);

                p.index += option.pos;
                _g.endGroup = p;
            }
            _g = this._handleToEndPattern(_g, _value, option);
            let _buffer = option.buffer;
            if (_type) {
                _buffer = option.flush(true) + _buffer;
                option.appendToBuffer(_buffer, new TypeMarkerInfoPattern(_type, { parser: this.registryClassName, data }));
            } else {
                option.store();
            }
        }
        return _g;
    }
    /**
     * 
     * @param {*} parent 
     * @param {*} _marker 
     * @param {*} _p 
     * @param {*} _old 
     * @param {*} option 
     * @param {*} _buffer 
     * @param {*} _line 
     * @param {number} _next_position 
     * @param {*} state 
     * @returns 
     */
    _handleCheckParentInfo(parent, _marker, _p, _old, option, _buffer, _line, _next_position, state = 'begin/end') {

        let _endCaptureCallback;
        let _checkParentInfo;
        const _isSkipTreatEnd = option.skipTreatEnd;
        if (parent && !_isSkipTreatEnd && (parent.matchType == 0) &&
            (parent.isEndCaptureOnly || _marker.isEndCaptureOnly)) {
            // + | send to parent block
            _checkParentInfo = {
                _line,
                _marker,
                _old,
                parent,
                buffer: _buffer,
                pos: _next_position,
                line: option.line,
                endGroup: _p,
                fromChild: (!parent.isEndCaptureOnly && _marker.isEndCaptureOnly),
                state
            };
            _endCaptureCallback = this._closeNonCaptureBlock;
        }
        return { _endCaptureCallback, _checkParentInfo };
    }
    /**
     * begin/end end found
     * @param {string} _buffer current buffer presentation
     * @param {*} _line entry line
     * @param {*} _marker current marker
     * @param {*} _p end match
     * @param {FormatterOptions} option option 
     * @param {FormatterMarkerInfo} _old store information 
     * @returns 
     */
    _handleFoundEndPattern(_buffer, _line, _marker, _p, option, _old) {
        // calculate next position 
        const { debug } = option;
        const { parent } = _marker;
        let _next_position = _p.index + _p[0].length; // do not move cursor until condition meet
        let _append = option.line.substring(option.pos, _p.index);
        let _checkParentInfo = null;
        let _endCaptureCallback = null;
        const q = this;
        const _formatting = q.formatting;
        const _isSkipTreatEnd = option.skipTreatEnd;
        const prependExtra = _old?.prependExtra;

        debug?.feature('match/begin-end.end') && Debug.log(`--::: END::Begin/End handleFoundEndPattern ::--#${_marker}`);

        if (prependExtra) {
            //console.log("contain prepented");
            let r = _formatting.updatePreprendExtra(prependExtra, null, option);
            _buffer += r.extra;
            _old.prependExtra = null;
        }
        ({ _checkParentInfo, _endCaptureCallback } = this._handleCheckParentInfo(parent, _marker, _p, _old, option, _buffer, _line, _next_position));



        let _saved = false;
        if (_old == null) {
            option.saveBuffer();
            _saved = true;
        }
        this._shiftPatternContentName(_marker, option);
        let _data = _p[0]; // match data
        let _b = _isSkipTreatEnd ? '' : (() => {
            if (_p[0].length > 0) {
                let __b = option.treatEndCaptures(_marker, _p);
                if (__b == undefined) {
                    __b = option.treatValueBeforeStoreToBuffer(_marker, _p[0]);
                }
                return __b;
            }
        })() || '';

        option.skipTreatEnd = false;
        let _close_block = false;


        //const _debug_parent_is_capture_only = parent?.isEndCaptureOnly;

        // + | update parent host - check update properties for end 
        this._updateMarkerChild(_marker, option);

        // + | full fill pattern buffer 
        ({ _append, _buffer } = _formatting.onEndUpdateBuffer({
            marker: _marker,
            option,
            _buffer,
            _data: _old?.data || _marker.startData,
            update(info){
                return q._updateBuffer(_marker, option, { _append, _buffer, ...(info || {}) });
            }
        }
        ));

        // + | node division 
        if (_marker.isBlock && _marker.blockStartInfo) {
            // just remove block before store 
            // reset block value;
            _close_block = true;
            //_marker.isBlockDefinition = null;
            if (_marker.isFormattingStartBlockElement) {
                ({ _b } = _formatting.handleEndFormattingBeforeStore(q, _marker, option, _buffer, { _b }));
                _buffer = option.getBufferContent(true);
                option.output.push(_buffer);
            } else {
                _formatting.handleEndFormattingOnNonStartBlockElement(q, _marker, option);
            }
            _buffer = '';
            // + | just reduce block depth
            this._closeBlockEntry(option, _marker, null, null, false);
        } else {
            ({ _b } = _formatting.handleEndOnNonBlockElement(this, _marker, option,
                { _b, _old, data: _p[0] }
            ));
        }
        // + | append to buffer 
        if (_b.length > 0) {
            option.formatterBuffer.appendToBuffer(_b);
            _b = '';
        }

        // + | --------------------------------------------------------------------------------------
        // + | update formatting and update mode depending on current marker.formattingMode or childs
        // + | 
        this._updateMarkerFormatting(_marker, option); 

        if (_close_block) {
            option.store();
            _buffer = option.flushAndData(true);
            option.formatterBuffer.appendToBuffer(_buffer);

            // + | restore block old state
            if (_old)
                _marker.isBlock = _old.oldBlockStart;
        }
        if (_old != null) {

            // + | restore buffering then update the buffer
            if ((_old.marker == _marker)) {
                // + | save buffer 
                _buffer = option.bufferState;


                let _nextBuffer = null;
                // - so st treat buffer 
                if (!_old.useEntry && _marker.isBlock) {
                    // + | store                    
                    // option.store(false);
                    option.output.push(_buffer.buffer);
                    _buffer = option.flush(true);
                } else {
                    if (_old.useEntry && parent && !parent.isBlock && _marker.updateParentProps?.isBlock && (_old.entryBuffer.length > 0)) {
                        // + | possibility of parent child block - passing to parent 
                        ({ _buffer, _nextBuffer } = this._updatePreservedBlockBuffer(_buffer, _marker, _old, option));
                    }
                }
                option.restoreBuffer(_old);
                // passing data

                _formatting.updateEndBlockAfterRestoringBuffer(q, _marker, _buffer, _old, option);
                _buffer = '';
                if (_nextBuffer) {
                    option.peekMarkerInfo.storePrependExtra(_nextBuffer);
                }
            }
        }

        // + | view child debug
        // + | determine childs
        debug?.feature('child-counter') && (_marker.childs.length > 0) && Debug.log(`--::: Counter ::-- #${_marker.name} have ${_marker.childs.length} childs`);

        if (_marker?.parent?.newLine) {
            _marker.parent.newLine = false;
        }
        // + | update position
        option.moveTo(_next_position);
        // + | restore backup buffer
        if (_saved) {
            const _buffState = option.bufferState;
            option.restoreSavedBuffer();
            if (_buffState.buffer.length > 0) {
                // + | 
                // + | passing current data to buffer definition so it can be encapsulate
                // + | 
                option.appendToBuffer(_buffState, _marker, true, false);
            }
            if (!_close_block && (_marker.
                isFormattingStartBlockElement || _marker.isBlock)) {
                if (parent && (_marker.mode == 1)) {
                    option.store();
                }
            } else if (_close_block) {
                _formatting.updateNextSavedMode(_marker.mode, option);
            }
        }
        this._onEndHandler(_marker, option);
        // + | reset glub value      
        option.onBeginEndFound(_marker, _old);
        // + |
        // + | to update join
        this._updateJoinWith(_marker, option);

        //if (parent && (parent.childs.length ==1)){
        // only for onchilds parents. check that element is empty 
        //}
        if (parent && _marker.closeParent) {
            let _data = _marker.closeParentData;
            return this._closeMarker(_marker, parent, option, _data);
        }
        // + invoke check parent
        return this._invokeCheckParent(_checkParentInfo, _endCaptureCallback, option, parent);
    }
    _invokeCheckParent(_checkParentInfo, _endCaptureCallback, option, fallbackMarker) {
        if (_checkParentInfo && _endCaptureCallback) {
            return _endCaptureCallback.apply(this, [_checkParentInfo, option]);
        }
        return fallbackMarker;
    }
    /**
     * 
     * @param {*} _buffer 
     * @param {*} _marker 
     * @param {*} option 
     */
    _updatePreservedBlockBuffer(_buffer, _marker, _old, option) {
        const _parentInfo = option.peekMarkerInfo;
        let _nextBuffer = null;
        // const { parent } = _marker; 
        if (_buffer.indexOf(_old.entryBuffer) === 0) {
            let _ln = _old.entryBuffer.length;
            let _up = _buffer.substring(0, _ln);
            _nextBuffer = _buffer.substring(_ln);

            this._updateOldMarkerContent(_parentInfo, option, _up, '');
            _buffer = '';
        }
        return { _buffer, _nextBuffer };

    }
    _closeMarkerByStop(marker, tp, option, { _line = '' }) {
        let _old = null;
        let _endFound = this._handleFoundEndPattern;
        let _buffer = null;

        tp = tp || [''];
        if (marker.from && (option.markerInfo.length > 0)) {
            _old = option.shiftFromMarkerInfo(marker.from, true);
            _old = option.shiftFromMarkerInfo(marker, true);
            _endFound = _old.endFound || _endFound;
            marker = marker.from;
        } else {
            _old = option.shiftFromMarkerInfo(marker, true);
        }
        _buffer = _old ? this._updateOldMarkerContent(_old, option) : '';

        // let _cline = _line.substring(tp.index);
        // + | clear line input to update end buffer formatter
        option.lineMatcher.save('');    
        tp.input = '';
        tp.index = 0;
        option.skipTreatEnd = true;
        marker.endGroup = tp;
        marker = _endFound.apply(this, [_buffer, _line, marker, tp, option, _old]);
        option.skipTreatEnd = false;
        option.lineMatcher.restore();
        return marker;
    }
    /**
     * update format mode
     * @param {*} from 
     * @param {*} to 
     */
    _updateFormatModeFromTo(from, to, option) {
        const { formatting } = this;
        if (to === null) {
            // + update global mode formatting
            formatting.updateGlobalFormatting(from, option);
        } else {
            // + | move next mode to top parent
            to.mode = option.nextMode;
            if (to !== from) {
                option.lineFeedFlag = false;
            }
        }
    }
    /**
     * end non capture block
     * @param {{pos:number, line:string, buffer:string, _line: string, _old:*, endGroup}} info 
     * @param {FormatterOptions} option 
     * @returns 
     */
    _closeNonCaptureBlock(info, option) {
        const { parent, endGroup, state } = info;
        const { lineMatcher } = option;
        let p = null;
        const _line = info.line.substring(info.pos);
        const _nextPosition = option.pos;
        const _bckLine = option.line;
        let treat = false;
        let fromChild = info.fromChild;
        let tp = null;
        let _end_non_capture = (marker, tp, nextMode) => {
            let _ret_marker = this._closeMarkerByStop(marker, tp, option, { _line, nextMode });
            this._updateFormatModeFromTo(marker, _ret_marker, option);
            return _ret_marker;
        };
        let _offsetPosition = _nextPosition;
        let _is_match = state == 'match';
        if (_is_match) {
            _offsetPosition = info.pos;
        }
        let _tcline = lineMatcher.subLine;
        let _toffset = lineMatcher.offset;
        let _loopCounter = 0;
        // + | element do not  capture data 
        let _start = endGroup[0].length == 0; 
        // + | loop thru end captured data to close 
        while (_start && info.parent && (fromChild || info.parent.isEndCaptureOnly)) {
            p = info.parent;
            const { endRegex } = p;
            _loopCounter++;

            if (endRegex == null) {
                // just loop on current p;
                treat = true;
                break;
            }
            if (tp = endRegex.exec(_tcline)) {
                if (((tp.index + _toffset) == endGroup.index) && (tp[0].length == 0)) { 
                    tp.index += _toffset;
                    p = _end_non_capture(p, tp, option.nextMode);                    
                } else {
                    break;
                }
                treat = true;
            } else {
                tp = endRegex.exec(_line);
                if (tp) {
                    if ((tp.index + _offsetPosition) == endGroup.index) {
                        // + | same index - update capture continue end
                        tp.index += _offsetPosition;
                        // + 
                        if (tp[0].length == 0) {
                            // fromChild = p.isEndCaptureOnly;
                            p = _end_non_capture(p, tp, option.nextMode);
                        }
                    } else {
                        break;
                    }
                    treat = true;
                } else {
                    if (treat) {
                        if (option.EOF) {
                            p = _end_non_capture(p, null);
                            info.parent = p;
                            break;
                        } else {
                            break; // return p;
                            throw new Error('end treatment - missmatch pattern: ' + p.toString());
                        }
                    }
                    p = null;
                }
            }
            info.parent = p;
            fromChild = false;
        }

        if (_is_match && (treat) && p) {
            tp = p.endRegex.exec(_line);
            if (tp && (tp[0].length == 0) && (tp.index + _offsetPosition == endGroup.index)) {
                tp.index += _offsetPosition;
                p = _end_non_capture(p, tp);
            }
        }
        option.pos = _nextPosition;
        option.line = _bckLine;
        // if (!_start){
        // + | update end lineMatcher offset to next research will start at position
        option.lineMatcher.offset = _nextPosition;
        
        if (treat) {
            return p;
        }
        return parent;
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
            const list = expression.namespaces.filter((o) => {
                // ignore no valid name spacec
                return o.indexOf('-') == -1;
            }).join(',');
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
            marker: _marker
        });
        this._updateParentProps(_marker, false, option);
    }
    /**
     * 
     * @param {{name:string, marker:*}[]} childs 
     * @returns 
     */
    static IsChildBlock(childs) {
        let _block = false;
        childs.forEach(c => {
            _block = _block || (c.marker.isBlock);
        });
        return _block;
    }
    /**
     * 
     * @param {*} _marker 
     * @param {*} _old 
     * @param {*} _buffer 
     * @param {*} _endRegex 
     * @param {*} option 
     * @returns 
     */
    _updateMarkerOldContentOrSwapBuffer(_marker, _old, _buffer, _endRegex, option) {
        if (_old) {
            _old.content = _buffer;
            if ((option.markerInfo.length < 0) || (option.markerInfo[0] !== _old))
                option.unshiftMarker(_old);
        } else {
            if (!this.settings.useIndent) {
                //_buffer = _buffer.trimStart();
            }
            _old = this._backupMarkerSwapBuffer(option, _marker, _buffer, _endRegex);
            if (option.holdBufferState)
                option.newOldBuffers.push(_old);
        }
        return _old;
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
    /**
     * initialize marker info object 
     * @param {FormatterOptions} option 
     * @param {PatternMatchInfo} _marker 
     * @param {string} entry 
     * @param {string|RegExp} _endRegex 
     */
    _backupMarkerSwapBuffer(option, _marker, entry, _endRegex) {
        option.debug?.feature('backup-swap-buffer') && Debug.log('--:backup and swap buffer.[' + entry + ']');
        let _u_content = null;
        const _formatting = this.formatting;
        if (_marker.isBlock && _marker.isCaptureOnly && !_marker.isStreamCapture) {
            // buffer = content+buffer;
            _u_content = entry;
            entry = '';
        }
        if (option.appendToBufferListener) {
            option.appendToBufferListener(entry, _marker, false, option);
            entry = '';
        }
        const _inf = new FormatterMarkerInfo(this, _marker, entry, _endRegex, option);

        // + | unshift marker 
        option.unshiftMarker(_inf);
        // + | save option state
        _inf.saveState(option, _marker.mode);
        // + | create a new buffer 
        option.newBuffer(option.markerInfo.length);
        // + | update option mode with current mode
        option.nextMode = _inf.currentMode;
        // + | remove start line flag
        option.startLine = false;
        // + | 
        option.skipEmptyMatchValue = false;
        // + | reset line feed flag
        if (_marker.parent)
            option.lineFeedFlag = false;

        _formatting.updateStartFormatting(option.nextMode, option);
        if (_u_content) {
            _inf.captureEntry = _u_content;
            option.nextMode = _formatting.appendMode;
        }

        return _inf;
    }
    /**
     * update marker information - content and datathat is on the buffer
     * @param {*} _old 
     * @param {bool} startLine 
     * @param {FormatterOptions } option 
     * @returns 
     */
    _updateOldMarkerContent(_old, option, buffer, extra) {
        let { content, marker, currentMode, autoStartLine, prependExtra } = _old;
        let data = null;
        const _formatting = this.formatting;
        const _is_buffer = (buffer == undefined) && (extra == undefined);
        const _ref_data = {};  
        let _buffer_data = null;      
        if (_is_buffer) {
            _buffer_data =  option.formatterBuffer.joinSegments('');
            buffer = option.buffer;
            data = option.data;
            extra = option.flush(true, _ref_data);
        } else {
            buffer = buffer || '';
            extra = extra || '';
        }
        const isEntryContent = _old.useEntry && (content == _old.entryBuffer);
        let _joinwith = null;
        if (_old.captureEntry) {
            buffer = this._updateOldEntryCapture(_old, buffer, option);
            _joinwith = marker.joinWith;
        }

        const props = {
            marker, buffer, extra, option,
            content,
            data,
            segments: _old.data,
            mode: currentMode,
            autoStartLine,
            startBlock: _old.startBlock,
            isEntryContent,
            prependExtra,
            bufferData: _buffer_data // join segment with buffered data.
        };
        content = _formatting.updateOldMarkerContent(props);
        //+| update current mode 
        if (_old.currentMode != props.mode) {
            _old.currentMode = props.mode;
        } else if (option.nextMode!= _old.currentMode){
            _old.currentMode = option.nextMode;
        }
        // update content
        _old.content = content;
        _old.startBlock = 0;
        _old.autoStartLine = props.autoStartLine;
        // + | store update current joinWith
        _old.joinWith = _joinwith;
        _old.prependExtra = props.prependExtra;
        _old.set();
        return content;
    }

    _handleSameGroup2(_marker, _matcher, _p, _old, _buffer, option, _endRegex) {
        const { formatting } = this;
        this._checkStartBlockDefinition(_matcher, option, _old);
        if (_matcher.group[0].length == 0) {
            // matcher is empty and must past to end group
            // just invoke the matcher before send to parent 
            if ((option.markerInfo.length == 0) || (option.markerInfo[0] !== _marker)) {
                this._updateMarkerOldContentOrSwapBuffer(_marker, _old, _buffer, _endRegex, option);
            }
            let _q = this._handleMarker(_matcher, option);
            return _q;
        }
        // + | update parent markerin of before handle marker 
        if ((option.markerInfo.length == 0) || (option.markerInfo[0] !== _marker)) {
            this._updateMarkerOldContentOrSwapBuffer(_marker, _old, _buffer, _endRegex, option);
        }
        return this._handleMarker(_matcher, option);
    }
    /**
     * update parent property
     * @param {PatternMatchInfo} _marker 
     * @param {bool} _start 
     * @param {FormatterOptions} option 
     */
    _updateParentProps(_marker, _start, option) {
        const { parent, updateParentProps, requestParentBlockCondition } = _marker;
        if (parent && updateParentProps) {
            const _list = ["isBlock", 'lineFeed'];
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


            if (!_start) {
                this._initUpdatedisBlockStartInformation(_marker, option);
            } else {
                this._checkUpdatedStartBlockProperties(parent, option, true);
            }
        }
    }
    /**
     * 
     * @param {PatterMatchErrorInfo} _marker 
     * @param {FormatterOptions} option 
     * @param {boolean} _startBlock 
     */
    _checkUpdatedStartBlockProperties(_marker, option, _startBlock) {
        const { updatedProperties, isBlockStarted, blockStartInfo } = _marker;
        if (("isBlock" in updatedProperties) && !isBlockStarted && !blockStartInfo) {
            // + | update parent block information 
            // + | ------------------------------- 
            if (!_startBlock) {
                _marker.isBlockStarted = true;
            }
            _marker.blockStartInfo = {
                depth: option.depth
            }
            _startBlock && this._startBlock(option);
        }
    }
    _initUpdatedisBlockStartInformation(_marker, option) {
        const { parent } = _marker;
        // block already started
        if (parent && ("isBlock" in parent.updatedProperties) && (_marker.isBlockStarted)) {
            this._checkUpdatedStartBlockProperties(parent, option, false);
        }

    }
    /**
     * 
     * @param {*} patternInfo 
     * @param {*} _line 
     * @param {*} option 
     * @returns 
     */
    detectConstantPattern(patternInfo, _line, option) {
        const _endRegex = patternInfo.endRegex;
        let _nPatternInfo = this._createStreamConstantPattern(patternInfo, _line, _endRegex, option);
        option.pos = option.line.length;
        this._updateMarkerOldContentOrSwapBuffer(_nPatternInfo, null, '', _endRegex, option);
        return _nPatternInfo;
    }
    /**
     * create the stream buffer object
     * @returns 
     */
    _createStreamBuffer() {
        return new FormatterStreamBuffer();
    }
    /**
     * create a stream constant pattern
     * @param {*} patternInfo 
     * @param {*} _line 
     * @param {*} _endRegex 
     * @param {*} option 
     * @returns 
     */
    _createStreamConstantPattern(patternInfo, _line, _endRegex, option) {
        // patterns : patternInfo.hostPatterns
        let _stream_buffer = this._createStreamBuffer();
        _stream_buffer.from = patternInfo;
        _stream_buffer.initialMode = option.nextMode;
        // copy marker info 
        _stream_buffer.sourceMarkerInfo = option.markerInfo.slice(0);
        _stream_buffer.sourceTokenList = option.tokenList.slice(0);
        if (_line && _line.length > 0)
            _stream_buffer.appendToBuffer(_line);


        let _nPatternInfo = new PatternMatchInfo();
        let _idx = patternInfo.indexOf;
        _nPatternInfo.use({
            marker: _stream_buffer,
            endRegex: patternInfo.endRegex, //  ,
            group: patternInfo.group,
            line: option.line, // source line
            parent: patternInfo?.parent,
            patterns: patternInfo.hostPatterns,
            index: _idx,
            formatting: this.formatting
        });
        _stream_buffer.startPosition = option.pos;
        _stream_buffer.start(option);
        return _nPatternInfo;
    }
    _checkStartBlockDefinition(patternInfo, option) {
        const _formatting = this.formatting;
        // start a new block
        if (patternInfo.isBlock && !patternInfo.isBlockStarted) {
            _formatting.startBlockDefinition(this, patternInfo, option);
        }
    }
    /**
     * 
     * @param {*} patternInfo 
     * @param {*} option 
     * @param {*} _old 
     */
    _updateStreamRangeModeToHolder(patternInfo, option, _old) {
        if (option.range.start != option.range.end) {
            this._updatePatternPrevConstant(patternInfo, option, null, null, true);
            this._updateOldMarkerContent(_old, option);
            option.storeRange(option.pos);
        }
    }
    /**
     * get item found callback
     * @returns 
     */
    _handleItemFoundCallback() {
        return function (_matcher, patternInfo, _old, _buffer, _endRegex, option) {
            const { debug } = option;
            let { nextMode } = option;
            if (_old == null) {
                this._registerTokenName(patternInfo, option);
            }
            // handle matcher   

            let _newOld = this._updateMarkerOldContentOrSwapBuffer(patternInfo, _old, _buffer, _endRegex, option);
            nextMode = _newOld.currentMode;

            // update previous matcher info
            option.storeRange(option.pos, _matcher.group.index);
            if (option.range.start != option.range.end) {
                this._updatePatternPrevConstant(patternInfo, option, null, null, true);
                _newOld.currentMode = nextMode;
                this._updateOldMarkerContent(_newOld, option);
                option.storeRange(option.pos);
            }
            this._checkStartBlockDefinition(patternInfo, option);
            this._checkStartBlockDefinition(_matcher, option);
            debug?.feature('found-items') && Debug.log("--::: found item #" + _matcher.toString());
            let _ret = this._handleMarker(_matcher, option);
            return _ret;
        };
    }
    /**
     * 
     * @param {{_p, _matcher, patternInfo, option, endFound(), itemFound(), 
     * handleConstant(patternInfo, _line:string, option):}} param 
     */
    handleMatchLogic({
        _p, _matcher, _buffer, _old, patternInfo, option, _line,
        endFound,
        itemFound, handleConstant
    }) {
        let _continue_with_marker = false;
        const _endRegex = patternInfo.endRegex;
        const q = this;
        endFound = endFound || q._handleFoundEndPattern;
        handleConstant = handleConstant || q.detectConstantPattern;
        itemFound = itemFound || q._handleItemFoundCallback();
        if (_matcher == null) {
            // no child matcher found
            if (_p == null) {
                // no end - found 
                _continue_with_marker = true;
                // update cursor 
                q._appendConstant(patternInfo, _line, option);
                option.pos = option.line.length;
            } else {
                // ---------------------------------------------------------------
                // + | invoke END FOUND
                // ---------------------------------------------------------------
                return endFound.apply(q,
                    [_buffer, _line, patternInfo, _p, option, _old]);
            }
        }
        else {

            // compared index and handle child
            if ((_p == null) || (_matcher.group.index < _p.index)) {
                // handle matcher  
                return itemFound.apply(q, [_matcher, patternInfo, _old, _buffer, _endRegex, option]);
            }
            // check if same 
            if (_matcher.group.index == _p.index) {
                return Formatters.HandleSameGroup(q, patternInfo, _matcher, _p, _old, _buffer, _endRegex, option, endFound);
            }
            // priority to current marker 
            return endFound.apply(q, [_buffer, _line, patternInfo, _p, option, _old]);
            // throw new Error("Detected after not handle");
        }
        if (_continue_with_marker) {
            q._updateMarkerOldContentOrSwapBuffer(patternInfo, _old, _buffer, _endRegex, option);
            return patternInfo;
        }

        // + | default append 
        listener.append(group[0], patternInfo);
        // + | move forward
        option.moveTo(_next_position);
        return patternInfo.parent;
    }
    static HandleSameGroup(q, patternInfo, _matcher, _p, _old, _buffer, _endRegex, option, endFound, _line) {

        const { debug } = option;
        const { endMatchLogic } = q.settings;

        // + | priority to same group
        let _ret = null;
        _line = _line || option.line.substring(option.pos);
        let startLine = patternInfo.isStreamCapture ? option.startLine : undefined;
        // debug && Debug.log("Before logic just call end found. ");             
        if (endFound) {
            _ret = endFound.apply(q, [_buffer, _line, patternInfo, _p, option, _old]);
        } else {
            _ret = q._handleFoundEndPattern(_buffer, _line, patternInfo, _p, option, _old);
        }
        if (startLine) {
            option.startLine = startLine;
            if (startLine) {
                option.skipUpdateStartLine = true;
            }
        }

        return _ret;



        // option.storeRange(option.pos);
        // let _pattern = option.line.substring(option.range.start, _p.index);
        // if (_pattern.trim().length > 0) {
        //     // + possibility of element prev constant element before end group match
        //     option.storeRange(option.pos, _p.index);
        //     q._updateMarkerOldContentOrSwapBuffer(patternInfo, _old, _buffer, _endRegex, option);
        //     q._appendConstant(patternInfo, _pattern, option);
        //     option.pos = _p.index;
        //     //return patternInfo;
        //     return _matcher;
        // }
        // return q._handleSameGroup2(patternInfo, _matcher, _p, _old, _buffer, option, _endRegex);

    }
    isSpecialMarker(marker) {
        return marker instanceof SpecialMeaningPatternBase
    }
    /**
     * append buffer and new line end buffer list
     * @param {string} sb 
     * @param {PatternMatchInfo} marker 
     * @param {FormatterOptions} option 
     */
    appendBufferAndLine(sb, marker, option) {
        option.appendToBuffer(sb, marker);
        option.store();
        option.appendExtraOutput();
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
// previous contains before add to buffer 
class PrevLineFeedConstantPattern extends SystemConstantPattern {
    name = 'system.prev.line.feed.constant';

    /**
     * check if shift id constant
     * @returns {bool}
     */
    shiftIdConstant() {
        return false;
    }
}

const SYSTEM_MATCH_TYPE = 0x100;

class GlobalConstantPattern extends SystemConstantPattern {
    name = 'system.global.line.constant';
}
class StreamLineConstantPattern extends SystemConstantPattern {
    name = 'system.stream.line.constant';
}
class StreamBufferConstantPattern extends SystemConstantPattern {
    name = 'system.stream.buffer.constant';
    get matchType() {
        return SYSTEM_MATCH_TYPE + 8;
    }
}

class PrevConstantPattern extends SystemConstantPattern {
    name = 'system.prev.line.constant';
}
class NameOnlyConstantPattern extends SpecialMeaningPatternBase {
    get matchType() {
        return SYSTEM_MATCH_TYPE + 3;
    }
}

class JoinMarkerPattern extends SpecialMeaningPatternBase {
    get matchType() {
        return SYSTEM_MATCH_TYPE + 6;
    }
}

class EntryCapturePattern extends SpecialMeaningPatternBase {
    name = 'entry.capture.pattern';
    get matchType() {
        return SYSTEM_MATCH_TYPE + 7;
    }
    constructor(value) {
        super();
        Object.defineProperty(this, 'value', { get() { return value; } })
    }
}
class TypeMarkerInfoPattern extends SpecialMeaningPatternBase {
    get matchType() {
        return SYSTEM_MATCH_TYPE + 5;
    }
    constructor(type, { parser, data }) {
        super();
        if (typeof (type) == 'string') {
            type = type.replace('.', '-');
            this.tokenID = data?.tokenID || type;
            this.name = data?.name || type;
        }
        if (data) {
            // get extra key definition and append to parent
            const keys = Object.keys(data);
            const _mkeys = Object.keys(this);

            ['type', 'value'].forEach(i => {
                const idx = keys.indexOf(i);
                if (idx !== -1)
                    delete (keys[idx]);
            });

            const _diff = keys.filter((a) => _mkeys.indexOf(a) === -1);
            const q = this;
            _diff.forEach((o) => {
                Object.defineProperty(q, o, { get() { return data[o]; } });
            });
        }
    }
}

Utils.Classes = {
    ...Utils.Classes,
    Formatters
};

exports.Formatters = Formatters;
exports.Utils = Utils;
exports.Patterns = Patterns;
exports.JSonParser = JSonParser;
exports.SpecialMeaningPatternBase = SpecialMeaningPatternBase;

const { FormatterStreamBuffer } = require('./FormatterStreamBuffer');
const { FormatterLintError } = require('./FormatterLintError');
const { PatterMatchErrorInfo } = require('./PatterMatchErrorInfo');
const { ReplaceWithCondition } = require('./ReplaceWithCondition');
const { FormatterMatchTreatment } = require('./FormatterMatchTreatment');



Utils.Classes.FormatterStreamBuffer = FormatterStreamBuffer;

// Utils.DefineProperties(Utils.Classes, exports);