Object.defineProperty(exports, '__esModule', { value: true });

const { JSonParser } = require("./JSonParser");

class Utils {
    static JSonParseData(class_name, data) {
        let parser = new JSonParser;
        parser.source = class_name;
        parser.data = data;
        return Utils.LoadData(parser, new class_name(), data); //.parse();
    }
    static LoadData(parser, obj, data) {
        return JSonParser._LoadData(parser, obj, data);
    }
    /**
     * array parser callback
     * @param {*} class_name 
     * @returns 
     */
    static ArrayParser(class_name, refkey_class_name) {
        return function (d, parser, refKey) {
            let _out = [];
            let q = this;
            d.forEach((a) => {
                const { include } = a;
                const _extends = a.extends;
                let _o = null, _key = null, _def = null;
                if (include) {
                    if (include[0] == '#') {
                        _key = include.substring(1);
                        if (refKey && (refKey == _key)) {
                            _o = new refkey_class_name(q);
                        } else {
                            _def = parser.data.repository[_key];
                            if (_def) {
                                _o = new class_name();
                                JSonParser._LoadData(parser, _o, _def, _key);
                            }
                        }
                    }
                }
                else if (_extends) {
                    throw new Error("extends not support yet");
                }
                else {
                    _o = new class_name();
                    JSonParser._LoadData(parser, _o, a);
                }
                if (_o) {
                    _out.push(_o);
                }

            });
            return _out;
        }
    }

    static GetPatternMatcher(patterns, options) {
        const { line, pos, debug, depth } = options;
        let _a = null;
        let _match = 0;
        let _index = -1;
        let l = line.substring(pos);
        const { RefPatterns } = require('./RefPatterns');

        patterns.forEach((s) => {
            let _ts = s;
            if (s instanceof RefPatterns) {
                _ts = s.pattern;
            }

            let p = _ts.check(l);
            if (p && ((_index == -1) || (_index > p.index))) {
                _index = p.index;
                _a = s;
                _match = p;
            }
        });
        if (_a) {
            _match.index += pos;
            _a.startMatch(line, _match);
            if (debug) {
                console.log('matcher: ', {
                    name: _a.name, line, pos:
                        _match.index, depth,
                    hasParent: _a.parent != null,
                    isBlock: _a.isBlock
                });
            }
        }
        return _a;
    }
    /**
     * get regex from
     * @param {string} s regext expression
     * @param {*} p group
     * @returns 
     */
    static GetRegexFrom(s, p) {

        s = s.replace(/[^\\]?\$([\d]+)/, (a, m) => {
            if (a[0] == "\\") return a;
            if (a[0] != '$')
                return a[0] + p[m];
            return p[m];
        });
        s = /^\/.+\/$/.test(s) ? s.substring(1).slice(0, -1) : s;
        return new RegExp(s);
    }


    static ReplaceRegexGroup(s, group) {
        let gp = Utils.GetRegexFrom(s, group);
        gp = gp.toString().substring(1).slice(0, -1).replace(/\\\//g, "/");
        s = s.replace(s, gp);
        return s;
    }

    /**
     * 
     * @param {string} s regex string expression
     */
    static RegexInfo(s) {
        let _option = /^\(\?(?<active>[ixm]+)(-(?<disable>[ixm]+))?\)/;
        let option = '';
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

    static RegexParse(s) {
        if (typeof (s) == 'string') {
            let _info = Utils.RegexInfo(s);
            return new RegExp(_info.s, _info.option);
        } else if (typeof (s) == 'object') {
            if (s instanceof RegExp)
                return s;
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
            joinSpace(s){ 
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
                return v.trimStart();
            }
            , /**
            * 
            * @param {string} v 
            * @returns 
            */
            ltrim(v) {
                return v.trimEnd();
            }
        };
        transform.forEach((s) => {
            if (v.length==0){
                return;
            }
            v = typeof (s) == 'function' ? s(v) : _func[s](v);
        });
        return v;
    }
}
exports.Utils = Utils;