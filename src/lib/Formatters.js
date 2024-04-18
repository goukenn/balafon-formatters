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
    FormatterCloseParentInfo
};

let sm_globalEngine;
/**
 * formatters entry point
 */
class Formatters {
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
        // + reset startLine every time content is append to buffer
        option.startLine = false;
        option.lineFeedFlag = false;
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
                Utils.DefineProp(i, undefined, registry);
                let n = i.split('.')[0];
                if (_entry.indexOf(n) == -1) {
                    _entry.push(n);
                }
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
            // + | invoke function listener creator
            _o = listener.apply(this);
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
            StreamLineConstant: new StreamLineConstantPattern
        };
        let objClass = new FormatterOptions(this, _formatterBuffer, _listener, m_constants_def, _rg);
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
        NativeRegExp.Save();

        if (!Array.isArray(data)) {
            if (typeof (data) == 'string') {
                data = [data];
            }
            else throw new Error('argument not valid');
        }
        if (typeof (this.scopeName) == 'undefined') {
            throw new Error('scopeName is not defined');
        }
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
        const _output = (() => {
            data.forEach((line) => {
                if (this.skip_r) {
                    return;
                }
                const option = objClass;
                debug && Debug.log('read:[' + objClass.lineCount + "]:::" + line);
                objClass.resetRange();
                objClass.line = line;
                objClass.pos = 0;
                objClass.continue = false;
                objClass.lineCount++;
                objClass.markerDepth = 0;
                objClass.startLine = true;

                if (_matcherInfo) {
                    if (!_matcherInfo.marker.allowMultiline) {
                        throw new Error(`marker '${_matcherInfo.name}' do not allow multi line definition.`);
                    }
                    objClass.continue = _matcherInfo.marker.newLineContinueState; // true;
                    objClass.lineJoin = false;
                    // objClass.startLine = true;
                    _matcherInfo = _formatter._handleMarker(_matcherInfo, objClass);

                } else {
                    objClass.line = _trimStart && !useIndent ? objClass.line.trimStart() : objClass.line;
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
                        } else {
                            objClass.markerDepth = 0;
                            let p = objClass.line.substring(objClass.pos).trimEnd();
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
                    // objClass.startLine = false;
                    if (this.skip_r) {
                        return;
                    }
                }
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
            });
            if (this.skip_r) {
                this.skip_r = false;
                return null;
            }
            // + | close matcher 
            if (_matcherInfo) {
                debug && Debug.log('...EOF...' + _matcherInfo.toString());
                let option = objClass;
                option.EOF = true;
                option.line = '';
                option.pos = 0;
                while (_matcherInfo) { // close matcher - handle 
                    _matcherInfo = _formatter._handleMarker(_matcherInfo, objClass);
                }
                option.EOF = false;
            }

            debug && Debug.log('...end...');
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
                _output = objClass.output.join(lineFeed).trimEnd();
            }
            // + | clear buffer list  
            this.objClass.formatterBuffer.clearAll();
            return _output;
        })();
        NativeRegExp.Restore();
        return _output;
    }
    _updateLineFeed(option, startLine=false) {
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
     * @param {*} option 
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
                // + | same group end - 
                return this._handleSameGroupMatch(_matcher, option);
            }
        }
        return patternInfo;
    }
    _handleSameGroupMatch(_matcher, option) {
        this._checkStartBlockDefinition(_matcher, option);
        let _ref = this._handleMarker(_matcher, option);
        return _ref;
    }
    _updateMarkerFormatting(_marker, option) {
        // | update formatting 
        const { formatting } = this;
        if (_marker.formattingMode && !_marker.isBlock) {
            formatting.formatBufferMarker(this, _marker, option);
        } else {
            this._updateNextMode(option, _marker);
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
        const { endMissingValue } = marker;
        let _p = [];
        let regex = '';


        if (!marker.isEndCaptureOnly) {
            if ((endMissingValue != undefined) && (endMissingValue !== null)) {
                regex = endMissingValue;
            } else {
                if (_old && _old.marker.end.toString() != "/$/d")
                    regex = Utils.ReplaceRegexGroup(Utils.RegExToString(marker.end), marker.group);
            }
            regex = regex ? regex.replace(/\\/g, "") : ''; //remove escaped litteral
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
        if (_old.marker.end.toString() != "/$/d")
            regex = Utils.ReplaceRegexGroup(Utils.RegExToString(_old.marker.end), _group);
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
        const line = option.line;
        let _append = line.substring(_group.index); //  option.getLineRangeContent(); 
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

    _startBlock(option) {
        option.depth++;
        const { output, tabStop, depth, formatterBuffer, listener } = option;
        if (typeof (listener?.startNewBlock) == 'function') {
            listener.startNewBlock({ buffer: '', formatterBuffer, output, tabStop, depth });
        }
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

    _registerTokenName(marker, option) {
        const { name, isShiftenName, matchType } = marker;
        //+ | add token to global token list 
        if (name && (matchType == 0) && (!isShiftenName)) {
            option.tokenList.unshift(name);
            marker.isShiftenName = true;
        }
    }
    /**
     * core handle marker handle marker 
     * @param {PatternMatchInfo} _marker 
     * @param {*} option 
     */
    _handleMarker(_marker, option) {
        if (!_marker) return;
        if (!option.continue) {

            this._updatePatternPrevConstant(_marker, option);
            option.storeRange(option.pos);
        }
        // const { name, isShiftenName } = _marker;
        const { formatting } = this;
        const { matchType } = _marker.marker;
        this._registerTokenName(_marker, option);
        option.markerDepth++;


        /**
         * each callback must return a marker or null 
         * */
        const handle = this._handleCallback(matchType, option) ||
            ((m, option) => m.handleMarkerListener ? m.handleMarkerListener(option) : null)(_marker.marker, option);
        if (!handle || (typeof (handle) != "function")) {
            throw new Error("marker type handler is not a valid callback." + matchType);
        }
        let ret = handle.apply(this, [_marker, option]);
        if (ret === null) {
            // + update global mode formatting
            formatting.updateGlobalFormatting(_marker.mode, option);
            // option.startLine = true;
            // option.lineFeedFlag = false;
        } else { 
            // + | move next mode to top parent
            ret.mode = option.nextMode;
            if (ret !== _marker){
                formatting.updateGlobalFormatting(ret.mode, option);
            }
        }
        return ret;
    }
    /**
     * replace with condition 
     * @param {PatternMatchInfo} _marker 
     * @param {*} value 
     * @param {*} group 
     * @returns 
     */
    _operationReplaceWith(_marker, value, group, option) {
        let _formatter = this;
        const { replaceWith, replaceWithCondition } = _marker;
        let g = group;
        if (replaceWith) {
            let _rpw = Utils.RegExToString(replaceWith);
            const _cond = replaceWithCondition;
            let match = _cond?.match;

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
            value = Utils.DoReplaceWith(value, _formatter, _rpw, g, _marker, option);

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
            "0": option.listener?.handleBeginEndMarker || this._handleBeginEndMarker,
            "1": option.listener?.handleMatchMarker || this._handleMatchMarker
        }[type]
    }
    _onEndHandler(markerInfo, option) {
        const { tokenList } = option;
        if (markerInfo.isShiftenName) {
            if ((tokenList.length > 0) && (tokenList[0] == markerInfo.name)) {
                tokenList.shift();
                markerInfo.isShiftenName = false;
            } else
                throw new Error('missing marker name');
        }
    }
    _treatMatchValue(_cm_value, _marker, option, _op, group) {
        group = group || _marker.group;
        _cm_value = this.treatMarkerValue(_marker, _cm_value, _op, option, this._getMatchGroup(group));
        if (_op.indexOf('replaceWith') == -1) {
            if (_marker.captures) {
                _cm_value = option.treatBeginCaptures(_marker);
            }
        }
        if (_marker.patterns?.length > 0) {
            const lp = Utils.GetPatternMatcherInfoFromLine(_cm_value, _marker.patterns, option, _marker.parent);
            if (lp) {
                _cm_value = this.treatMarkerValue(lp, _cm_value, _op, option);
            }
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
     * @returns 
     */
    treatMarkerValue(_marker, c, op, option, group) {
        if (_marker.replaceWith) {
            c = this._operationReplaceWith(_marker, c, group || _marker.group, option);
            op.push('replaceWith');
        }
        if (_marker.transform) {
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
        debug && Debug.log('--::appendConstant::--[' + value + ']');

        let _inf = new PatternMatchInfo;
        _inf.use({ marker: constant_type_marker || option.constants.PrevLineFeedConstant, line: option.line, index: -2 });
        formattingSetupPatternForBuffer(patternInfo, option);
        const fc_update = () => { 
            this.formatting.updateBufferConstant(value, patternInfo.mode, _inf, option);
        }
        if (append_child) {
            patternInfo.childs.push(_inf);
        }
        if (listener?.appendConstant) {
            listener.appendConstant({ update: fc_update, patternInfo, data: value, option, _inf });
        } else {
            fc_update();
        }
        // +| missing update pattern mode from constant logic
        patternInfo.mode = _inf.mode;
    }
    /**
     * update maker info block
     * @param {*} _old 
     * @param {*} option 
     * @returns 
     */
    _updateMarkerInfoBlock(_old, option) {
        let _buffer = _old.content;
        let _marker = _old.marker;
        let _new_v = _buffer.replace(new RegExp('^' + _old.entryBuffer), '');
        // passing to entry buffer 
        _old.state.formatterBuffer.appendToBuffer(_old.entryBuffer);

        this._startBlock(option);
        if (_new_v.length > 0) {
            option.appendExtraOutput();
            option.formatterBuffer.appendToBuffer(_new_v);
            option.store();
            _buffer = option.flush(true);
        } else {
            _buffer = '';
        }

        _old.blockStarted = true;
        _marker.isBlockStarted = true;
        this._initUpdatedisBlockStartInformation(_marker, option);
        _old.useEntry = false;
        _old.startBlock = 0;
        _old.content = _buffer; 
        this.formatting.startBlock(_old);
        option.nextMode = _old.currentMode;
        return _buffer;
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

        debug && Debug.log("---:::start streaming :::--");
        if (_error) {
            _line = _line.substring(0, _error.index);
            _nextOffset = option.pos + _error.index;
        }
        let _sub_line = _line;
        let _nPatternInfo = null;
        let ret = null;
        let _end_found;
        // update old buffer before start 
        // let _baseInfo = option.peekFirstMarkerInfo(); 
        if (_old)
            this._updateMarkerOldContentOrSwapBuffer(_old.marker, _old, _buffer, _endRegex, option);
        option.newOldBuffers.length = 0; // start old 
        _nPatternInfo = this._createStreamConstantPattern(patternInfo, '', _endRegex, option);
        if (_sub_line.length > 0) {
            // on first next line detect end regex
            // check for end _endRegex in current line 
            let _found = _endRegex.exec(_sub_line);
            if (_found) {
                ret = this._handleMarker(_nPatternInfo, option);
                if (ret !== _nPatternInfo) {
                    return ret;
                }
                _end_found = true;
            }
        }
        let _baseInfo = option.peekFirstMarkerInfo();
        if (ret && ((_baseInfo == null) || (_baseInfo.marker !== _nPatternInfo))) {
            // + | register old to match for streaming
            _old = this._updateMarkerOldContentOrSwapBuffer(_nPatternInfo, null, '', _endRegex, option);
        }
        // + | substract streaming data to read from...
        option.line = option.line.substring(option.pos);
        option.pos = 0;
        // + | continue reading...
        return this._handleMarker(_nPatternInfo, option);
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
        let _cond = _old  && ((_cm_value.length == 0) || (_cm_value.trim().length == 0)
        && (!_formatting.allowEmptySpace(_old.marker.mode, option))) &&
        _marker.isMatchCaptureOnly;
        if (_cond) {
            _e.handle = true; 
            let _gcm_value = Utils.GetNextCapture(group.input, match);
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
                if (parent.endGroup.index == group.index) {
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
    _storeMatchValueHandler(_marker, option, _e, _extra) {
        const { _op, _old, _skip_value } = _extra;
        let _cm_value = _e.value;
        const _formatting = this.formatting;
        const b = _e.isInstructionSeparator || false;
        if (b || (!_marker.lineFeed) || (option.buffer.length > 0) || (_cm_value.length > 0)) {

            if (_op.indexOf('replaceWith') == -1) {
                option.appendToBuffer(_cm_value, _marker);
            } else {
                if ((option.glueValue == _cm_value)) {
                    this._onEndHandler(_marker, option);
                    return _marker.parent;
                }
                // + | check to add empty space before append.
                if (!option.skipEmptyMatchValue || (_cm_value.trim().length > 0)) {
                    option.formatterBuffer.appendToBuffer(_cm_value);
                    if (option.skipEmptyMatchValue) {
                        option.skipEmptyMatchValue = false;
                    }
                }
            }
            if (_old && b) {
                _formatting.onEndInstruction(_marker, option);
            }
            if (_marker.isGlueValue) {
                option.glueValue = _cm_value;
            } else {
                option.glueValue = null;
            }
            _e.storeValue = true;
            this._updateNextMode(option, _marker);
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


    /**
     * onMatch handle affect only on content match
     * @param {*} _marker 
     * @param {*} option 
     * @returns 
     */
    _handleMatchMarker(_marker, option) {
        option.debug && Debug.log('--::: Handle match marker :::--' + _marker.toString());
        option.state = 'match';
        const { parent, group, match, closeParentData } = _marker;
        const _formatting = this.formatting;
        let _cm_value = group[0];
        let _next_position = group.index + group.offset;

        const _old = (option.markerInfo.length > 0) ?
            option.markerInfo[0] : null;
        // + | update cursor position
        option.pos = _next_position;
        const _op = [];
        _cm_value = this._treatMatchValue(_cm_value, _marker, option, _op);

        // + skip empty value
        let _skip_value = (option.startLine && (_cm_value.trim().length == 0)) ||
            (_cm_value == '');

        // + | inject loging 
        let _e_args = {
            handle: false, value: _cm_value, 'state': 'match', udpateChild: true,
            _skip_value,
            isInstructionSeparator: false
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
                    if (_marker.parent){
                        // +| update next mode with parent
                        this._updateNextMode(option, _marker.parent); 
                    }
                    return _marker.parent;
                }
            }], 
            [this, this._storeMatchValueHandler, { _op, _old }],
        ]; 
        let _ret = this._handleChainHandler(_marker, _chains_match, _e_args, option);
        if (_e_args.handle) {
            return _ret;
        }  
        this._updateMarkerChild(_marker); 
        // + | marker is not a line feed directive or buffer is not empty - end instruction directive
        if (!_e_args.storeValue) {
            this._storeMatchValueHandler(_marker, option, _e_args, { _op, _old });
        }
        this._onEndHandler(_marker, option);
        if (_marker.closeParent) {
            return this._closeMarker(_marker, parent, option, _marker.closeParentData);
        }
        return parent;
    }
    _updateNextMode({nextMode}, marker){
        nextMode  = marker.mode;
        arguments[0].nextMode = nextMode;
    }
    /**
     * handle marker info 
     * @param {PatternMatchInfo} patternInfo 
     * @param {*} option 
     * @returns 
     */
    _handleBeginEndMarker(patternInfo, option) {
        option.state = 'begin/end';
        const { debug, line, markerInfo, startLine } = option;
        const { parent, lineFeed } = patternInfo;
        debug && Debug.log('--::: start begin/end handle marker 2 :::---#' + patternInfo.toString());

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

            // + | treat begin captures and update buffer
            option.treatBeginCaptures(patternInfo);
            patternInfo.start = false;
            if (patternInfo.isBlock) {
                // - on base start width K_R coding style 
                patternInfo.isFormattingStartBlockElement = true;
                patternInfo.blockStartInfo = {
                    depth: option.depth
                }
                // +| get formatting element type 
            }
            this._updateParentProps(patternInfo, true, option);
            if (parent) {
                if (parent.isBlock && this._isChildBlock(patternInfo) &&
                    !parent.isBlockStarted) {
                    if (markerInfo.length > 0) {
                        this._updateMarkerInfoBlock(markerInfo[0], option);
                    }
                }
            } else {
                if (lineFeed && (option.depth == 0)) {
                    // auto change line feed 
                    if (!option.blockStarted) {
                        option.blockStarted = true;
                    } else {
                        // append new line
                        option.appendLine();
                    }
                }
            }
            const _mode = patternInfo.mode;
            this.formatting.updateStartFormatting(_mode, option);
        } else {
            throw new Error("missing logic for : " + patternInfo);
        }
        _buffer = _start ? patternInfo.startOutput : _buffer;
        _endRegex = patternInfo.endRegex;
        _line = line.substring(option.pos);

        if (!_start && option.TOEND) {
            _p = patternInfo.endGroup;
            _p.index = 0;
            return this._handleFoundEndPattern(_buffer, _line, patternInfo, _p, option, _old);
        }

        if (option.EOF) {
            // ---------------------------------------------------------------
            // END FOUND
            // ---------------------------------------------------------------
            _p = this._lastExpectedMatchResult(patternInfo, option, _old);
            // _p= [0];
            // _p.index = 0;
            // _p.indices = [];
            return this._handleFoundEndPattern(_buffer, _line, patternInfo, _p, option, _old);
        }

        if (_line.length == 0) {

            // check for end found - 
            ({ _p, _matcher, _error } = this.detectPatternInfo(_line, patternInfo, option));
            if (_p && (_matcher == null)) {
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
            return this._startStreamingPattern(patternInfo, _line, _endRegex, option, null, null, null, false);
        }

        // + | DETECT core match
        ({ _p, _matcher, _error } = this.detectPatternInfo(_line, patternInfo, option, _start));


        if (_matcher == null) {
            // no child matcher found
            if (_p == null) {

                if (patternInfo.isStreamCapture) {
                    // + | detect buffer empty - buffer detection 
                    return this._startStreamingPattern(patternInfo, _line, _endRegex, option, _error, _old, _buffer, _error, true);
                }

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

                if (_matcher.isStreamCapture) {
                    // + | detect buffer empty - buffer detection   
                    // before startStream . 
                    this._checkStartBlockDefinition(patternInfo, option, _old);
                    _old = this._updateMarkerOldContentOrSwapBuffer(patternInfo, _old, _buffer, _endRegex, option);

                    // start new stream for new 
                    return this._startStreamingPattern(_matcher, _line, _endRegex, option, _error, null, _buffer, false);
                }
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
                option.storeRange(option.pos);
                let _pattern = option.line.substring(option.range.start, _p.index);
                if (_pattern.trim().length > 0) {
                    // + possibility of element prev constant element before end group match
                    option.storeRange(option.pos, _p.index);
                    this._updateMarkerOldContentOrSwapBuffer(patternInfo, _old, _buffer, _endRegex, option);
                    this._appendConstant(patternInfo, _pattern, option);
                    option.pos = _p.index;

                    return patternInfo;
                }

                return this._handleSameGroup2(patternInfo, _matcher, _p, _old, _buffer, option, _endRegex);
            }
            // priority to current marker 
            return this._handleFoundEndPattern(_buffer, _line, patternInfo, _p, option, _old);
        }
    }


    //#endregion
    //-------------------------------------------

    /**
     * detect logical pattern info
     * @param {string} _line 
     * @param {PatternMatchInfo} patternInfo 
     * @param {FormatterOption} option 
     * @param {bool} start true to handle exception 
     * @param {PatternMatchInfo} parentMatcherInfo to handle parent result for pattern
     * @returns 
     */
    detectPatternInfo(_line, patternInfo, option, start, parentMatcherInfo) {
        let _matcher = null;
        let _p = null; // end matcher 
        let _endRegex = patternInfo.endRegex;
        let _error = null;
        parentMatcherInfo = parentMatcherInfo || patternInfo;
        try {
            _matcher = //(_line.length > 0) &&
                (patternInfo.patterns && (patternInfo.patterns.length > 0)) ?
                    Utils.GetPatternMatcher(patternInfo.patterns, option, parentMatcherInfo) : null;
        }
        catch (e) {
            if (!start) {
                throw e;
            }
            _error = {
                _line,
                index: e.match.index - option.pos
            }
        }
        // + | fix to end regex
        _p = _endRegex.exec(_line);

        if (_p) {
            _p.index += option.pos;
        }
        patternInfo.endGroup = _p;
        return { _p, _matcher, _error };
    }
    _updatePatternPrevConstant(_marker, option, _prev, offset, append_child = true) {
        _prev = _prev || option.getLineRangeContent();
        if (_prev.length > 0) {
            if (!option.startLine || (_prev.trim().length>0)){
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
    /**
     * update buffer on end
     * @param {*} _marker 
     * @param {*} option 
     * @param {*} param2 
     * @private
     * @returns 
     */
    _updateBuffer(_marker, option, { _append, _buffer }) {
        const q = this;
        const { parent } = _marker;
        const { formatting } = q;
        if (_buffer.length > 0) {
            // + | direct append to buffer
            option.formatterBuffer.appendToBuffer(_buffer);
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
            else
                q._appendConstant(_marker, _append, option);
            _append = '';
        }
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
        debug && Debug.log('---:::CLOSE PARENT PROPERTY:::---' + _marker);
        arg.udpateChild = this._requestUpdateChild(_marker, arg.state);
        let _gparent = _marker.parent;
        let _g = this._closeBlockEntry(option, _marker, _gparent, _data);
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
     */
    _closeBlockEntry(option, _marker, _parent, data = '') {
        const { formatting } = this;
        if (option.depth>0)
            option.store();
        //const _buffer = option.flush(true);
        option.depth = Math.max(--option.depth, 0);
        //option.formatterBuffer.appendToBuffer(_buffer);
        if (_marker && _parent) {
            let _r = this._closeMarker(_marker, _parent, option, data);
            formatting.updateEmptySkipMatchedValueFormatting(_r, option, _marker);
            return _r;
        }
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
            let _value = data;
            let _type = null;
            if (typeof (data) == 'object') {
                _value = data.value;
                _type = data.type;
            }

            if (_g.endGroup[0] != _value) {
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
    _handleFoundEndPattern(_buffer, _line, _marker, _p, option, _old) {
        // calculate next position 
        const { debug } = option;
        const { parent } = _marker;
        const _next_position = _p.index + _p[0].length; // do not move cursor until condition meet
        let _append = option.line.substring(option.pos, _p.index);

        let _saved = false;
        if (_old == null) {
            option.saveBuffer();
            _saved = true;
        }
        let _b = option.treatEndCaptures(_marker, _p);
        let _close_block = false;
        const q = this;
        const _formatting = q.formatting;
        debug && Debug.log(`--::END: handleFoundEndPattern ::--#${_marker.name}`);

        // + | update parent host - check update properties for end 
        this._updateMarkerChild(_marker, option);

        // + | full fill pattern buffer 
        ({ _append, _buffer } = _formatting.onEndUpdateBuffer({
            marker: _marker,
            option,
            _buffer,
            update(info) {
                return q._updateBuffer(_marker, option, { _append, _buffer, ...(info || {}) });
            }
        }
        ));

        // + | node division 
        if (_marker.isBlock && _marker.blockStartInfo) {
            // just remove block before store 
            // reset block value;
            if (_old)
                _marker.isBlock = _old.oldBlockStart;
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
            this._closeBlockEntry(option);
        } else {
            _formatting.handleEndOnNonBlockElement(this, _marker, option);

        }
        // + | append to buffer 
        if (_b.length > 0) {
            option.appendToBuffer(_b, _marker, false);
            _b = '';
        }

        // + | update format and update mode
        this._updateMarkerFormatting(_marker, option);


        if (_close_block) {
            option.store();
            _buffer = option.flush(true);
            option.formatterBuffer.appendToBuffer(_buffer);
        }
        if (_old != null) {

            // + | restore buffering then update the buffer
            if ((_old.marker == _marker)) {
                _buffer = option.buffer;
                // - so st treat buffer 
                if (!_old.useEntry && _marker.isBlock) {
                    // + | store                    
                    // option.store(false);
                    option.output.push(_buffer);
                    _buffer = option.flush(true);
                }
                option.restoreBuffer(_old);
                _formatting.updateEndBlockAfterRestoringBuffer(q, _marker, _buffer, _old, option);


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
        // +| restore backup buffer
        if (_saved) {
            _buffer = option.buffer;
            option.restoreSavedBuffer();

            (_buffer.length > 0) && option.appendToBuffer(_buffer, _marker, true, false);
            if (!_close_block && (_marker.
                isFormattingStartBlockElement || _marker.isBlock)) {
                if (parent && (_marker.mode == 1)) {
                    option.store();
                }
            }
        }
        this._onEndHandler(_marker, option);
        option.cleanNewOldBuffers();
        //if (parent && (parent.childs.length ==1)){
        // only for onchilds parents. check that element is empty 
        //}
        if (parent && _marker.closeParent) {
            let _data = _marker.closeParentData;
            return this._closeMarker(_marker, parent, option, _data);
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
            get value() {
                return _marker.value;
            },
            get range() {
                return _marker.range;
            }
        });
        this._updateParentProps(_marker, false, option);


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
            option.unshiftMarker(_old);
        } else {
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
        option.debug && Debug.log('backup and swap buffer.');
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


        return _inf;
    }
    /**
     * update marker information - content 
     * @param {*} _old 
     * @param {bool} startLine 
     * @param {*} option 
     * @returns 
     */
    _updateOldMarkerContent(_old, option) { 
        let { content, marker, currentMode } = _old;
        const _formatting = this.formatting;
        const buffer = option.buffer;
        const extra = option.flush(true);
        const props = { marker, buffer, extra, option, content, mode: currentMode };
        content = _formatting.updateOldMarkerContent(props);
        //+| update current mode 
        if (_old.currentMode != props.mode) {
            _old.currentMode = props.mode;
        }
        // update content
        _old.content = content;
        _old.startBlock = 0;
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

            0 && 1;
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

    // _getMatchList() {
    //     const _list = []; 
    //     return _list;
    // }
    // _renderMatchList(_list, option) {
    //     const { listener } = option;

    //     _list.forEach((o) => {
    //         listener.append(o.value, o.marker);
    //         if (o.marker.lineFeed) {
    //             listener.store();
    //         }
    //     });
    // }

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
    _createStreamBuffer() {
        return new FormatterStreamBuffer(); // new StreamConstantPattern();
        // return new StreamConstantPattern();
    }
    _createStreamConstantPattern(patternInfo, _line, _endRegex, option) {
        // patterns : patternInfo.hostPatterns
        let _stream_buffer = this._createStreamBuffer();
        _stream_buffer.from = patternInfo;
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
            index: _idx
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
     * get item found callback
     * @returns 
     */
    _handleItemFoundCallback() {
        return function (_matcher, patternInfo, _old, _buffer, _endRegex, option) {
            const { debug, nextMode } = option;
            if (_old == null) {
                this._registerTokenName(patternInfo, option);
            }
            // handle matcher   
            let _newOld = this._updateMarkerOldContentOrSwapBuffer(patternInfo, _old, _buffer, _endRegex, option);
            // update previous matcher info
            option.storeRange(option.pos, _matcher.group.index);
            if (option.range.start != option.range.end) {
                this._updatePatternPrevConstant(patternInfo, option, null, null, true);
                _newOld.currentMode = nextMode ; 
                this._updateOldMarkerContent(_newOld, option);
                option.storeRange(option.pos);
            }
            this._checkStartBlockDefinition(patternInfo, option);
            this._checkStartBlockDefinition(_matcher, option);
            debug && Debug.log("--::found item #"+_matcher.toString());
            let _ret =  this._handleMarker(_matcher, option); 
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

        // if (endFound) {
        //     endFound = (function (ec) {
        //         return function (_buffer, _line, patternInfo, _p, option, _old) {
        //             q._onEndHandler(patternInfo, option)
        //             return ec(_buffer, _line, patternInfo, _p, option, _old);
        //         }
        //     })(endFound);
        // }

        endFound = endFound || q._handleFoundEndPattern;
        handleConstant = handleConstant || q.detectConstantPattern;
        itemFound = itemFound || q._handleItemFoundCallback();
        if (_matcher == null) {
            // no child matcher found
            if (_p == null) {
                if (patternInfo.group[0].length == 0) {
                    // + | detect buffer empty - buffer detection 
                    return handleConstant.apply(q, [patternInfo, _line, option]);
                }
                // no end - found 
                _continue_with_marker = true;
                // update cursor 
                q._appendConstant(patternInfo, _line, option);
                option.pos = option.line.length;
            } else {
                // ---------------------------------------------------------------
                // END FOUND
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
                option.storeRange(option.pos);
                let _pattern = option.line.substring(option.range.start, _p.index);
                if (_pattern.trim().length > 0) {
                    // + possibility of element prev constant element before end group match
                    option.storeRange(option.pos, _p.index);
                    q._updateMarkerOldContentOrSwapBuffer(patternInfo, _old, _buffer, _endRegex, option);
                    q._appendConstant(patternInfo, _pattern, option);
                    option.pos = _p.index;
                    //return patternInfo;
                    return _matcher;
                }
                return q._handleSameGroup2(patternInfo, _matcher, _p, _old, _buffer, option, _endRegex);
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

class GlobalConstantPattern extends SystemConstantPattern {
    name = 'system.global.line.constant';
}
class StreamLineConstantPattern extends SystemConstantPattern {
    name = 'system.stream.line.constant';
}

class PrevConstantPattern extends SystemConstantPattern {
    name = 'system.prev.line.constant';
}
class NameOnlyConstantPattern extends SpecialMeaningPatternBase {
    get matchType() {
        return 3;
    }
}
class TypeMarkerInfoPattern extends SpecialMeaningPatternBase {
    get matchType() {
        return 5;
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

exports.Formatters = Formatters;
exports.Utils = Utils;
exports.Patterns = Patterns;
exports.JSonParser = JSonParser;
exports.SpecialMeaningPatternBase = SpecialMeaningPatternBase;

const { FormatterStreamBuffer } = require('./FormatterStreamBuffer');



Utils.Classes.FormatterStreamBuffer = FormatterStreamBuffer;

// Utils.DefineProperties(Utils.Classes, exports);