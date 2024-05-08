Object.defineProperty(exports, '__esModule', { value: true });

const { JSonParser } = require("./JSonParser");
const { PatternMatchInfo } = require("./PatternMatchInfo");
const { FormatterResourceLoadingPattern } = require("./FormatterResourceLoadingPattern");
const { RegexUtils } = require("./RegexUtils");

class Utils {
    static TestScope;
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
                        console.log("loading source , ", include);
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
     * get match info
     * @var {array} patterns
     * @var {string} l string
     * @var {*} options
     * @var {*} parentMatcherInfo parent pattern for get result
     * @var {boolean|{_a,_match: null|number|RegExpResult,_from:undefined, patterns}}
     */
    static GetMatchInfo(patterns, l, option, parentMatcherInfo) {
        let _a = null;
        let _from = null;
        let _match = 0;
        let _index = -1;
        let _patterns = patterns;
        let _position = -1; // selected pattern position 
        let _count = 0;
        patterns.forEach((s) => {
            let _ts = s;
            let p = null;
            let from = null;
            let item_index = null;
            let skip = false;
            if (s.startLine) {
                if (!option.startLine) {
                    skip = true;
                } 
            }

            if (!skip) {
                let _d = _ts.check(l, option, parentMatcherInfo);
                // TODO: match agains source line to check 
                // if (_ts.name == "detect.sub--start"){
                    if((_d.regex) && (l.length>0)&&(option.sourceLine != l)&&(!option.startLine) && RegexUtils.CheckRequestStartLine(_d.regex)){
                        const _td = _ts.check(option.sourceLine, option, parentMatcherInfo, _d.regex);
                        // ignore start line
                        if (_td && (_td.index == -1)){
                            _d = null;
                        }
                    }
                // }
                // check agains source line
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
        });

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
    static GetPatternMatcher(patterns, option, parentMatcherInfo = null) {
        const { line, pos, debug, depth, lineCount } = option;
        const { FormatterPatternException } = Utils.Classes;
        let _a = null;
        let _match = 0;
        let _from = -1;
        let l = line.substring(pos);
        const { RefPatterns } = Utils.Classes;
        let index;


        // ({ _a, _match, _from } = Utils.GetMatchInfo(patterns, l, options, parentMatcherInfo));
        ({ _a, _match, _from, patterns, index } = Utils.GetMatchInfo(patterns, l, option, parentMatcherInfo));


        if (_a) {
            _match.index += pos;

            if (debug) {
                console.log('matcher-begin: ', {
                    '__name': _a.toString(),
                    name: _a.name, line, pos:
                        _match.index, depth,
                    hasParent: _a.parent != null,
                    isBlock: _a.isBlock,
                    comment: _a.comment,
                    isRef: _a instanceof RefPatterns,
                    value: _match[0],
                    detectOn: l,
                    regex: _a.matchRegex,
                    type: _a.matchType == 0 ? "begin/end" : "match",
                    isFromGroupRef: _from != null
                });
            }
            if (_a.throwError) {
                let e = _a.throwError;
                let msg = typeof (e) == 'object' ? e.message : 'invalid match';
                msg = msg.replace("%value%", "'"+_match[0]+"'");
                throw new FormatterPatternException(msg, _a, _match, lineCount);
            }
            // + | add property to offset 
            _match.offset = _match[0].length;
            // +| treat begin captures must be at corresponding data info

            let _info = new PatternMatchInfo;
            Utils.InitPatternMatchInfo(_info, _a, _match, parentMatcherInfo, _from, line, patterns, index, option.formatter.formatting);
            return _info;
        }
        return _a;
    }
    static InitPatternMatchInfo(_info, _a, _match, parentMatcherInfo, _from, line, patterns, index = -1, formatting) {
        _info.use({
            marker: _a,
            endRegex: _a.endRegex(_match),
            line,
            group: _match,
            parent: parentMatcherInfo,
            patterns,
            fromGroup: _from,
            index,
            formatting
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
            _match.index += pos;
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
        if ((op == 'end') || (op=='while'))
        {
            
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
        s = /^\/.+\/$/.test(s) ? s.substring(1).slice(0, -1) : s;
        return new RegExp(s, flag || '');
    }


    static ReplaceRegexGroup(s, group, op) {
        let gp = Utils.GetRegexFrom(s, group, null,op);
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
     * 
     * @param {string} s regex string expression
     */
    static RegexInfo(s) {
        let option = '';
        if (s == "(??)") {
            return {
                s: "^.^",
                option,
                beginOnly: true
            };
        }

        let _option = /^\(\?(?<active>[imx]+)(-(?<disable>[ixm]+))?\)/;
        let _potion = null;
        if (_potion = _option.exec(s)) {
            let sp = '';
            if (_potion.groups) {
                sp = _potion.groups.active ?? '';
                if (_potion.groups.disable) {
                    _potion.groups.disable.split().forEach(i => {
                        sp = sp.replace(i, '');
                    });
                }
            }
            s = s.replace(_option, '');
            option = sp;
        }
        return {
            s,
            option
        };
    }
    static RegexParseInfo(s, flag) {
        let _info = Utils.RegexInfo(s);
        if (flag && ((_info.option.length == 0) || (_info.option.indexOf(flag) == -1))) {
            _info.option = flag;
        }
        return _info;
    }
    static RegexParse(s, flag) {
        if (typeof (s) == 'string') {
            let _info = Utils.RegexParseInfo(s, flag);
            return new RegExp(_info.s, _info.option);
        } else if (typeof (s) == 'object') {
            if (s instanceof RegExp) {

                let _info = Utils.RegexParseInfo(s.toString(), flag);
                return new RegExp(_info.s, _info.option);
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
            if (v.length == 0) {
                return;
            }
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
 * @param {*} replace_with 
 * @param {*} group 
 * @param {*} _marker markerInfo
 * @returns 
 */
    static DoReplaceWith(value, _formatter, replace_with, group, _marker, option) {
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
            // ------------------------
            // consider escape to check
            //
            let cp = new RegExp(m.replace(/\\/g, '\\\\'), 'd');
            let _in = value.replace(value, check).replace(/\\\\/g, /\\0/);
            // passing exec to formatt new value
            let matches = cp.exec(_in);
            const _tokens = option.tokenChains;
            const _caps = _formatter.getMarkerCaptures(_marker);
            if (matches && _caps) {
                g = CaptureRenderer.CreateFromGroup(matches, _tokens);
                let out = g.render(listener, _caps, false, _tokens, option);
                return out;
            }
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
     * @param {string} value value to treat 
     * @param {*} patterns 
     * @param {*} group - parent group match to resolve
     * @param {*} option - options
     * @returns 
     */
    static TreatPatternValue(value, patterns, group, option) {
        const _formatter = option.formatter;
        let _bckCapture = _formatter.info.captureGroup;
        _formatter.info.captureGroup = group;
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
                appendToBufferListener: q.appendToBufferListener
            };
            // clean setting

            q.appendToBufferListener = null;
            q.lineCount = 0;
            q.depth = 0;
            q.line = '';
            q.markerInfo.length = 0;
            q.newBuffer('_subformat_buffer_');
            _formatter.info.isSubFormatting++;
            _formatter.patterns = patterns;

            value = _formatter.format(value);
            _formatter.info.isSubFormatting--;
            _formatter.patterns = _bck.patterns;
            // + | restore setting
            q.lineCount = _bck.lineCount;
            q.line = _bck.line;
            q.pos = _bck.pos;
            q.depth = _bck.depth;
            q.appendToBufferListener = _bck.appendToBufferListener;
            q.restoreBuffer({ state: { formatterBuffer: _bck.formatterBuffer } });
            _bck.markerInfo.forEach(a => q.markerInfo.push(a));
            option.popState();

        } else {
            // passing value to pattern 
            let n_formatter = Formatters.CreateFrom({ patterns: d.patterns });
            value = n_formatter.format(value);
        }
        _formatter.info.captureGroup = _bckCapture;
        return value;
    }

    static TreatCapture(marker, _cap, group, tokenChains, option) {
        const { listener } = option;
        const { CaptureRenderer } = Utils.Classes;
        let _s = null;
        if (Array.isArray(group) == false) {
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