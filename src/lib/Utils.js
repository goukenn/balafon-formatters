"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const { JSonParser } = require("./JSonParser");
const { RegexUtils } = require("./RegexUtils");

/**
 * utility classe
 */
class Utils {
    static TestScope;

    /**
     * utility trim buffer segment
     * @param {*} bufferSegment 
     */
    static TrimBufferSegment(bufferSegment, dataSegment) {
        if (dataSegment.length != bufferSegment.length){
            throw new Error('invalid trim operation. length must match');
        }
        const _tlist = bufferSegment.marked.slice(0);
        let _dir = 0;
        let _idx = 0;
        let _count = 0;
        let q = bufferSegment;
        let _ln = bufferSegment.length;

        while (_tlist.length > 0) {
            _idx = _dir == 0 ? _tlist.shift() : _tlist.pop();
            let _top = bufferSegment.marked.op[_idx] || null;
            let _trim = _dir == 0 ? _idx == _count : _idx == _count;
            if (_top && _trim && _top.trimmed) {
                //let _ts = q[_idx];
                delete (q[_idx]);
                delete (dataSegment[_idx]);
                delete (bufferSegment.marked[bufferSegment.marked.indexOf(_idx)]);
                delete (bufferSegment.marked.op[_idx]);

            }
            if (_dir == 1) {
                if (!_trim) {
                    break;
                }
                _count--;
            } else {
                if (!_trim) {
                    _dir = 1;
                    _count = _ln - 1;
                    _tlist.unshift(_idx);
                    continue;
                }
                _count++;
            }
        }

        if (dataSegment.length != bufferSegment.length){
            throw new Error('invalid trim operation');
        }
    }
    /**
     * get marked segment setting
     * @param {*} marker 
     * @returns 
     */
    static GetMarkedInfo(marker){
        let _info = null;
        const { isMarkedSegments, isTrimmedSegment, markedSegment } = marker;
        if (isMarkedSegments) {
            if (typeof (markedSegment) == 'object') {
                _info = {
                    trimmed: isTrimmedSegment,
                    ...markedSegment
                }
            }else{
                _info = {isTrimmed: isTrimmedSegment};
            }
            return _info;
        }
        return false;
    }
    static ReorderBufferSegment(bufferSegment) {
        const { FormatterBuffer } = Utils.Classes;
        // order 
        const _op = bufferSegment.marked.op;
        const _marked = bufferSegment.marked;
        let _ni = 0;
        let _buff = [];
        _buff.marked = FormatterBuffer.InitMarkedSegment();
        // update buffer marker order 
        for (let ri = 0; ri < bufferSegment.length; ri++) {
            if (bufferSegment[ri] != undefined) {
                // delete 
                _buff.push(bufferSegment[ri]);
                if (ri in _op) {
                    _buff.marked.push(_ni);
                    _buff.marked.op[_ni] = _op[ri];
                } else if (_marked.indexOf(ri) != -1) {
                    _buff.marked.push(_ni);
                }
                _ni++;
            }
        }

        bufferSegment.length = 0;
        bufferSegment.push(..._buff);
        bufferSegment.marked = _buff.marked;

    }

    /**
     * 
     * @param {*} _d 
     * @param {*} _idx 
     * @param {*} op operation to do 
     */
    static UpdateSegmentMarkerOperation(_d, _idx, op) {
        if (Array.isArray(_d)==false){
            throw new Error("required array");
        }
      
        // if (!op) {
        //     console.log("----not op-----", _d);
        //     return;
        // }
        _d.op[_idx] = op;
    }
    static UpdateMarkedSegment(s, _marker) {
        if (_marker.isMarkedSegments) {
            s.marked = _marker.markedInfo();
        }
    }

    /**
     * Get default begin captures
     * @param {*} marker 
     * @returns 
     */
    static BeginCaptures(marker) {
        return { ...marker.captures, ...marker.beginCaptures };
    }
    static EndCaptures(marker) {
        return { ...marker.captures, ...marker.endCaptures };
    }

    static JSON_REGEX_PARSER() {
        return (s) => {
            if (s == '(??)') {
                q.isStartOnly = true;
                s = '';
            }
            let is_empty = false;
            if (s == '') {
                is_empty = true;
            }
            let g = Utils.RegexParse(s, 'd');
            g = RegexEngine.Load(g, is_empty);
            return g;
        };
    }

    /**
     * create end match
     * @param {*} value 
     * @returns 
     */
    static CreateEndMatch(value, input) {
        const _p = [value];
        _p.index = 0;
        _p.indices = [[0, value.length]];
        _p.input = input || "\0";
        return _p;
    }

    static ReplaceWithCheck(replaceWith, value, { match, captures, operator, check }, _refObj) {
        let _rpw = Utils.RegExToString(replaceWith);
        const { g } = _refObj;
        _refObj._rpw = _rpw;
        if (match) {
            let _op = operator || '=';
            let _s = Utils.ReplaceRegexGroup(check, g);
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
        else {
            _refObj.replaced = false;
        }
        return value;
    }

    /**
     * render data
     * @param {string} value 
     * @param {PatternMatchInfo} marker 
     * @param {null|CaptureInfo[]} captures 
     * @param {FormatterOptions} option 
     * @returns 
     */
    static RenderToBuffer(value, marker, captures, option) {
        let _cm_value = value;
        let _cm_data = value;

        // if (captures){
        //     _cm_value = Utils.TreatCapture(marker, captures, _cm_value, option.tokenChains, option)
        // }

        option.saveBuffer();
        option.appendToBuffer(_cm_value, marker, option);
        option.store();
        let refdata = { data: null };
        _cm_value = option.flush(true, refdata);
        _cm_data = refdata.data;
        option.restoreSavedBuffer();

        return {
            "buffer": _cm_value,
            "data": _cm_data
        };

    }
    /**
     * define properties
     * @param {*} target 
     * @param {*} def 
     */
    static DefineProperties(target, def) {
        for (let i in def) {
            target[i] = def[i];
        }
    }
    /**
    * define and inject property 
    * @param {string} n namespace
    * @param {undefined|*} v 
    * @param {*} globalname 
    * @returns 
    */
    static FunctionDefineArg(n, v, globalname) {
        let c = 0;
        let result = 0;
        let s = '';
        if (globalname) {
            s = '((w,p,q,n)=>{n=w; while((p.length>1) && (q = p.shift())){ n[q] = n[q] || {}; n = n[q];} n[p[0]] = v})(' + globalname + ", \"" + n + "\".split('.'), v) || ";
        }
        n.split('.').forEach((i) => {
            if (!result) {
                result = i + '=((v)=>{ return ' + s + '{'
            } else {
                if (c) {
                    result += "{"
                }
                result += i + ":";
                c++;
            }
        });
        v = typeof (v) == 'undefined' ? 'undefined' : (typeof (v) == 'object' ? JSON.stringify(v) : v) || '"' + n + '"';
        result += v + '}'.repeat(c) + "})(" + v + ")";

        return result;
    }
    /**
     * define property 
     * @param {string} n 
     * @param {undefined|*} v 
     * @param {object} global object definition 
     * @returns 
     */
    static DefineProp(n, v, window) {
        return ((q, v, window) => {
            let r = null; let m = null; let _last = null; let _o = null;
            v = (typeof (v) != "undefined" ? v : n);
            if (q.length == 0) return v;
            q.forEach(i => {
                if (r == null) {
                    // first object definition
                    r = m = (window ? window[i] : null) || {};
                    if (window) {
                        window[i] = r;
                    }
                }
                if (_last) {
                    _o = m;
                    if (typeof (m[i]) == 'string') {
                        m[i] = {};
                    }
                    m[i] = m[i] || {};
                    m = m[i];
                }
                _last = i;
            });

            if (_o)
                _o[_last] = v;
            else {
                if (window) {
                    window[q[0]] = v;
                }
            }
            return r;
        })(n.split('.'), v, window);
    }
    /**
     * store tokens
     * @param {*} name 
     * @param {*} tokens 
     */
    static StoreTokens(name, tokens) {
        tokens.unshift(...name.split(' ').reverse());
    }
    /**
     * unshift tokens
     * @param {*} name 
     * @param {*} tokens 
     */
    static UnshiftTokens(name, tokens) {
        const r = name.split(' ').reverse();
        while (r.length > 0) {
            const q = r.shift();
            if (tokens[0] == q) {
                tokens.shift();
            } else {
                throw new Error('missing tokens definition ' + q);
            }
        }
    }

    static ArrayPatternsFromParser(parser, Patterns, RefPatterns) {

        const _pattern_class = parser.patternClassName || Patterns;
        return Utils.ArrayParser(_pattern_class, RefPatterns);
    }
    /**
     * 
     * @param {*} class_name 
     * @param {*} data 
     * @param {*} registry 
     * @param {null|undefined|{patternClassName: undefined|class, captureInfoClassName:undefined|class, closeParentInfoClassName: undefined|class}} registry 
     * @returns 
     */
    static JSonParseData(class_name, data, registry, pattern_class_name) {
        let parser = new JSonParser;
        parser.source = class_name;
        parser.data = data;
        parser.includes = {};
        // + | init parser definitions
        if (typeof (pattern_class_name) == 'object') {
            const { patternClassName, captureInfoClassName, closeParentInfoClassName } = pattern_class_name;
            parser.patternClassName = patternClassName;
            parser.captureInfoClassName = captureInfoClassName;
            parser.closeParentInfoClassName = closeParentInfoClassName;
        } else {
            parser.patternClassName = pattern_class_name;
        }
        if (registry) {
            parser.registry = registry;
        }
        return Utils.LoadData(parser, new class_name(), data, null); //.parse();
    }
    static LoadData(parser, obj, data, refKey) {
        return JSonParser._LoadData(parser, obj, data, refKey);
    }
    /**
     * array parser callback
     * @param {*} class_name 
     * @returns 
     */
    static ArrayParser(class_name, refkey_class_name) {
        if (!refkey_class_name || typeof (refkey_class_name) == 'undefined') {
            throw new Error('missing refkey_class_name');
        }
        /**
         * 
         */
        return function (d, parser, refKey, refObj) {
            let _out = [];
            let q = refObj || this;
            const { Formatters } = Utils.Classes;
            d.forEach((a) => {
                const { include } = a;
                const _extends = a.extends;
                let _o = null, _key = null, _def = null;
                if (include) {
                    if (include[0] == '#') {
                        // + | LOAD INCLUDE PROPERTY . #include
                        _key = include.substring(1);
                        if (_key in parser.includes) {
                            _o = new refkey_class_name(parser.includes[_key]);
                        }
                        else {
                            if (refKey && (refKey == _key) && refObj) {
                                _o = new refkey_class_name(q);
                            } else {
                                _def = parser.data.repository[_key];
                                if (_def) {
                                    _o = new class_name();
                                    parser.includes[_key] = _o;
                                    JSonParser._LoadData(parser, _o, _def, _key, refObj || _o);
                                    parser.initialize(_o);
                                    class_name.Init(_o);
                                }
                            }
                        }
                    } else {
                        // TODO: load engine source formatter - or not
                        // _o = new FormatterResourceLoadingPattern(include);
                        const { EngineFormatter } = Formatters;
                        if (EngineFormatter) {
                            return EngineFormatter.resolve(include);
                        }

                    }
                }
                else if (_extends) {
                    throw new Error("extends not support yet");
                }
                else {
                    _o = new class_name();
                    JSonParser._LoadData(parser, _o, a, refKey, refObj || _o);
                    parser.initialize(_o);

                }
                if (_o) {
                    _out.push(_o);
                }
            });
            return _out;
        }
    }
    /**
     * check skip pattern
     * @param {*} skip 
     * @param {*} marker 
     * @param {FormatterOptions} option 
     * @returns 
     */
    static CheckSkip(skip, marker, option) {

        if (typeof (skip) == 'string') {
            skip = [skip];
        }
        const _flags = {
            startLine: option.startLine,
            startBlock: option.startBlock,
            conditionBlockStart: option.isConditionalBlockStart()
        }
        while (skip.length > 0) {
            let q = skip.shift();
            if (q in _flags) {
                if (_flags[q]) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * 
     * @param {*} s 
     * @param {FormatterOptions} option 
     * @returns 
     */
    static _SkipLine(s, option) {
        let _skip = false;
        if (s.startLine) {
            if (!option.startLine) {
                _skip = true;
            }
        }
        if (!_skip && s.skip) {
            _skip = Utils.CheckSkip(s.skip, s, option);
        }
        if (!_skip && option.matchTransform && s.matchTransform) {
            _skip = true;
        }
        if (!_skip && (option.lastEmptyMarkerPattern?.marker == s)) {
            _skip = true;
            option.lastEmptyMarkerPattern = null;
        }
        return _skip;
    }
    /**
     * get match info
     * @var {array} patterns
     * @var {string} l string
     * @var {*} options
     * @var {*} parentMatcherInfo parent pattern for get result
     * @var {boolean|{_a,_match: null|number|RegExpResult,_from:undefined, patterns}}
     */
    static GetMatchInfo(patterns, l, option, parentMatcherInfo) {
        // const { FormatterOptions } = Utils.Classes;
        let _a = null;
        let _from = null;
        let _match = 0;
        let _index = -1;
        let _patterns = patterns;
        let _position = -1; // selected pattern position        
        const { lineMatcher, debug } = option;
        lineMatcher.startLine = option.startLine;
        const _tloop = [{ patterns: patterns, from: null, ref: parentMatcherInfo, count: 0 , slice:0}];
        const ll = l;
        while (_tloop.length > 0) {
            const _m_patterns = _tloop.shift();
            let _count = 0;
            let _mpatterns = _m_patterns.patterns.slice(_m_patterns.slice);
            while (_mpatterns.length > 0) {
                let s = _mpatterns.shift();
                //_m_patterns.patterns.forEach((s) => {
                let p = null;
                let from = null;
                let item_index = null;
                let skip = Utils._SkipLine(s, option);

                if (!skip) {
                    let { patterns } = s;
                    const _regex = s.getEntryRegex();
                    let _d = null;
                    if (_regex) {
                        p = lineMatcher.check(_regex, option);
                        _d = {
                            p, s: s, index: -1, regex: _regex, from: _m_patterns.from,
                            patterns: _m_patterns.patterns,
                            ref: _m_patterns.ref
                        };
                    }
                    else {
                        if (patterns) {
                             _tloop.push({ patterns: patterns, from: s, ref: parentMatcherInfo, 
                                count: _count ,
                                slice: 0});
                            if (_mpatterns.length > 0) {
                                _tloop.push({ patterns: _m_patterns.patterns, from: _m_patterns.from, ref: parentMatcherInfo, 
                                    count: _count, 
                                   slice : _m_patterns.patterns.length - _mpatterns.length});
                                _mpatterns.length = 0;
                            }
                            continue;
                        }
                    }
                    if (_d) {
                        ({ p, s, from, patterns } = _d);
                        item_index = _d.index == -1 ? _count : _d.index;
                    }
                    if (p && ((_index == -1) || (_index > p.index))) {
                        _index = p.index;
                        _a = s;
                        _match = p;
                        _from = from;
                        _patterns = patterns || _patterns;
                        _position = item_index || _count;
                    }
                }
                _count++;
                // });
            }
        } 
        if (_match === 0) {
            return false;
        }
        return { _a, _match, _from, patterns: _patterns, index: _position };
    }
    /**
     * 
     * @param {*} patterns 
     * @param {*} option 
     * @param {*} parentMatcherInfo 
     * @returns 
     */
    static GetPatternMatcher(patterns, option, parentMatcherInfo = null/*, _line = null, _sub_line_offset = null*/) {
        const { line, debug, depth, lineCount, lineMatcher, startLine } = option;
        const { FormatterPatternException } = Utils.Classes;
        let _a = null;
        let _match = 0;
        let _from = -1;
        let l = lineMatcher.nextLine;
        const { RefPatterns } = Utils.Classes;
        let index;
        ({ _a, _match, _from, patterns, index } = Utils.GetMatchInfo(patterns, l, option, parentMatcherInfo));
        if (_match) {
            if (_match.index > option.length) {
                _a = null;
                _match = null;
            }
        }
        if (_a) {

            debug?.feature('matcher-begin') && console.log('matcher-begin: ', {
                '__name': _a.toString(),
                name: _a.name,
                line,
                pos: _match.index,
                depth,
                hasParent: _a.parent != null,
                isBlock: _a.isBlock,
                comment: _a.comment,
                isRef: _a instanceof RefPatterns,
                value: _match[0],
                detectOn: l,
                offset: lineMatcher.offset,
                regex: _a.matchRegex,
                type: _a.matchType == 0 ? "begin/end" : "match",
                isFromGroupRef: _from != null,
                parent: _a.parent?.toString(),
                from: _from?.toString(),
                startLine
            });
            if (_a.throwError) {
                let e = _a.throwError;
                let msg = typeof (e) == 'object' ? e.message : 'invalid match';
                msg = msg.replace("%value%", "'" + _match[0] + "'");
                throw new FormatterPatternException(msg, _a, _match, lineCount);
            }
            // + | add property to offset 
            _match.offset = _match[0].length;
            // + | treat begin captures must be at corresponding data  
            let _info = new PatternMatchInfo;
            Utils.InitPatternMatchInfo(_info, _a, _match, parentMatcherInfo, _from, line, patterns, index, option.formatter.formatting,
                {
                    lineCount: option.lineCount
                }
            );
            return _info;
        }
        return _a;
    }
    /**
     * 
     * @param {*} _info 
     * @param {*} _a 
     * @param {*} _match 
     * @param {*} parentMatcherInfo 
     * @param {*} _from 
     * @param {*} line 
     * @param {*} patterns 
     * @param {*} index 
     * @param {*} formatting 
     * @param {{lineCount: number}} state state info
     */
    static InitPatternMatchInfo(_info, _a, _match, parentMatcherInfo, _from, line, patterns, index = -1, formatting=null, state = null) {
        _info.use({
            marker: _a,
            endRegex: _a.endRegex(_match),
            line,
            group: _match,
            parent: parentMatcherInfo,
            patterns,
            fromGroup: _from,
            index,
            formatting,
            state
        });
    }
    /**
     * 
     * @param {string} l 
     * @param {*} patterns 
     * @param {*} option 
     * @param {*} parentMatcherInfo 
     * @returns 
     */
    static GetPatternMatcherInfoFromLine(line, patterns, option, parentMatcherInfo) {
        const { debug, depth, lineCount, formatter } = option;
        const { RefPatterns, FormatterPatternException } = Utils.Classes;
        let _a = null;
        let _match = 0;
        let pos = 0;
        let _from = null;
        let index = -1;
        const { formatting } = formatter;
        ({ _a, _match, _from, patterns, index } = Utils.GetMatchInfo(patterns, line, option, parentMatcherInfo));

        if (_a) {
            // _match.index += pos;
            if (debug) {
                console.log('matcher-begin-1: ', {
                    '__name': _a.toString(),
                    name: _a.name, line, pos:
                        _match.index, depth,
                    hasParent: _a.parent != null,
                    isBlock: _a.isBlock,
                    isRef: _a instanceof RefPatterns,
                    value: _match[0],
                    regex: _a.matchRegex,
                    index
                });
            }
            if (_a.throwError) {
                let e = _a.throwError;
                const msg = typeof (e) == 'object' ? e.message : 'invalid match';
                throw new FormatterPatternException(msg, _a, _match, lineCount);
            }
            // + | add property to offset 
            _match.offset = _match[0].length;
            // +| treat begin captures must be at corresponding data info 

            let _info = new PatternMatchInfo;
            Utils.InitPatternMatchInfo(_info, _a, _match, parentMatcherInfo, _from, line, patterns, index, formatting);
            return _info;
        }
        return _a;
    }
    /**
     * get regex from
     * @param {string} s regex expression
     * @param {*} p group match
     * @returns 
     */
    static GetRegexFrom(s, p, flag, op) {
        if ((op == 'end') || (op == 'while')) {

            s = s.replace(/\\([\d]+)/g, (a, m) => {

                return p[m];
            });

        }
        else {

            s = s.replace(/[^\\]?\$([\d]+)/g, (a, m) => {
                if (a[0] == "\\") return a;
                if (a[0] != '$')
                    return a[0] + p[m];
                return p[m];
            });
        }
        s = /^\/.+\/$/.test(s) ? s.slice(1, -1) : s;
        return new RegExp(s, flag || '');
    }


    static ReplaceRegexGroup(s, group, op) {
        let gp = Utils.GetRegexFrom(s, group, null, op);
        gp = gp.toString().substring(1).slice(0, -1).replace(/\\\//g, "/");
        s = s.replace(s, gp);
        return s;
    }
    /**
     * convert to string en remove the flags
     * @param {*} regex 
     * @returns 
     */
    static RegExToString(regex) {
        let s = regex.toString();
        s = s.substring(0, s.lastIndexOf('/') + 1);
        return s;
    }

    /**
     * get regex info on start line
     * @param {string} s regex string expression
     */
    static RegexInfo(s) {
        return RegexUtils.RegexInfo(s);
    }
    static RegexParseInfo(s, flag) {
        let _info = Utils.RegexInfo(s);
        if (flag && ((_info.option.length == 0) || (_info.option.indexOf(flag) == -1))) {
            _info.option += flag;
        }
        return _info;
    }


    /**
     * 
     * @param {*} s 
     * @param {*} flag 
     * @returns 
     */
    static RegexParse(s, flag) {
        if (typeof (s) == 'string') {
            let _info = Utils.RegexParseInfo(s, flag);
            return new RegExp(_info.s, _info.option);
        } else if (typeof (s) == 'object') {
            if (s instanceof RegExp) {

                s = RegexUtils.RegexToStringRegex(s);
                let _info = Utils.RegexParseInfo(s, flag);
                let _ms = new RegExp(_info.s, _info.option);
                return _ms;
            }
            const { option, regex } = s;
            if (regex instanceof RegExp) {
                regex = Utils.GetRegexFrom(regex.toString(), option);
                return regex;
            }
            return new RegExp(regex, option);
        }
        return s;
    }
    static StringValueTransform(v, transform) {
        const _func = {
            captialize(s){
                let tb = [];
                s.split(" ").forEach(a =>{
                    tb.push(a.charAt(0).toUpperCase()+a.slice(1).toLowerCase());
                });
                return tb.join(" ");
            },
            joinSpace(s) {
                s = s.replace(/\s+/g, ' ');
                return s;
            },
            upperCase(v) {
                return v.toUpperCase();
            },
            lowerCase(v) {
                return v.toLowerCase();
            },
            trim(v) {
                return v.trim();
            },
            /**
             * 
             * @param {string} v 
             * @returns 
             */
            rtrim(v) {
                return v.trimEnd();
            }
            , /**
            * 
            * @param {string} v 
            * @returns 
            */
            ltrim(v) {
                return v.trimStart();
            }
        };
        transform.forEach((s) => {
            // if (v.length == 0) {
            //     return;
            // }
            let _p = null;
            if (_p = /^:(?<symbol>=|\^|#)(.)(?<number>\d+)/.exec(s)) {
                // + | replacement value with pattern
                let n = parseInt(_p.groups['number']);
                let _s = _p.groups['symbol'];
                if (n > v.length) {
                    let _g = _p[2];
                    if (_s == '#') {
                        v = v.toString().padEnd(n, _g);
                    } else if (_s == '^') {
                        v = v.toString().padStart(n, _g);
                    }
                    else if (_s == '=') {
                        let c = Math.floor((n - v.length) / 2);
                        v = v.toString().padEnd((c % 2) == 0 ? n - c : n - c + 1, _g);
                        v = v.toString().padStart(n, _g);
                    }
                }
                return v;
            }

            if (_p = /^\[(?<expression>.+)\]$/.exec(s)) {
                let c = Utils.GetRegexFrom(_p.groups['expression'], [v]);
                c = RegexUtils.Stringify(c);
                v = v.replace(v, c);
                return v;
            }

            v = typeof (s) == 'function' ? s(v) : _func[s](v);
        });
        return v;
    }
    /**
     * 
     * @param {*} q 
     * @param {*} validator 
     * @param {*} field_name 
     * @param {*} d 
     * @param {*} throw_on_error 
     * @returns 
     */
    static JSonValidate(q, validator, field_name, d, throw_on_error) {

        let f = validator ? validator[field_name] : null;
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
     * @param {*} q 
     * @param {*} parse 
     * @param {*} parser 
     * @param {*} fieldname 
     * @param {*} data 
     * @param {*} refKey 
     * @returns 
     */
    static JSonParse(q, parse, parser, fieldname, data, refKey) {
        let fc = parse ? parse[fieldname] : null;
        if (fc) {
            return fc.apply(q, [data, parser, refKey]);
        }
        return data;
    }
    static TransformPropertyCallback() {
        return function (n, parser) {
            if (typeof (n) == 'string') {
                let t = []
                n.split(',').forEach((i) => {
                    i.trim();
                    if (i.length > 0)
                        t.push(i);
                });
                return t;
            }
            if (Array.isArray(n)) {
                return n;
            }
        };
    }
    /**
 * do replace with
 * @param {*} value 
 * @param {*} _formatter 
 * @param {string} replace_with 
 * @param {*} group 
 * @param {*} _marker markerInfo
 * @param {FormatterOptions} option markerInfo
 * @param {*} captures markerInfo
 * @param {refobject|boolean} treat treat marker with capture
 * @returns 
 */
    static DoReplaceWith(value, _formatter, replace_with, group, _marker, option, captures, treat = true) {
        let g = group;
        let _rp = replace_with; // 
        let m = '';
        const { CaptureRenderer } = Utils.Classes;
        const { listener } = option;
        if (g) {
            // ------------------------
            // 
            //
            m = Utils.ReplaceRegexGroup(_rp, g); // check for regex presentation
            let check = m.replace(/(?<=(^|[^\\]))(\(|\))/g, ''); // remove capture brackets
            // escape range 
            // ------------------------
            // consider escape to check
            //
            let cp = new RegExp(m, 'd');
            let _in = value.replace(value, check).replace(/\\\\/g, /\\0/);
            // passing exec to formatt new value
            let matches = cp.exec(_in);
            const _tokens = option.tokenChains;
            const _caps = captures || _formatter.getMarkerCaptures(_marker);
            if (matches && _caps) {
                g = CaptureRenderer.CreateFromGroup(matches, _tokens);
                const _outdefine = {};
                let out = g.render(listener, _caps, false, _tokens, option, _outdefine, treat);
                if (typeof (treat) == 'object') {
                    treat.segments = _outdefine;
                }
                return out;
            }
            check = check.replace(/\\(.)/g, '$1');
            return check;

        } else {
            //treat:
            _rp = _rp.substring(1).slice(0, -1)
            if (_rp == '(?:)') {
                _rp = '';// empty string
            }
            m = _rp.replace(/\\\//g, "/");
        }
        value = value.replace(value, m);
        return value;
    }

    /**
     * Treat patterns values
     * @param {string|{value:string, name:string}} value value to treat 
     * @param {*} patterns 
     * @param {*} group - parent group match to resolve
     * @param {*} option - options
     * @returns 
     */
    static TreatPatternValue(value, patterns, group, option) {
        const _formatter = option.formatter;
        let _bckCapture = _formatter.info.captureGroup;
        _formatter.info.captureGroup = group;
        let name = null;
        let _name = null;
        let _value = null;
        // extra name and value
        if (typeof (value) == 'object') {
            ({ value, name } = value);
        } else {
            _value = value;
        }
        _name = name;
        _value = value;

        const q = option;
        if (_formatter.settings.useCurrentFormatterInstance) {
            option.pushState();
            // backup setting
            let _bck = {
                patterns: _formatter.patterns,
                buffer: q.buffer,
                output: q.output,
                formatterBuffer: q.formatterBuffer,
                lineCount: q.lineCount,
                markerInfo: q.markerInfo.slice(0),
                line: q.line,
                pos: q.pos,
                depth: q.depth,
                tokenList: q.tokenList.slice(0),
                markerDepth: q.markerDepth,
                blockStarted: q.blockStarted,
                appendToBufferListener: q.appendToBufferListener,
                lastEmptyMarkerPattern: option.lastEmptyMarkerPattern
            };
            // clean setting

            q.appendToBufferListener = null;
            q.lineCount = 0;
            q.depth = 0;
            q.markerInfo.length = 0;
            option.lineMatcher.save();
            option.lineSegments.save();
            option.lastEmptyMarkerPattern = null;
            q.newBuffer('_subformat_buffer_');
            _formatter.info.isSubFormatting++;
            _formatter.patterns = patterns;

            value = _formatter.format(_value, { name: _name });
            _formatter.info.isSubFormatting--;
            _formatter.patterns = _bck.patterns;
            // + | restore setting
            q.lineCount = _bck.lineCount;
            option.lineMatcher.restore();
            option.lineSegments.restore();
            q.line = _bck.line;
            q.depth = _bck.depth;

            q.appendToBufferListener = _bck.appendToBufferListener;
            q.restoreBuffer({ state: { formatterBuffer: _bck.formatterBuffer } });
            _bck.markerInfo.forEach(a => q.markerInfo.push(a));
            option.popState();
            option.lastEmptyMarkerPattern = _bck.lastEmptyMarkerPattern;

        } else {
            // passing value to pattern 
            let n_formatter = Formatters.CreateFrom({ patterns: d.patterns });
            value = n_formatter.format(value);
        }
        _formatter.info.captureGroup = _bckCapture;
        return value;
    }

    /**
     * 
     * @param {*} marker 
     * @param {*} _cap 
     * @param {*} group 
     * @param {*} tokenChains 
     * @param {*} option 
     * @returns {string|undefined}
     */
    static TreatCapture(marker, _cap, group, tokenChains, option) {
        const { listener } = option;
        const { CaptureRenderer } = Utils.Classes;
        let _s = null;
        if (Array.isArray(group) == false) {
            if (group === null)
                group = '';
            const indices = [];
            indices.push([0, group.length]);
            group = [group];
            group.indices = indices;
        }
        _s = CaptureRenderer.CreateFromGroup(group, marker.name);
        if (_s) {
            let _g = _s.render(listener, _cap, false, tokenChains, option);
            return _g;
        }
    }
    /**
     * get next capture data
     * @param {string} line 
     * @param {string} endRegex 
     * @param {*} option 
     * @returns 
     */
    static GetNextCapture(line, endRegex, option) {
        const { RegexUtils } = Utils.Classes;
        let m = endRegex.toString();
        m = m.substring(0, m.lastIndexOf('/') + 1).slice(1, -1);
        m = RegexUtils.UnsetCapture(m);
        let reg = new RegExp(m);
        let _ret = reg.exec(line);
        if (_ret) {
            _ret.offset = _ret[0].length;
        }
        return _ret;
    }

    static JSONInitCaptureField(q) {
        return (s, parser) => {
            const _info_class = parser.captureInfoClassName || Utils.Classes.CaptureInfo;
            let d = {};
            for (let i in s) {
                let m = new _info_class(q);
                JSonParser._LoadData(parser, m, s[i]);
                d[i] = m;
                parser.initialize(m);
            }
            return d;
        }
    }
    /**
 * 
 * @param {*} patterns 
 * @param {*} idx 
 * @param {*} action 
 * @returns 
 */
    static GetPatternsList(patterns, idx, action) {
        switch (action) {
            case 'next':
                return patterns.slice(idx + 1);
            case 'parent':
                break;
            case 'all':
                return patterns.slice(0);
            case 'exclude':
                let r = patterns.slice(0);
                delete (r[idx]);
                return r;
        }
        return [];
    }
}



exports.Utils = Utils;

// + | extra const usage 
const { PatternMatchInfo } = require("./PatternMatchInfo");