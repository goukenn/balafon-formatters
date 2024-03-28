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
const { FormatterOptions } = require("./FormatterOptions");
const { FormattingCodeStyles } = require("./FormattingCodeStyles");
const { HandleFormatting, updateBuffer, FormattingMode, formattingSetupPatternForBuffer } = require("./Formattings/FormattingMode");
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
    PatternMatchInfo,
    CaptureInfo, // replacement
    CaptureRenderer,
    FormatterBuffer,
    FormatterOptions,
    FormattingCodeStyles,
    Debug,
    RegexUtils,
    BlockInfo,
    FormatterPatternException
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

    static get GlobalEngine() {
        return sm_globalEngine;
    }
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
        if (!Array.isArray(data)) {
            if (typeof (data) == 'string') {
                data = [data];
            }
            else throw new Error('argument not valid');
        }
        if (typeof (this.scopeName) == 'undefined') {
            throw new Error('scope name is not defined');
        }
        let objClass = this.objClass;
        if (!objClass) {
            objClass = this.#initDefinition(option);
        }
        let _matcherInfo = null;
        let _formatter = this;
        let _trimStart = true;
        // let pos = 0;
        const { debug, lineFeed } = objClass;
        const _formatting = this.formatting;
        const { tabStop } = this.settings;

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
        const v_rTokenList = objClass.tokenList.slice(0);


        data.forEach((line) => {
            const option = objClass;
            debug && Debug.log('read:[' + objClass.lineCount + "]:::" + line);
            objClass.resetRange();
            objClass.line = line;
            objClass.pos = 0;
            objClass.continue = false;
            objClass.lineCount++;
            objClass.markerDepth = 0;

            if (_matcherInfo) {
                if (!_matcherInfo.marker.allowMultiline) {
                    throw new Error(`marker '${_matcherInfo.name}' do not allow multi line definition.`);
                }
                objClass.continue = _matcherInfo.marker.newLineContinueState; // true;
                objClass.lineJoin = false;
                objClass.startLine = true;
                _matcherInfo = _formatter._handleMarker(_matcherInfo, objClass);

            } else {
                objClass.line = _trimStart ? objClass.line.trimStart() : objClass.line;
                _trimStart = true;
            }
            if (line.length <= 0) {
                return;
            }
            objClass.startLine = false;
            let ln = objClass.length;
            let pos = objClass.pos;
            if (objClass.lineFeedFlag) {
                objClass.store();
                objClass.lineFeedFlag = !1;
            }

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
                        objClass.storeRange(pos, _matcherInfo.index);
                        _matcherInfo = _formatter._handleMarker(_matcherInfo, objClass);
                    } else {
                        objClass.markerDepth = 0;
                        let p = objClass.line.substring(objClass.pos).trimEnd();
                        if (p.length > 0)
                            objClass.appendToBuffer(p, objClass.constants.GlobalConstant);
                        objClass.pos = ln;
                    }
                }
                pos = objClass.pos;
                ln = objClass.length;
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
        // + | close matcher 
        if (_matcherInfo) {
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
            debug && Debug.log('.....contains marker info .....' + objClass.markerInfo.length);
            while (objClass.markerInfo.length > 0) {
                let _old = objClass.markerInfo.shift();
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
    }
    /**
     * check for closing do not update markerInfo - specification 
     * @param {*} patternInfo 
     * @param {*} option 
     */
    _handleCheckCloseMarker(patternInfo, option) {
        const { debug, markerInfo } = option;
        debug && Debug.log("---::check close marker::---");
        let _p = null;
        let _matcher = null;
        let _line = option.line.substring(option.pos);
        // for check get and check if _old is avaiable 
        let _old = (markerInfo.length > 0) && (markerInfo[0].marker == patternInfo) ? markerInfo[0] : null;
        ({ _p, _matcher } = this.detectPatternInfo(_line, patternInfo, option));
        if (_p && (_matcher == null)) {
            const { isStreamCapture, endFoundListener } = patternInfo;
            if (isStreamCapture) {
                return this._handleMarker(patternInfo, option);
            }
            return this._handleFoundEndPattern('', _line, patternInfo, _p, option, _old);
        }
        return patternInfo;
    }
    _updateMarkerFormatting(_matcherInfo, option) {
        // | update formatting 
        if (_matcherInfo.formattingMode && !_matcherInfo.isBlock) {
            this.formatting.formatBufferMarker(this, _matcherInfo, option);
        }
    }
    updateBuffedValueAsToken(_buffer, _marker, option, appendExtra = true) {
        option.formatterBuffer.clear();
        option.appendToBuffer(_buffer, _marker);
        option.store();
        if (appendExtra)
            option.appendExtraOutput();
        _buffer = option.flush(true);
        option.formatterBuffer.appendToBuffer(_buffer, _marker);
    }
    _lastExpectedMatchResult(marker, option, _old) {
        const _formatting = this.formatting;
        const { endMissingValue } = marker;
        let _p = [];
        let regex = '';
        if (!marker.isEndCaptureOnly) {
            if (endMissingValue !== null) {
                regex = endMissingValue;
            } else {
                if (_old && _old.marker.end.toString() != "/$/d")
                    regex = Utils.ReplaceRegexGroup(Utils.RegExToString(marker.end), marker.group);
            }
            regex = regex.replace(/\\/g, ""); //remove escaped litteral
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


    /**
     * core handle marker handle marker 
     * @param {PatternMatchInfo} _marker 
     * @param {*} option 
     */
    _handleMarker(_marker, option) {
        if (!_marker) return;
        if (!option.continue) {

            this._updatedPatternMatch(_marker, option);
            option.storeRange(option.pos);
        }
        const { name, isShiftenName } = _marker;
        const { matchType } = _marker.marker;

        if (name && (matchType == 0) && (!isShiftenName)) {
            option.tokenList.unshift(name);
            _marker.isShiftenName = true;
        }
        option.markerDepth++;


        /**
         * each callback must return a marker or null 
         * */
        const handle = this._handleCallback(matchType, option) ||
            ((m, option) => m.handleMarkerListener ? m.handleMarkerListener(option) : null)(_marker.marker, option);
        if (!handle || (typeof (handle) != "function")) {
            throw new Error("marker type handler is not a valid callback." + matchType);
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
    _operationReplaceWith(_marker, value, group, option) {
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
    /**
     * onMatch handle 
     * @param {*} _marker 
     * @param {*} option 
     * @returns 
     */
    _handleMatchMarker(_marker, option) {
        option.debug && Debug.log('--:: Handle match marker :--');
        option.state = 'match';
        let _cm_value = _marker.group[0];
        const { mode, parent } = _marker;
        const _formatting = this.formatting;

        const _old = (option.markerInfo.length > 0) ?
            option.markerInfo[0] : null;
        // + | update cursor position
        option.pos += _cm_value.length;

        if (_old && ((_cm_value.length == 0) || (_cm_value.trim().length == 0)
            && (!_formatting.allowEmptySpace(_old.marker.mode, option)))) {
            //+ ignore empty string at line start or mode 
            this._onEndHandler(_marker, option);
            return parent;
        }

        this._updateMarkerChild(_marker);
        let b = false;
        if (_marker.isInstructionSeparator) {
            b = this.settings.isInstructionSeperator(_cm_value);
        }
        // + | marker is not a line feed directive or buffer is not empty
        if (b || (!_marker.lineFeed) || (option.buffer.length > 0)) {
            // treat - tranform token and tranfrom 
            const _op = [];
            _cm_value = this.treatMarkerValue(_marker, _cm_value, _op, option);
            if (_op.indexOf('replaceWith') == -1) {
                if (_marker.captures) {
                    _cm_value = option.treatBeginCaptures(_marker);
                }

                if (_marker.patterns?.length > 0) {
                    const lp = Utils.GetPatternMatcherInfoFromLine(_cm_value, _marker.patterns, option, _marker);
                    if (lp) {
                        _cm_value = this.treatMarkerValue(lp, _cm_value, _op, option);
                    }
                }

            }

            // combine value
            // if (option.glueValue == _cm_value){
            //     return _marker.parent;
            // }

            if (_op.indexOf('replaceWith') == -1) {
                option.appendToBuffer(_cm_value, _marker);
            } else {
                if ((option.glueValue == _cm_value)) {
                    this._onEndHandler(_marker, option);
                    return _marker.parent;
                }
                option.formatterBuffer.appendToBuffer(_cm_value);//, _marker);
            }
            if (_old && b) {
                _formatting.handleEndInstruction(this, _marker, _old, option);
            }
            if (_marker.isGlueValue) {
                option.glueValue = _cm_value;
            } else {
                option.glueValue = null;
            }
        }
        this._onEndHandler(_marker, option);
        return parent;
    }
    _operateOnFramebuffer(_marker, option, _old) {
        return HandleFormatting.apply(this, [_marker, option, _old]);
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
        _inf.use({ marker: constant_type_marker || option.constants.PrevLineFeedConstant, line: option.line });
        formattingSetupPatternForBuffer(patternInfo, option);
        const fc_update = () => {
            updateBuffer(value, patternInfo.mode, _inf, option);
        }
        if (append_child) {
            patternInfo.childs.push(_inf);
        }
        if (listener?.appendConstant) {
            listener.appendConstant({ update: fc_update, patternInfo, data: value, option, _inf });
        } else {
            fc_update();
        }

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
        const { group } = patternInfo;
        let _nextOffset = option.line.length;
        if (_error) {
            _line = _line.substring(0, _error.index);
            _nextOffset = option.pos + _error.index;
        }
        let _sub_line = _line.substring(1);
        let _nPatternInfo = null;
        let ret = null;
        // update old buffer before start 
        // let _baseInfo = option.peekFirstMarkerInfo(); 
        if (_old)
            this._updateMarkerInfoOld(_old.marker, _old, _buffer, _endRegex, option);


        option.newOldBuffers.length = 0; // start old 
        _nPatternInfo = this._createStreamConstantPattern(patternInfo, '', _endRegex, option);
        if (_sub_line.length > 0) {
            // on first next line detect end regext
            // check for end _endRegex in current line 
            let _found = _endRegex.exec(_sub_line);
            if (_found) {
                ret = this._handleMarker(_nPatternInfo, option);
                if (ret !== _nPatternInfo) {
                    return ret;
                }
            }
        }
        let _baseInfo = option.peekFirstMarkerInfo();
        if (ret && ((_baseInfo == null) || (_baseInfo.marker !== _nPatternInfo)))
            this._updateMarkerInfoOld(_nPatternInfo, null, '', _endRegex, option);
        // + | substract streaming data to read from 
        option.line = option.line.substring(option.pos);
        option.pos = 0;
        // + | continue reading...
        return this._handleMarker(_nPatternInfo, option);
    }
    /**
     * handle marker info 
     * @param {PatternMatchInfo} patternInfo 
     * @param {*} option 
     * @returns 
     */
    _handleBeginEndMarker(patternInfo, option) {
        option.state = 'begin/end';
        const { debug, listener, line, markerInfo, startLine } = option;
        const { group, parent } = patternInfo;
        debug && Debug.log('--::: start begin/end handle marker 2 :::---#' + patternInfo.toString());

        let _endRegex = null;
        let _start = true;
        let _line = '';
        let _old = null;
        let _buffer = null;
        let _p, _matcher, _error;

        // get _old marker to continue matching selection  

        if ((markerInfo.length > 0) && (markerInfo[0].marker == patternInfo) && (_old = markerInfo.shift())) {
            _start = false; // update the marker to handle start definition
            _buffer = this._updateOldMarker(_old, startLine, option);

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
                if (patternInfo.lineFeed && (option.depth == 0)) {
                    // auto change line feed 
                    if (!option.blockStarted) {
                        option.blockStarted = true;
                    } else {
                        // append new line
                        option.appendLine();
                    }
                }
            }
        }
        _buffer = _start ? patternInfo.startOutput : _buffer;
        _endRegex = patternInfo.endRegex;
        _line = line.substring(option.pos);

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
            this._updateMarkerInfoOld(patternInfo, _old, _buffer, patternInfo.endRegex, option);
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

        // let _continue_with_marker = false;  
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
                this._updateMarkerInfoOld(patternInfo, _old, _buffer, _endRegex, option);
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
                    return this._startStreamingPattern(_matcher, _line, _endRegex, option, _error, _old, _buffer, false);
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
                    this._updateMarkerInfoOld(patternInfo, _old, _buffer, _endRegex, option);
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
            _matcher = (_line.length > 0) &&
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
    _updatedPatternMatch(_marker, option, _prev, offset, append_child = true) {
        _prev = _prev || option.getLineRangeContent();
        if (_prev.length > 0) {
            this._appendConstant(_marker, _prev, option, append_child);
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
    _updateBuffer(_marker, option, { _append, _buffer, flushBuffer }) {
        const q = this;
        if (_buffer.length > 0) {
            // + | direct append to buffer
            option.formatterBuffer.appendToBuffer(_buffer);
            if (!_marker.isStreamCapture && _marker.isBlock && flushBuffer) {
                option.appendLine();
            }
            _buffer = '';
        }
        if ((_append.trim().length > 0)) {
            // + | append constant marker definition 
            if (_marker.isFormattingStartBlockElement && !_marker.newLine) {
                _marker.newLine = true;
            }
            q._appendConstant(_marker, _append, option);
            _append = '';
        }
        return { _append, _buffer };
    }

    _handleFoundEndPattern(_buffer, _line, _marker, _p, option, _old) {
        // calculate next position 
        const { debug } = option;
        const { parent, mode } = _marker;
        const _next_position = _p.index + _p[0].length; // do not move cursor until condition meet
        let _append = option.line.substring(option.pos, _p.index);
        // let _sblock = _marker?.parent?.isBlock;
        // let _p_host = ((option.markerInfo.length > 0) ? option.markerInfo[0] : null);
        let _saved = false;
        if (_old == null) {
            option.saveBuffer();
            _saved = true;
        }
        let _b = option.treatEndCaptures(_marker, _p);
        let _close_block = false;
        const q = this;
        const _formatting = q.formatting;
        debug && Debug.log(`--::handleFoundEndPattern2::--#${_marker.name}`);
        const _onSingleLine = (_old == null) || (_old.startBlock.line == option.lineCount);

        // + | full fill pattern buffer 
        ({ _append, _buffer } = _formatting.onEndUpdateBuffer({
            marker:_marker,
            option,
            onSingleLine:_onSingleLine,
            _buffer,
            update(info) {
                return q._updateBuffer(_marker, option, { _append, _buffer, ...(info||{}) });
            }
        }
        ));
        // + | update parent host - check update properties for end 
        this._updateMarkerChild(_marker, option);
        // + | node division 
        if (_marker.isBlock && _marker.blockStartInfo) {
            // just remove block before store 
            // reset block value;
            _marker.isBlock = (_old && _old.oldBlockStart);
            _close_block = true;
            //_marker.isBlockDefinition = null;
            if (_marker.isFormattingStartBlockElement) {
                ({ _b } = _formatting.handleEndFormattingBeforeStore(q, _marker, option, _buffer, { _b }));
                _buffer = option.buffer;
                option.flush(true);
                option.output.push(_buffer);
            } else {
                _formatting.handleEndFormattingOnNonStartBlockElement(q, _marker, option);
            }
            _buffer = '';
            option.depth = Math.max(--option.depth, 0);
        } else {
            _formatting.handleEndOnNonBlockElement(this, _marker, option);

        }
        // + | append to buffer 
        if (_b.length > 0) {
            option.appendToBuffer(_b, _marker, false);
            _b = '';
        }
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
                    option.store(false);
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
            // option.tokenList.shift();
            option.appendToBuffer(_buffer, _marker);
            if (_marker.
                isFormattingStartBlockElement || _marker.isBlock) {
                if (parent && (_marker.mode == 1)) {
                    option.store();
                }
            }
        }
        this._onEndHandler(_marker, option);
        option.cleanNewOllBuffers();
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
    _updateMarkerInfoOld(_marker, _old, _buffer, _endRegex, option) {
        if (_old) {
            _old.content = _buffer;
            option.markerInfo.unshift(_old);
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
     * initialize marker info
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
        _inf.saveState(option);
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
    _updateOldMarker(_old, startLine, option) {
        let _sbuffer = '';
        // TODO : Remove line _lf
        let _lf = _old.startBlock == 1 ? option.lineFeed : '';
        let _buffer = _old.content;
        let _rbuffer = option.buffer;
        const { marker } = _old;
        const { debug } = option;
        const _formatting = this.formatting;
        debug && Debug.log("--::update oldmarker::--");

        if (_rbuffer.length == 0) {
            return _buffer;
        }

        if (_old.isNew) {
            if (marker.isFormattingStartBlockElement) {
                option.output.push(_buffer);
                _sbuffer = this._operateOnFramebuffer(marker, option, _old);
            } else {
                // why root 
                _sbuffer = _formatting.formatJoinFirstEntry(_buffer, _rbuffer);
                option.formatterBuffer.clear();
            }
            _old.content = _sbuffer;
            _old.startBlock = 0;
            _old.set();
            return _sbuffer;

        } else {

            if (startLine) {
                if (marker.preserveLineFeed) {
                    _buffer += option.lineFeed;
                }
                if (marker.isFormattingStartBlockElement) {
                    _sbuffer = this._operateOnFramebuffer(marker, option, _old);
                    _lf = '';
                }
            } else {
                if (marker.isFormattingStartBlockElement) {
                    // + | store what is in the buffer 
                    _sbuffer = this._operateOnFramebuffer(marker, option, _old);
                    _lf = '';
                } else

                    // append current buffer to 
                    if (marker.isBlock && !_old.blockStarted && !marker.isBlockStarted) {
                        _sbuffer = this._updateMarkerInfoBlock(_old, option);
                        _lf = '';
                    }
                    else {
                        if ((option.output.length > 0) || _old.startBlock) {
                            option.store(_old.startBlock);
                            _sbuffer = option.flush(true);
                            _lf = '';

                        } else {
                            _sbuffer = _formatting.handleBufferingNextToSbuffer(marker, option);
                            _old.useEntry = false;
                        }
                    }

            }
        }
        if (_sbuffer) {
            _buffer += _lf + _sbuffer;
        }
        _old.startBlock = 0;
        _old.content = _buffer;
        _old.set();
        return _buffer;
    }

    _handleSameGroup2(_marker, _matcher, _p, _old, _buffer, option, _endRegex) {
        if (_matcher.group[0].length == 0) {
            // matcher is empty and must past to end group
            if (_endRegex.test(_buffer)) {
                return this._handleFoundEndPattern(_buffer, option.line, _marker, _p, option, _old);
            }
        }
        this._checkStartBlockDefinition(_matcher, option, _old);
        // + | update parent markerin of before handle marker 
        if ((option.markerInfo.length == 0) || (option.markerInfo[0] !== _marker)) {
            this._updateMarkerInfoOld(_marker, _old, _buffer, _endRegex, option);
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
        this._updateMarkerInfoOld(_nPatternInfo, null, '', _endRegex, option);
        return _nPatternInfo;
    }
    _createStreamConstantPattern(patternInfo, _line, _endRegex, option) {
        // patterns : patternInfo.hostPatterns
        let _stream_buffer = new StreamConstantPattern();
        _stream_buffer.from = patternInfo;
        _stream_buffer.appendToBuffer(_line);


        let _nPatternInfo = new PatternMatchInfo();
        _nPatternInfo.use({
            marker: _stream_buffer,
            endRegex: patternInfo.endRegex, //  ,
            group: patternInfo.group,
            line: option.line, // source line
            parent: patternInfo?.parent,
            patterns: patternInfo.hostPatterns
        });
        _stream_buffer.startPosition = option.pos;
        return _nPatternInfo;
    }
    _checkStartBlockDefinition(patternInfo, option) {
        const _formatting = this.formatting;
        // start a new block
        if (patternInfo.isBlock && !patternInfo.isBlockStarted) {
            _formatting.startBlockDefinition(this, patternInfo, option);
        }
    }
    _handleItemFoundCallback() {
        return function (_matcher, patternInfo, _old, _buffer, _endRegex, option) {

            // handle matcher  
            this._updateMarkerInfoOld(patternInfo, _old, _buffer, _endRegex, option);
            // update previous matcher info
            option.storeRange(option.pos, _matcher.group.index);
            if (option.range.start != option.range.end) {
                this._updatedPatternMatch(patternInfo, option, null, null, true);
                this._updateOldMarker(option.markerInfo[0], false, option);
                option.storeRange(option.pos);
            }
            this._checkStartBlockDefinition(patternInfo, option);

            return this._handleMarker(_matcher, option);

            // this._updateMarkerInfoOld(patternInfo, _old, _buffer, _endRegex, option);
            // option.storeRange(option.pos, _matcher.group.index);
            // if (option.range.start != option.range.end) {
            //     this._updatedPatternMatch(patternInfo, option);
            //     option.storeRange(option.pos);
            // }
            // //option.continue = false;
            // return this._handleMarker(_matcher, option);
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

        if (endFound) {
            endFound = (function (ec) {
                return function (_buffer, _line, patternInfo, _p, option, _old) {
                    q._onEndHandler(patternInfo, option)
                    return ec(_buffer, _line, patternInfo, _p, option, _old);
                }
            })(endFound);
        }

        endFound = endFound || this._handleFoundEndPattern;
        handleConstant = handleConstant || this.detectConstantPattern;
        itemFound = itemFound || this._handleItemFoundCallback();
        if (_matcher == null) {
            // no child matcher found
            if (_p == null) {
                if (patternInfo.group[0].length == 0) {
                    // + | detect buffer empty - buffer detection 
                    return handleConstant.apply(this, [patternInfo, _line, option]);
                }
                // no end - found 
                _continue_with_marker = true;
                // update cursor 
                this._appendConstant(patternInfo, _line, option);
                option.pos = option.line.length;
            } else {
                // ---------------------------------------------------------------
                // END FOUND
                // ---------------------------------------------------------------
                return endFound.apply(this,
                    [_buffer, _line, patternInfo, _p, option, _old]);
            }
        }
        else {

            // compared index and handle child
            if ((_p == null) || (_matcher.group.index < _p.index)) {
                // handle matcher  
                return itemFound.apply(this, [_matcher, patternInfo, _old, _buffer, _endRegex, option]);
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
                    option.pos = _p.index;
                    //return patternInfo;
                    return _matcher;
                }
                return this._handleSameGroup2(patternInfo, _matcher, _p, _old, _buffer, option, _endRegex);
            }
            // priority to current marker 
            return endFound.apply(this, [_buffer, _line, patternInfo, _p, option, _old]);
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
        return true;
    }
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

class StreamConstantPattern extends SpecialMeaningPatternBase {
    name = 'system.stream.constant.pattern';
    startPosition;
    started = false;
    endFoundListener;
    check(l, option, patternMatcherInfo) {
        return false;
    }
    /**
     * false to handle constant before matching on stream
     */
    get newLineContinueState() {
        return false;
    }
    constructor() {
        super();
        var m_stream = new FormatterBuffer();
        var m_from;
        let m_saved = { saved: false, started: false };
        m_stream.id = '__stream__';
        const self = this;

        this.appendToBuffer = function (v) {
            m_stream.appendToBuffer(v);
            return v;
        }
        this.clear = function () {
            m_stream.clear();
        }
        Object.defineProperty(this, 'buffer', { get() { return m_stream.buffer; } });
        Object.defineProperty(this, 'saved', { get() { return m_saved; } });
        Object.defineProperty(this, 'begin', { get() { return m_from?.begin; } });
        Object.defineProperty(this, 'end', { get() { return m_from?.end; } });

        Object.defineProperty(this, 'from', {
            get() {
                return m_from;
            },
            set(v) {
                m_from = v;
            }
        });
        Object.defineProperty(this, 'patterns', {
            get() {
                return m_from.patterns;
            },
            set(v) {
                throw new Error('failed to set patterns not allowed');
            }
        });
    }
    get throwErrorOnEndSyntax() {
        return true;
    }
    get matchType() {
        return 4;
    }
    get isEndCaptureOnly() {
        return this.from.isEndCaptureOnly;
    }
    get isBeginCaptureOnly() {
        return this.from.isBeginCaptureOnly;
    }
    get patterns() {
        return this.from.patterns;
    }
    get indexOf() {
        return this.from?.indexOf;
    }


    /**
     * 
     * @param {*} patternInfo from host
     * @param {*} option 
     * @param {*} _old 
     * @param {*} markerInfo stream pattern match info
     * @returns 
     */
    moveToNextPattern(patternInfo, option, _old, markerInfo) {
        const { parent, hostPatterns } = patternInfo;
        const { formatter } = option;
        option.pos = 0;
        option.storeRange(option.pos);
        const _idx = this.indexOf;
        const _patterns = hostPatterns ? hostPatterns.slice(_idx + 1) : [];
        if (_patterns.length > 0) {
            // + | handle matcher to line
            let g = Utils.GetPatternMatcherInfoFromLine(option.line, _patterns, option, parent);
            if (_old) {
                if (_old?.marker == markerInfo) {
                    option.restoreBuffer(_old);
                }
            }
            if (g) {
                // + | exit from - top pattern Info 
                _old = option.shiftFromMarkerInfo(patternInfo);
                if (_old) {
                    option.restoreBuffer(_old);
                }
                option.tokenList.shift();
                return g;
            }
        }
        if (parent === null) {
            // + | just append to buffer  
            option.appendToBuffer(option.line, option.constants.GlobalConstant);
            option.pos = option.length;
            return null;
        }
        return parent;
        // throw new Error('Stream Not implement With no parent');
    }
    static GetBufferedLine(formatter, _src_line, option, patternInfo) {
        const op = [];
        const _group = [_src_line];
        let _line = formatter.treatMarkerValue(patternInfo, _src_line, op, option, _group);
        const _captures = patternInfo.streamCaptures || patternInfo.captures;
        if (_captures) {
            _line = Utils.TreatCapture(patternInfo, _captures, _line, [], option);
        }
        return _line;
    }
    /**
     * stream and transform
     * @param {*} formatter 
     * @param {string} _line 
     * @param {array} op 
     * @param {*} option 
     */
    treatAndTransform(formatter, _line, option, op) {
        return formatter.treatMarkerValue(patternInfo, _line, op, option);
    }
    /**
     * 
     * @returns 
     */
    handleMarkerListener(option) {
        const q = this;
        let _restored = false;
        function _restoreSavedBuffer(option) {
            let _nbuffer = option.buffer;
            if (!_restored && (_nbuffer.length > 0)) {
                q.appendToBuffer(_nbuffer);
            }
        }
        function _restoreState(option, _bck) {
            if (_restored) {
                return;
            }
            _restoreSavedBuffer(option);
            option.appendToBufferListener = _bck.option.listener;
            _restored = true;
        };
        function _restoreBackupState(parent) {
            /**
             * restore backup state mode 
             */
            parent.mode = _bck.parentMode;
        }
        const _bck = q.saved;
        if (!q.started) {
            // save backup mode 
            q.started = true;
            const { parent } = q.from;
            if (parent) {
                _bck.parent = parent;
                //backup parent definition 
                _bck.parentMode = parent.mode;
            }
        } else {
            if (_bck.parent) {
                _bck.parent.mode = FormattingMode.FM_APPEND; // just append mode 
            }
        }

        return function (markerInfo, option) {
            option.stream = q;
            const _formatter = this;
            let _next_position = option.pos;
            let _buffer = q.buffer;
            const { from } = q;
            const _line = option.line.substring(option.pos);
            let _p, _matcher;
            const _markerInfo = option.markerInfo;
            try {
                if (!_bck.started) {
                    // + | ------------------------------------------------------------------------
                    // + |  move cursor in order to detect only children with pattern because buffered stream have no capture defined
                    // + | 

                    _bck.started = true;
                    //option.pos++;
                }
                ({ _p, _matcher } = _formatter.detectPatternInfo(_line, markerInfo, option, false, markerInfo));
            } catch (e) {
                // invalid stream tag selection 
                const cp = _markerInfo.shift();
                if (_bck.saved) {
                    _restoreState(option, _bck);
                }
                option.line = q.buffer + option.line.substring(option.pos);
                throw e;
            }
            let _old = _markerInfo.length > 0 ? _markerInfo.shift() : null;
            // let _found = false;
            // options.pos++;
            if (!_bck.saved) {
                _bck.option = {
                    listener: option.appendToBufferListener
                };
                // + | Set add to buffer listener : data
                option.appendToBufferListener = (v, _marker, treat, option) => {
                    _buffer = option.buffer;
                    if (_buffer.length > 0) {
                        q.appendToBuffer(_buffer);
                        option.formatterBuffer.clear();
                    }
                    q.appendToBuffer(v);
                    return v;
                };
                _bck.saved = true;
            }

            if (option.EOF && (_p == null) && (_matcher == null)) {
                return q.stopAndExitStream(markerInfo, option, _bck, _restoreState, _old);
            }

            option.storeRange(option.pos);
            // FormatterBuffer.DEBUG = true;            
            let r = null;
            const endFound = StreamConstantPattern.HandleStreamEndFound(q, markerInfo, _bck, _formatter, _restoreState, _restoreBackupState);
            q.endFoundListener = (_buffer, _line, patternInfo, _p, option, _old) => {
                const g = endFound(_buffer, _line, patternInfo, _p, option, _old);
                _restoreSavedBuffer(option);
                return g;
            };
            try {
                r = _formatter.handleMatchLogic({
                    _p,
                    _old,
                    _matcher,
                    _line,
                    patternInfo: from,
                    option: option,
                    _buffer,
                    endFound,
                    handleConstant(patternInfo, _line, option) {
                        if (_line.trim().length > 0) {
                            option.appendToBuffer(_line, patternInfo);
                        }
                        option.pos += _line.length;
                        if (_old) {
                            option.markerInfo.unshift(_old);
                            return _old.marker;
                        }
                        return markerInfo;// q.from;
                    }
                });
            } catch (e) {
                // update buffer 
                console.log("End buffer..... ", e);
            }
            _restoreSavedBuffer(option);
            option.stream = null;
            if (r && !(r instanceof PatternMatchInfo)) {
                throw new Error("pattern not valid");
            }
            return r;
        };
    }
    stopAndExitStream(patternInfo, option, _bck, _restoreState, _old) {
        const { from, parent } = this;
        const { formatter, markerInfo } = option;

        const _line = this.buffer;
        let ret = null;
        let bck = { line: option.line, pos: option.pos };
        _restoreState(option, _bck);
        formatter._onEndHandler(from, option);
        option.line = _line;
        option.pos = 0;

        if (parent != null) {
            throw new Error("not implement exit parent.");
        } else {
            ret = this.moveToNextPattern(patternInfo, option, _old, from);
        }
        option.line = bck.line;
        option.pos = bck.pos;

        //if (_old){
        //     option.restoreBuffer(_old);
        //}
        _old = option.shiftFromMarkerInfo(from);
        if (_old) {
            let _rbuffer = option.buffer;
            option.restoreBuffer(_old);
            if (_rbuffer) {
                option.formatterBuffer.appendToBuffer(_rbuffer);
            }
        }
        return ret;
    }
    static HandleStreamEndFound(q, markerInfo, _bck, _formatter, _restoreState, _restoreBackupState) {
        return (_buffer, _line, patternInfo, _p, option, _old) => {
            const { parent, streamAction } = patternInfo;
            const { formatter } = option;

            let _cline = option.line;
            let _cbuffer = q.buffer;
            option.pos = 0;
            option.storeRange(option.pos);
            const _nextCapture = Utils.GetNextCapture(_line, markerInfo.endRegex);
            const _end = _nextCapture[0];
            const _sline = _line.substring(0, _nextCapture.index);
            _line = _line.substring(_nextCapture.index + _end.length);
            const _gline = _cbuffer + _sline + _end;
            const _tline = StreamConstantPattern.GetBufferedLine(formatter,
                _gline, option, patternInfo);



            option.line = _tline + _line;
            _restoreState(option, _bck);
            if (parent) {
                // + | end handler before handle parent
                _restoreBackupState(parent);
                _formatter._onEndHandler(parent, option);
                const _idx = patternInfo.indexOf;
                // restart on parent by removing to handle logic
                let _patterns = patternInfo.hostPatterns.slice(_idx + 1);
                // if (_patterns.length > 0) {
                if (_old) {
                    //option.restoreBuffer(_old);
                }
                if (streamAction) {
                    if (streamAction == 'parent') {
                        return parent;
                    }
                }
                let g = Utils.GetPatternMatcherInfoFromLine(option.line, _patterns, option, parent);

                if (g) { // continue to cp
                    let cp = _formatter._handleMarker(g, option);
                    return cp;
                }
                return parent; //_formatter._handleMarker(parent, option);
            }
            // + | put this line to buffer and skip   
            return q.moveToNextPattern(patternInfo, option, _old, markerInfo);
        }
    }
}

exports.Formatters = Formatters;
exports.Utils = Utils;
exports.Patterns = Patterns;
exports.JSonParser = JSonParser;
// Utils.DefineProperties(Utils.Classes, exports);