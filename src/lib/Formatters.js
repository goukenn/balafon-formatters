"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const { Utils } = require("./Utils");
const { Patterns } = require("./Patterns");
const { RefPatterns } = require("./RefPatterns");
const { JSonParser } = require("./JSonParser");
const { Debug } = require("./Debug");
const { FormatterListener } = require("./FormatterListener");
const { FormatterSetting } = require("./FormatterSetting");

Utils.Classes = {
    RefPatterns,
    Patterns
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
    json_keys(){
        const n = 'repository';
        let tab = Object.keys(this);
        let idx = tab.indexOf(n); 
        delete(tab[idx]);
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
                if ((m instanceof Patterns) && (m.name)) {
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
                if (i=='global'){
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

    #initDefinition(option) {
        const _rg = option || this.settings || Formatters.CreateDefaultOption();
        const { lineFeed, tabStop } = _rg;
        const { debug } = this;
        const _states = [];
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
            if (_marker.replaceWith) {
                let _g = _marker?.parent?.group;
                if (this.state == 'begin/end') {
                    _g = _marker.group;
                }
                value = _formatter._operationReplaceWith(_marker, value, _g);
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
        objClass.appendToBuffer = function (value, _marker) {
            this.debug && Debug.log("[append to buffer] " + value);
            let _buffer = this.buffer;
            _buffer = this.updateBufferValue(_buffer, value, _marker)
            this.buffer = _buffer;
        }

        objClass.treatBeginCaptures = function (_marker, endMatch) {
            let _cap = { ..._marker.captures, ..._marker.beginCaptures };
            if (is_emptyObj(_cap)) {
                return;
            }
            return this.treatCaptures(_cap, _marker, endMatch);
        };
        objClass.treatEndCaptures = function (_marker, endMatch) {
            let _cap = { ..._marker.captures, ..._marker.endCaptures };
            if (is_emptyObj(_cap)) {
                return;
            }
            const { debug } = this;
            // let transformed = _marker.endRegex(_marker.group); 
            // use replace with to change the value at specied capture 
            let list = [];
            list.markers = {};
            let prop = null;
            let _bckCapture = _formatter.info.captureGroup;
            _formatter.info.captureGroup = _marker.group;
            for (let i in _cap) {
                list.push(i);
                let d = _cap[i];
                if (!(i in endMatch)) {
                    this.pushError(101);
                    continue;
                }
                let value = endMatch[i];


                if (d.replaceWith) {
                    Formatters.DoReplaceWith(value, _formatter, d.replaceWith.toString(), _marker.group); // Formatters.GetMarkerGroup(_formatter, _marker))

                }
                if (d.nextTrimWhiteSpace) {
                    // TODO: Trim next buffer space 
                }
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
                if (d.patterns) {
                    debug && Debug.log('::::--- contains patterns');
                    if (_formatter.settings.useCurrentFormatterInstance) {
                        pushState();
                        let _bck = {
                            patterns: _formatter.patterns,
                            buffer: this.buffer,
                            output: this.output
                        };
                        this.output = [];
                        this.buffer = [];
                        _formatter.info.isSubFormatting++;
                        _formatter.patterns = d.patterns;
                        value = _formatter.format(value);
                        _formatter.info.isSubFormatting--;
                        _formatter.patterns = _bck.patterns;
                        this.output = _bck.output;
                        this.buffer = _bck.buffer;
                        popState();

                    } else {
                        // passing value to pattern 
                        let n_formatter = Formatters.CreateFrom({ patterns: d.patterns });
                        value = n_formatter.format(value);
                    }
                }

                endMatch[i] = value;
            }
            _formatter.info.captureGroup = _bckCapture;
            return list;
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

                if (d.replaceWith) {
                    let m = Utils.ReplaceRegexGroup(d.replaceWith.toString(), _marker.group);
                    value = value.replace(value, m);
                }
                if (d.nextTrimWhiteSpace) {
                    // TODO: Trim next buffer space 
                }
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


        objClass.store = function (startBlock = false) {
            const { listener } = this;
            if (listener) {
                const _ctx = this;
                const { buffer, output, depth } = _ctx;
                listener.store.apply(null, [{ buffer, output, depth, tabStop, _ctx, startBlock }]);
                this.buffer = '';
            }
        }

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

                this.buffer = '';
                this.output = [];
            }
            return l;
        }
        this._storeObjClass(objClass);
        return objClass;

    }
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

        let _marker = null;
        let _matcher = null;
        let _formatter = this;
        // let pos = 0;
        const { debug, lineFeed } = objClass;
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
            const { debug } = objClass;
            while (pos < ln) {
                objClass.continue = false;
                if (_marker) {
                    objClass.continue = true;
                    objClass.storeRange(objClass.pos);
                    _marker = _formatter._handleMarker(_marker, objClass);
                } else {
                    _matcher = Utils.GetPatternMatcher(this.patterns, objClass);
                    if (_matcher) {
                        objClass.storeRange(pos, _matcher.index);
                        _marker = _formatter._handleMarker(_matcher, objClass);
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
                    objClass.depth = Math.max(--objClass.depth, 0);;
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
        if (option.buffer.trim().length != 0) {
            throw new Error('buffer must be trimmed before start a new block');
        }
        option.buffer = option.buffer.trimEnd();
        option.depth++;
        option.listener.startNewBlock();
    }

    static DoReplaceWith(value, _formatter, replace_with, group) {
        let g = group;
        let _rp = replace_with; // .replaceWith.toString();
        let m = '';
        if (g) {
            m = Utils.ReplaceRegexGroup(_rp, g); //  _marker.parent.group);
        } else {

            m = _rp.replace(/\\\//g, "/");
        }
        value = value.replace(value, m);
        return value; q
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

    _operationReplaceWith(_marker, value, group) {
        let _formatter = this;
        if (_marker.replaceWith) {
            let _rpw = _marker.replaceWith.toString();
            const _cond = _marker.replaceWithCondition;
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
            value = Formatters.DoReplaceWith(value, _formatter, _rpw, g);

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
        let _p_host = option.markerInfo.length > 0 ?
            option.markerInfo[0] : null;
        if (_p_host) {
            this._updateMarkerChild(_p_host, _marker);
        }
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
        option.state = 'begin/end';
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
            // + | on start before handle 
            option.pos = _next_position;
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
            // priority to current marker 
            return this._handleFoundEndPattern(_buffer, _line, _marker, _p, option, _old);
            // throw new Error("Detected after not handle");
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
    _handleFoundEndPattern(_buffer, _line, _marker, _p, option, _old) {
        const { listener, debug } = option;
        // const _end_capture = _p[0].length == 0;

        if (debug) {
            // let l = _marker.name;
            console.log('matcher-end: ', {
                __name: _marker.toString(),
                name: _marker.name,
                line: option.line,
                pos: _p.index,
                depth: option.depth,
                hasParent: _marker.parent != null,
                isBlock: _marker.isBlock,
                value: _p[0],
                regex: _marker.end
            });

        }
        let _close_block = false;
        if (_marker.isBlock) {
            // just remove block before store 
            option.depth = Math.max(--option.depth, 0);
            // reset block value;
            _marker.isBlock = _old.oldBlockStart
            _close_block = true;

        }

        // calculate next position 
        const _next_position = _p.index + _p[0].length;
        // ent treatment
        let s = option.treatEndCaptures(_marker, _p);
        let _b = _p[0];
        let _append = option.line.substring(option.pos, _p.index);
        let _sblock = _marker?.parent?.isBlock;
        let _p_host = ((option.markerInfo.length > 0) ? option.markerInfo[0] : null);

        // update parent host with childrend

        if (_p_host) {
            this._updateMarkerChild(_p_host, _marker);
        }

        // update parent props
        this._updateParentProps(_marker); // move props to parent 

        // check request parentBlock for buffer
        let _requestParentBlock = _old && !_sblock && _marker?.parent?.isBlock;

        if (_requestParentBlock) {
            // validate the block to 
            _marker.parent.isBlock = this._isEmptyRequestBlock({ _marker, _old, childs: _old.childs, condition: _marker.requestParentBlockCondition });
        } else if (!_sblock && _marker?.parent?.isBlock){
            _marker.parent.isBlock = false;
        }

        if ((!s && (_append != _b) && (_append.trim().length > 0)) || (_requestParentBlock && _marker.parent.isBlock)) {
            // fix that capture not added with data .
            // if request to make parent block
            if (_requestParentBlock) {
                // this item change the parent block 
                if (_p_host) {
                    // pass buffer content to parent
                    // get startup buffer  
                    if (_old.entryBuffer.length>0) {
                        _p_host.content = option.updateBufferValue(_p_host.content, _old.entryBuffer, _p_host.marker);
                        // + | remove entry buffer 
                        _buffer = _buffer.replace(new RegExp('^' + _old.entryBuffer), '');
                    }

                    // start block definition 
                    _p_host.startBlock = 1;
                    _p_host.oldBlockStart = _sblock;
                } else {
                    option.appendToBuffer(_buffer, _marker);
                    option.store();
                }
                this._startNewBlock(_marker.parent, option);
                

            }
            if (!s && (_append != _b) && (_append.trim().length > 0)) {
                _buffer = option.updateBufferValue(_buffer, _append, _marker);
            }
        }
        else if (_requestParentBlock) {
            _marker.parent.isBlock = _p_host.oldBlockStart;
        }
        option.appendToBuffer(_buffer, _marker);
        _buffer = '';
        //}

        if (s) {
            // change marker definition group 
            if (0 in s.markers) {
                let g = s.markers[0];
                _marker = g.marker || _marker;
            }
        }
        if (_close_block) {
            option.store();

        }

        if (_b.length > 0) {
            option.appendToBuffer(_b, _marker);
        }
        option.moveTo(_next_position);

        if (_old && (_old.marker == _marker)) {
            // + | update a restore folder 
            // + | restore and update buffer
            const _cbuffer = option.buffer;
            let _tbuffer = option.flush(true);
            _tbuffer += _cbuffer;
            this._restoreBuffer(option, _old);

            if (_tbuffer.length > 0) {
                option.buffer += _tbuffer;
            }

        }

        return _marker.parent;
    }
    /**
     * check if this marker will be consider as an empty block if requested
     * @param {*} _marker 
     * @param {*} _old 
     */
    _isEmptyRequestBlock({ childs, _marker, _old, condition }) {
        if (_old && true) {//_marker.blockToParentCondition){

            if (childs.length == 0) {
                return false;
            }
            if (condition) {
                let r = true;
                let q = null;
                let expression = this._funcRegistryExpression();
                const list = expression.namespaces.join(',');
                let fc = new Function("registry", "child", "marker", `const {${list}} = registry;  return ${condition};`);
                while (childs.length > 0) {
                    q = childs.shift();

                    try {
                        r = fc.apply({ child: q }, [expression.registry, q, _marker]);
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
        }
        return true;
    }
    /**
     * update marker child
     * @param {} _p_host 
     * @param {*} _marker 
     */
    _updateMarkerChild(_p_host, _marker) {
        _p_host.childType = !_p_host.childType && (
            !_marker.tokenID || /^constant./.test(_marker.tokenID));
        _p_host.childs.push({ name: _marker.name, range: { start: 0, end: 0 } });
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
            // content: l, // define content property
            endRegex: _endRegex,
            startBlock: _marker.isBlock ? 1 : 0, // start join mode 0|block = append new line before 
            oldBlockStart: _marker.isBlock, // backup the start source start  
            childs: [],
            childType: false, // for constant only purpose
            state: {
                buffer: option.buffer,
                output: option.output
            },
            entryBuffer: l // used to handle first entry buffer for block definition
        };
        (function (entry) {
            var _content = entry;
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
        })(l);
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
                option.store(_old.startBlock);
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

    _handleSameGroup2(_marker, _matcher, _p, _old, _buffer, option, _endRegex) {
        if (_matcher.group[0].length == 0) {
            // matcher is empty and must past to end group
            if (_endRegex.test(_buffer)) {
                return this._handleFoundEndPattern(_buffer, option.line , _marker, option,_old);
            }
        }
        
        // + | update parent markerin of before handle marker 
        if ((option.markerInfo.length==0) || (option.markerInfo[0]!== _marker)){
            this._updateMarkerInfoOld(_marker, _old, _buffer, _endRegex, option);
        }
        return this._handleMarker(_matcher, option);
    }
    _handleEndBlock2(_marker, option) {

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