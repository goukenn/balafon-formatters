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
const { HandleFormatting, updateBuffer } = require("./Formattings/FormattingMode");
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
     */
    static Load(name, pattern_class_name) {
        const data = require("../../data/" + name + ".btm-format.json");
        if (data) {
            return Formatters.CreateFrom(data, pattern_class_name)
        }
        return null;
    }
    /**
     * create module from btm-format
     * @param {*} data btn-format data 
     * @returns {Formatters}
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
        let objClass = this.objClass;
        if (!objClass) {
            objClass = this.#initDefinition(option);
        }
        let _matcherInfo = null;
        let _formatter = this;
        // let pos = 0;
        const { debug, lineFeed } = objClass;

        if (!this.info?.isSubFormatting) {
            objClass.blockStarted = false;
        }

        // option = objClass;
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
                        objClass.tokenList.length = 0;
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
        });

        debug && Debug.log('...end...');
        if ((objClass.markerInfo.length > 0) && (this.info.isSubFormatting == 0)) {
            const _formatting = this.formatting;
            // missing close marker info
            debug && Debug.log('.....contains marker info .....' + objClass.markerInfo.length);
            while (objClass.markerInfo.length > 0) {
                let _old = objClass.markerInfo.shift();
                this._handleLastExpectedBlock(_old, objClass, _formatting);
            }
            // let q = null;
            // while (q = objClass.markerInfo.shift()) {
            //     this._restoreBuffer(objClass, q);
            //     objClass.formatterBuffer.appendToBuffer(q.content);
            //     if (q.marker.isBlock) {
            //         objClass.depth = Math.max(--objClass.depth, 0);;
            //         objClass.output.push(objClass.buffer);
            //         objClass.formatterBuffer.clear();
            //     } 
            // }
        } else {
            objClass.markerInfo.length = 0;
        }
        objClass.store();
        const _output = objClass.output.join(lineFeed).trimEnd();
        // + | clear buffer list  
        this.objClass.formatterBuffer.clearAll();
        this.objClass.tokenList.length = 0;
        return _output;
    }
    _handleLastExpectedBlock(_old, option, _formatting) {
        // TODO: Dynamic closing block must not being regex closing
        const { marker } = _old;
        const _group = marker.group;
        if (marker.marker.throwErrorOnEndSyntax) {
            throw new Error('invalid syntax');
        }
        if (marker.isEndCaptureOnly) {
            return;
        }
        let regex = Utils.ReplaceRegexGroup(Utils.RegExToString(_old.marker.end), _group);
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
     * @param {*} _markerInfo 
     * @param {*} end 
     * @returns 
     */
    getMarkerCaptures(_markerInfo, end = false) {
        const _type = _markerInfo.marker.matchType;
        if (_type == 0) {
            const s = end ? _markerInfo.marker.endCaptures : _markerInfo.marker.beginCaptures;
            return { ..._markerInfo.marker.captures, ...s };
        }
        return { ..._markerInfo.marker.captures };
    }


    /**
     * core handle marker handle marker 
     * @param {PatternMatchInfo} _marker 
     * @param {*} option 
     */
    _handleMarker(_marker, option) {
        if (!_marker) return;
        if (!option.continue) {
            const { name } = _marker;
            if (name && (_marker.marker.matchType == 0)) {
                option.tokenList.unshift(name);
            }
            this._updatedPatternMatch(_marker, option);
            option.storeRange(option.pos);
        }
        option.markerDepth++;
        /**
         * each callback must return a marker or null 
         * */
        const handle = this._handleCallback(_marker.marker.matchType, option) ||
            ((m) => m.handleMarkerListener ? m.handleMarkerListener() : null)(_marker.marker);
        if (!handle || (typeof (handle) != "function")) {
            throw new Error("marker type handler is not a valid callback." + _marker.marker.matchType);
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

            if (_op.indexOf('replaceWith') == -1) {
                option.appendToBuffer(_cm_value, _marker);
            } else {
                option.formatterBuffer.appendToBuffer(_cm_value);//, _marker);
            }
            if (_old && b) {
                _formatting.handleEndInstruction(this, _marker, _old, option);
            }
        }
        //else {
        // option.appendToBuffer("---li--" + option.buffer + " | ", _marker); 

        // console.log("the new buffer ", option.buffer, option.formatterBuffer);
        // throw new Error("ok");

        //}
        return _marker.parent;
    }
    _operateOnFramebuffer(_marker, option, _old) {
        return HandleFormatting.apply(this, [_marker, option, _old]);
    }
    /**
     * detected array operation
     * @param {{replaceWith:string|RegExp, transform:string|string[]}} _marker 
     * @param {string} c value 
     * @param {string[]} op detected operatrion
     * @returns 
     */
    treatMarkerValue(_marker, c, op, option) {
        if (_marker.replaceWith) {
            c = this._operationReplaceWith(_marker, c, null, option);
            op.push('replaceWith');
        }
        if (_marker.transform) {
            c = Utils.StringValueTransform(c, _marker.transform);
            op.push('transform');
        }
        return c;
    }
    /**
     * append constant
     * @param {*} patternInfo 
     * @param {string} data 
     * @param {FormatterOptions} option 
     * @param {bool} append_child append to child 
     * @param {FormatterOptions} option 
     */
    _appendConstant(patternInfo, data, option, append_child = true, constant_type_marker) {
        let _inf = new PatternMatchInfo;
        let { debug } = option;
        debug && Debug.log('--::appendConstant::--[' + data + ']');
        _inf.use({ marker: constant_type_marker || option.constants.PrevLineFeedConstant, line: option.line });
        if (append_child) {
            patternInfo.childs.push(_inf);
        }
        updateBuffer(data, patternInfo.mode, _inf, option);
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
        let _content = (_old.useEntry && _old.entryBuffer.length > 0) ? option.formatterBuffer.getContent(1) : option.buffer;
        option.formatterBuffer.clear();
        if (_old.useEntry) {
            option.formatterBuffer.appendToBuffer(_old.entryBuffer);
            option.store();
        } else {
            option.appendExtaOutput();
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
    _handleBeginEndMarker(patternInfo, option) {
        option.state = 'begin/end';
        const { debug, listener, line, markerInfo, startLine } = option;
        const { group } = patternInfo;
        debug && Debug.log('--::: start begin/end handle marker 2 :::---');

        let _endRegex = null;
        let _start = true;
        let _line = '';
        let _old = null;
        let _buffer = null;
        const { parent } = patternInfo;
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
        _endRegex = patternInfo.endRegex;// _endRegex || _marker.endRegex(_marker.group);
        let _next_position = patternInfo.group.index + patternInfo.group.offset;
        // treat patterns
        if (_start) {
            // + | on start before handle 
            option.pos = _next_position;
            if (parent && parent.isBlock && parent.isBlockStarted && this._isChildBlock(patternInfo)) {
                // update the block definition to child block  
                // option.appendExtaOutput(); 
                // must add extra line
                // patternInfo.mode = 2;
            }
        }
        _line = line.substring(option.pos);
        // let _continue_with_marker = false;  
        const { _p, _matcher, _error } = this.detectPatternInfo(_line, patternInfo, option, _start);

        if (_line.length == 0) {
            this._updateMarkerInfoOld(patternInfo, _old, _buffer, patternInfo.endRegex, option);
            return patternInfo;
        }
        if (_matcher == null) {
            // no child matcher found
            if (_p == null) {

                if (patternInfo.group[0].length == 0) {
                    // + | detect buffer empty - buffer detection 
                    let _nextOffset = option.line.length;
                    if (_error) {
                        _line = _line.substring(0, _error.index);
                        _nextOffset = option.pos + _error.index;
                    }
                    let _nPatternInfo = this._createStreamConstantPattern(patternInfo, _line, _endRegex, option);
                    option.pos = _nextOffset;
                    this._updateMarkerInfoOld(_nPatternInfo, null, '', _endRegex, option);
                    return _nPatternInfo;
                }

                // no end - found 
                // _continue_with_marker = false;
                // update cursor - start new marker and update - 
                this._updateMarkerInfoOld(patternInfo, _old, _buffer, _endRegex, option);
                this._appendConstant(patternInfo, _line, option);
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
                // handle matcher 
                return this._handleItemFoundCallback().apply(this, [
                    _matcher, patternInfo, _old, _buffer, _endRegex, option
                ]);
                // this._updateMarkerInfoOld(patternInfo, _old, _buffer, _endRegex, option);
                // // update previous matcher info
                // option.storeRange(option.pos, _matcher.group.index);
                // if (option.range.start != option.range.end) {
                //     this._updatedPatternMatch(patternInfo, option, null, null, true);
                //     this._updateOldMarker(option.markerInfo[0], false, option);
                //     option.storeRange(option.pos);
                // }
                // // start a new block
                // if (patternInfo.isBlock && !patternInfo.isBlockStarted) {
                //     _formatting.startBlockDefinition(this, patternInfo, option);
                // }
                // return this._handleMarker(_matcher, option);
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

                    return patternInfo;
                }
                return this._handleSameGroup2(patternInfo, _matcher, _p, _old, _buffer, option, _endRegex);
            }
            // priority to current marker 
            return this._handleFoundEndPattern(_buffer, _line, patternInfo, _p, option, _old);
            // throw new Error("Detected after not handle");
        }
        // if (_continue_with_marker) {
        //     this._updateMarkerInfoOld(patternInfo, _old, _buffer, _endRegex, option);
        //     return patternInfo;
        // }

        // // + | default append 
        // listener.append(group[0], patternInfo);
        // // + | move forward
        // option.moveTo(_next_position);
        // return null;
    }
    /**
     * detect logical pattern info
     * @param {string} _line 
     * @param {PatternMatchInfo} patternInfo 
     * @param {FormatterOption} option 
     * @param {bool} start 
     * @returns 
     */
    detectPatternInfo(_line, patternInfo, option, start) {
        let _matcher = null;
        let _p = null; // end matcher 
        let _endRegex = patternInfo.endRegex;
        let _offset = 0;//start ? 1 : 0;
        let _error = null;
        option.pos += _offset;

        try {
            _matcher = (_line.length > 0) &&
                (patternInfo.patterns && (patternInfo.patterns.length > 0)) ?
                Utils.GetPatternMatcher(patternInfo.patterns, option, patternInfo) : null;
        }
        catch (e) {
            if (!start) {
                throw e;
            }
            _error = {
                _line,
                index: e.match.index - option.pos + _offset
            }
        }

        option.pos -= _offset;
        _p = _line.length > 0 ? _endRegex.exec(_line) : null;
        if (_p) {
            _p.index += option.pos;
        }
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
    _updateBuffer(_marker, option, { _append, _buffer }) {
        const q = this;
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
            q._appendConstant(_marker, _append, option);
            _append = '';
        }
        return { _append, _buffer };
    }
    _handleFoundEndPattern(_buffer, _line, _marker, _p, option, _old) {
        // calculate next position 
        const { debug } = option;
        const { parent, mode } = _marker;
        const _next_position = _p.index + _p[0].length;
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
        // + | full fill pattern buffer 
        ({ _append, _buffer } = this._updateBuffer(_marker, option, { _append, _buffer }));
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
        // + | formatting on end block 
        if (_marker.formattingMode && !_marker.isBlock) {
            _formatting.formatBufferMarker(this, _marker, option);
        }

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
                    // + | remove entry and replace with {entry}\n\t // storage
                    let entry = _old.entryBuffer;
                    // let tbuffer = option.buffer;
                    // option.formatterBuffer.clear(); 
                    option.store(false);
                    // option.formatterBuffer.output.push('-');
                    let _rm = option.flush(true);
                    _buffer = _rm.trimStart().replace(new RegExp("^" + entry), '');//entry + _rm);
                    option.formatterBuffer.appendToBuffer(_buffer);
                    option.formatterBuffer.output.push(entry);
                    option.store();
                    _buffer = option.flush(true);
                    //_buffer = _buffer.replace(new RegExp("^" + entry), entry + _rm);
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
            option.tokenList.shift();
            option.appendToBuffer(_buffer, _marker);
        }

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
    /**
     * initialize marker info
     * @param {FormatterOptions} option 
     * @param {PatternMatchInfo} _marker 
     * @param {string} entry 
     * @param {string|RegExp} _endRegex 
     */
    _backupMarkerSwapBuffer(option, _marker, entry, _endRegex) {
        option.debug && Debug.log('backup and swap buffer.');
        const _inf = new FormatterMarkerInfo(this, _marker, entry, _endRegex, option);
        // + | unshift marker 
        option.unshiftMarker(_inf);
        // + | create a new buffer 
        option.newBuffer(option.markerInfo.length);
        // + | start by adding the first segment to buffer
        option.formatterBuffer.appendToBuffer(entry);
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
        let _lf = _old.startBlock == 1 ? option.lineFeed : '';
        let _buffer = _old.content;
        const { marker } = _old;
        const { debug } = option;
        const _formatting = this.formatting;
        debug && Debug.log("--::update oldmarker::--");
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
                return this._handleFoundEndPattern(_buffer, option.line, _marker, option, _old);
            }
        }
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
            endRegex: _endRegex,
            group: patternInfo.group,
            line: option.line, // source line
            parent: patternInfo,
            patterns: patternInfo.hostPatterns
        });
        _stream_buffer.startPosition = option.pos;
        return _nPatternInfo;
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
            // start a new block
            if (patternInfo.isBlock && !patternInfo.isBlockStarted) {
                _formatting.startBlockDefinition(this, patternInfo, option);
            }
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
    handleMatchLogic({ _p, _matcher, _buffer, _old, patternInfo, option, _line,
        endFound,
        itemFound, handleConstant }) {
        let _continue_with_marker = false;
        const _endRegex = patternInfo.endRegex;
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
                    return patternInfo;
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
        option.appendExtaOutput();
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
    /**
     * false to handle constant before matching on stream
     */
    get newLineContinueState() {
        return false;
    }
    constructor() {
        super();
        var m_stream = new FormatterBuffer();// '';
        var m_from;
        let m_saved = { saved: false, started:false };
        m_stream.id = '__stream__';
        const self = this;
       
        this.appendToBuffer = function (v) {
            m_stream.appendToBuffer(v); 
        }
        this.clear = function () {
            m_stream.clear();
        }
        Object.defineProperty(this, 'buffer', { get() { return m_stream.buffer; } });
        Object.defineProperty(this, 'saved', { get() { return m_saved; } });
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
        this.saveState = function (option) {
            if (this.m_saved) {
                return;
            }
        };
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
        return this.from.indexOf;
    }
    moveToNextPattern(patternInfo, option, _old, markerInfo) {
        option.pos = 0; // because of line this.startPosition || 0; 
        option.storeRange(option.pos);
        const _idx = this.indexOf; // patternInfo.indexOf;
        const _patterns = patternInfo.hostPatterns.slice(_idx + 1);
        let g = Utils.GetPatternMatcherInfoFromLine(option.line, _patterns, option);
        // let _bbuffer = this.buffer;
        if (_old) { 
            if (_old?.marker == markerInfo) {
                option.restoreBuffer(_old);
            }
        }
        if (g) {
            option.tokenList.shift();
            return g;
        }
        throw new Error('Stream Not implement With no parent');
    }
    handleMarkerListener() {
        const q = this;
        let _restored = false;
        function _restoreSavedBuffer(option) {
            let _nbuffer = option.buffer;

            if (!_restored &&  (_nbuffer.length > 0)) {
                q.appendToBuffer(_nbuffer); // .trimEnd());
            }
            option.restoreSavedBuffer();
        }
        function _restoreState(option, _bck) {
            if (_restored) {
                return;
            }
            _restoreSavedBuffer(option);
            option.appendToBufferListener = _bck.option.listener;
            _restored = true;
        };
        const _bck = q.saved;

        return function (markerInfo, option) {
            const _formatter = this;
            let _next_position = option.pos;
            let _buffer = q.buffer;
            const _line = option.line.substring(option.pos);//+'sample';
            let _p, _matcher;
            try {
                if (!_bck.started){
                    // + | ------------------------------------------------------------------------
                    // + |  move cursor in order to detect only children with pattern because buffered stream have no capture defined
                    // + | 
                      
                    _bck.started = true;
                    option.pos++;
                }
                ({ _p, _matcher } = _formatter.detectPatternInfo(_line, markerInfo, option));
            } catch (e) {
                // invalid stream tag selection 
                const cp = option.markerInfo.shift();
                if (_bck.saved){
                    _restoreState(option, _bck);
                }
                option.line = q.buffer+option.line.substring(option.pos);
                // return q.moveToNextPattern(markerInfo, option, cp, cp?.marker);
                throw e;
            }
            let _old = option.markerInfo.length > 0 ? option.markerInfo.shift() : null;
            // let _found = false;
            // options.pos++;
            if (!_bck.saved) {
                _bck.option = {
                    listener: option.appendToBufferListener
                };
                option.appendToBufferListener =  (v, _marker, treat, option)=>{
                    _buffer = option.buffer;
                    if (_buffer.length>0){
                        q.appendToBuffer(_buffer);
                        option.formatterBuffer.clear();
                    }
                    q.appendToBuffer(v);
                    return v;
                };
                _bck.saved = true;
            }
            option.storeRange(option.pos);
            option.saveBuffer();
            let r = null;
            try {
                r = _formatter.handleMatchLogic({
                    _p,
                    _old,
                    _matcher,
                    _line,
                    patternInfo: q.from,
                    option: option,
                    _buffer,
                    endFound(_buffer, _line, patternInfo, _p, options, _old) {
                        // q.appendToBuffer(_line);
                        // _found = true;
                        let _cline = options.line;
                        let _cbuffer = q.buffer;
                        options.pos = Math.max(_next_position - _cbuffer.length, 0); // _line.length;
                        options.storeRange(options.pos);
                        options.line = _cbuffer + _line;
                        if (patternInfo.parent) {
                            let ret = _formatter._handleMarker(patternInfo.parent, options);
                            options.line = _cline;
                            options.pos -= _cbuffer.length;
                            options.storeRange(options.pos);
                            return ret;
                        }
                        // + | put this line to buffer and skip 
                        // TODO: handle stream with no parent
                        _restoreState(options, _bck);
                        return q.moveToNextPattern(patternInfo, options, _old, markerInfo);
                    },
                    handleConstant(patterInfo, _line, option) {
                        if (_line.trim().length > 0) {
                            q.appendToBuffer(_line);
                        }
                        option.markerInfo.unshift(_old);
                        option.pos += _line.length;
                        return _old.marker;
                    }
                });
            } catch (e) {
                // update buffer 
                console.log("End buffer..... ", e);
            }
            _restoreSavedBuffer(option); 
            return r;
        };
    }
}

exports.Formatters = Formatters;
exports.Utils = Utils;
exports.Patterns = Patterns;
exports.JSonParser = JSonParser;
// Utils.DefineProperties(Utils.Classes, exports);