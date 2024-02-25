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
                } else {
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
        const { line, pos, debug , depth } = options;
        let _a = null;
        let _match = 0;
        let _index = -1;
        let l = line.substring(pos);
        const {RefPatterns} = require('./RefPatterns');

        patterns.forEach((s) => {
            let _ts = s;
            if (s instanceof RefPatterns){
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
                console.log("begin", { name: _a.name, line, pos: _match.index , depth});
            }
        }
        return _a;
    }
    static GetRegexFrom(s, p) {

        s = s.replace(/[^\\]?\$([\d]+)/, (a, m) => {
            if (a[0] == "\\") return a;
            if (a[0] != '$')
                return a[0] + p[m];
            return p[m];
        });
        s = s.substring(1).slice(0, -1);
        return new RegExp(s);
    }
}

exports.Utils = Utils;