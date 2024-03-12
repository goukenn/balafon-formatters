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

// + | --------------------------------------------------------
// + | export pattern match information 
// + | --------------------------------------------------------
Utils.Classes = {
    RefPatterns,
    Patterns,
    PatternMatchInfo,
    CaptureInfo,
    CaptureRenderer,
    FormatterBuffer,
    FormatterOptions,
    Debug
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
    /**
     * create module from btm-format
     * @param {*} data btn-format data 
     * @returns {Formatters}
     */
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
        if (!formatter.settings){
            formatter.settings = new FormatterSetting();
        }
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
      
        let _listener = this.#createListener();
      
        let _formatterBuffer = new FormatterBuffer;
      
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
            _formatter._handleLineFeedFlag(objClass);
           


            if (_matcherInfo) {
                if (!_matcherInfo.marker.allowMultiline) {
                    throw new Error(`marker '${_matcherInfo.name}' do not allow multi line definition.`);
                }
                objClass.continue = true;
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
            const { debug } = objClass;
            while (pos < ln) {
                objClass.continue = false; 
                objClass.markerDepth = 0;
                _formatter._handleLineFeedFlag(objClass);
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
                        objClass.tokenList.length = 0
                        objClass.appendToBuffer(objClass.line.substring(objClass.pos), objClass.constants.GlobalConstant);
                        objClass.pos = ln;
                    }
                }
                pos = objClass.pos;
                
            }
            objClass.lineJoin = true;
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
    _handleLineFeedFlag(option){
        if (option.lineFeedFlag){
            option.appendLine();
            option.lineFeedFlag = false;
        }
    }
    _isBlockAndStart(_marker, option) {
        return _marker.isBlock && !option.continue;
    }

    _startBlock(option) {
        option.depth++;
        const { output, tabStop, depth, formatterBuffer } = option;
        option.listener?.startNewBlock({ buffer: '', formatterBuffer, output, tabStop, depth });
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
            value = Utils.DoReplaceWith(value, _formatter, _rpw, g, _marker);

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

            if (_marker.captures) { 
                c = option.treatBeginCaptures(_marker); 
            } 
            if (_op.indexOf('replaceWith') == -1) {
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
    _treatMarkerValue(_marker, c, op) {

        if (_marker.replaceWith) {
            c = this._operationReplaceWith(_marker, c, null);
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
        debug && Debug.log('--::: start begin/end handle marker 2 :::---');

        let _endRegex = null;
        let _start = true;
        let _line = '';
        let _old = null;
        let _buffer = null;
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
                    if (markerInfo.length > 0) {
                        this._updateMarkerInfoBlock(markerInfo[0], option);
                    }
                }
            } else {
                if (patternInfo.lineFeed && (option.depth == 0)) {
                    // auto change line feed 
                    if (!option.blockStarted){
                        option.blockStarted = true;
                    }else{
                        // append new line
                        option.appendLine();
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
        const { _p, _matcher } = this.detectPatternInfo(_line, patternInfo, option);


        if (_line.length == 0) {
            this._updateMarkerInfoOld(patternInfo, _old, _buffer, patternInfo.endRegex, option);
            return patternInfo;
        }
        if (_matcher == null) {
            // no child matcher found
            if (_p == null) {

                if (patternInfo.group[0].length == 0) {
                    // + | detect buffer empty - buffer detection 
                    let _stream_buffer = new StreamConstantPattern();
                    _stream_buffer.from = patternInfo;
                    _stream_buffer.appendToBuffer(_line);
                    let _nPatternInfo = new PatternMatchInfo();
                    _nPatternInfo.use({
                        marker: _stream_buffer,
                        endRegex: _endRegex, group: patternInfo.group, line: option.line, parent: patternInfo
                    });

                    option.pos = option.line.length;
                    this._updateMarkerInfoOld(_nPatternInfo, null, '', _endRegex, option);
                    return _nPatternInfo;
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
                return this._handleFoundEndPattern(_buffer, _line, patternInfo, _p, option, _old);
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
            return this._handleFoundEndPattern(_buffer, _line, patternInfo, _p, option, _old);
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
    /**
     * detect logical pattern info
     * @param {string} _line 
     * @param {PatternMatchInfo} patternInfo 
     * @param {FormatterOption} option 
     * @returns 
     */
    detectPatternInfo(_line, patternInfo, option) {
        let _matcher = null;
        let _p = null; // end matcher 
        let _endRegex = patternInfo.endRegex;
        _matcher = (_line.length > 0) &&
            (patternInfo.patterns && (patternInfo.patterns.length > 0)) ?
            Utils.GetPatternMatcher(patternInfo.patterns, option, patternInfo) : null;
        _p = _line.length > 0 ? _endRegex.exec(_line) : null;
        if (_p) {
            _p.index += option.pos;
        }
        return { _p, _matcher };
    }
    _updatedPatternMatch(_marker, option) {
        let _prev = option.getLineRangeContent();
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
    _handleFoundEndPattern(_buffer, _line, _marker, _p, option, _old) {
        // calculate next position 
        const { debug } = option;
        const _next_position = _p.index + _p[0].length;
        let _append = option.line.substring(option.pos, _p.index);
        // let _sblock = _marker?.parent?.isBlock;
        // let _p_host = ((option.markerInfo.length > 0) ? option.markerInfo[0] : null);
        let _saved = false;
        if (_old==null){
            option.saveBuffer();
            _saved = true;
        }
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
        // +| restore backup buffer
        if(_saved){
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
        // + | create a new buffer 
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
        let _stream_buffer = new StreamConstantPattern();
        const _endRegex = patternInfo.endRegex;
        _stream_buffer.from = patternInfo;
        _stream_buffer.appendToBuffer(_line);
        let _nPatternInfo = new PatternMatchInfo();
        _nPatternInfo.use({
            marker: _stream_buffer,
            endRegex: _endRegex, group: patternInfo.group, line: option.line, parent: patternInfo
        });

        option.pos = option.line.length;
        this._updateMarkerInfoOld(_nPatternInfo, null, '', _endRegex, option);
        return _nPatternInfo;
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
        itemFound = itemFound || function () {
            this._updateMarkerInfoOld(patternInfo, _old, _buffer, _endRegex, option);
            option.storeRange(option.pos, _matcher.group.index);
            if (option.range.start != option.range.end) {
                this._updatedPatternMatch(patternInfo, option);
                option.storeRange(option.pos);
            }
            //option.continue = false;
            return this._handleMarker(_matcher, option);
        };
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
                return itemFound.apply(this, []);
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
    isSpecialMarker(marker){
        return marker instanceof SpecialMeaningPatternBase
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
    shiftIdConstant(){
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
    constructor() {
        super();
        var m_stream = new FormatterBuffer();// '';
        var m_from;
        this.appendToBuffer = function (v) {
            m_stream.appendToBuffer(v);
        }
        this.clear = function () {
            m_stream = '';
        }
        Object.defineProperty(this, 'buffer', { get() { return m_stream.buffer; } });
        Object.defineProperty(this, 'from', {
            get() {
                return m_from;
            },
            set(v) {
                m_from = v;
            }

        })
    }
    get matchType() {
        return 4;
    }
    handleMarkerListener() {
        const q = this;
        return function (markerInfo, option) {
            const _formatter = this;
            let _next_position = option.pos;
            const _line = option.line.substring(option.pos);//+'sample';
            const { _p, _matcher } = _formatter.detectPatternInfo(_line, markerInfo, option);
            let _old = option.markerInfo.length > 0 ? option.markerInfo.shift() : null;
            // let _buffer = q.buffer;
            const r = _formatter.handleMatchLogic({
                _p,
                _old,
                _matcher,
                _line,
                patternInfo: q.from,
                option,
                endFound(_buffer, _line, patternInfo, _p, option, _old) {
                    // q.appendToBuffer(_line);
                    let _cline = option.line;
                    let _cbuffer = q.buffer;
                    option.pos = Math.max(_next_position - _cbuffer.length, 0); // _line.length;
                    option.storeRange(option.pos);
                    option.line = _cbuffer + _line;
                    let ret = _formatter._handleMarker(patternInfo.parent, option);
                    option.line = _cline;
                    option.pos -= _cbuffer.length;
                    option.storeRange(option.pos);
                    return ret;
                },
                handleConstant(patterInfo, _line, option) {
                    if (_line.trim().length > 0) {
                        q.appendToBuffer(_line);
                    }
                    option.markerInfo.unshift(_old);
                    return _old.marker;
                }
            });

            return r;
        };
    }
}

exports.Formatters = Formatters;
exports.Utils = Utils;
exports.Patterns = Patterns;
exports.JSonParser = JSonParser;