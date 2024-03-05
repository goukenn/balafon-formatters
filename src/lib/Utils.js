Object.defineProperty(exports, '__esModule', { value: true });

const { JSonParser } = require("./JSonParser");

class Utils {
    /**
    * define and inject property 
    * @param {string} n namespace
    * @param {undefined|*} v 
    * @param {*} globalname 
    * @returns 
    */
   static FunctionDefineArg(n, v, globalname){
       let c = 0;
       let result = 0;
       let s = '';
       if (globalname){
           s = '((w,p,q,n)=>{n=w; while((p.length>1) && (q = p.shift())){ n[q] = n[q] || {}; n = n[q];} n[p[0]] = v})('+globalname+", \""+n+"\".split('.'), v) || ";
       } 
       n.split('.').forEach((i)=>{
       if (!result){
           result = i+'=((v)=>{ return '+s+'{'
       }else{
           if (c){
               result+="{"
           }
           result+= i+":";
           c++;
       }
   });
   v = typeof(v)=='undefined'? 'undefined': (typeof(v)=='object'? JSON.stringify(v):v) || '"'+n+'"';
   result += v+ '}'.repeat(c)+"})("+v+")";
   
   return result;
   }
    /**
     * define property 
     * @param {string} n 
     * @param {undefined|*} v 
     * @param {object} global object definition 
     * @returns 
     */
    static DefineProp(n, v, window){
        return ((q, v, window)=>{ let r = null; let m = null; let _last = null; let _o = null;
            v = (typeof(v)!="undefined" ? v : n);
            if (q.length==0) return v;
            q.forEach(i=>{
                if (r==null){
                    // first object definition
                    r = m = (window? window[i] : null) || {} ;
                    if (window){
                        window[i] = r;
                    }
                }
                if (_last){
                    _o = m;
                    if ( typeof(m[i]) == 'string'){
                        m[i] = {};
                    }
                    m[i] = m[i] || {};
                    m = m[i]; 
                }
                _last = i; 
            });
            
            if(_o) 
                _o[_last] = v;
            else{
                if (window){
                    window[q[0]] = v;
                }
            }
            return r;
        })(n.split('.'),v, window);
    }

    /**
     * 
     * @param {*} class_name 
     * @param {*} data 
     * @param {*} registry 
     * @returns 
     */
    static JSonParseData(class_name, data, registry) {
        let parser = new JSonParser;
        parser.source = class_name;
        parser.data = data;
        parser.includes = {};
        if (registry){
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
        if (!refkey_class_name || typeof(refkey_class_name)=='undefined'){
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
                        _key = include.substring(1);
                        // if (_key in parser.includes){
                        //     _o = new refkey_class_name(parser.includes[_key]);
                        // }
                        // else 
                        if (refKey && (refKey == _key) && refObj) {
                            _o = new refkey_class_name(q);
                        } else {
                            _def = parser.data.repository[_key];
                            if (_def) {
                                _o = new class_name();
                                parser.includes[_key] = _o; 
                                JSonParser._LoadData(parser, _o, _def, _key, refObj || _o);
                                parser.initialize(_o);
                            }
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

    static GetPatternMatcher(patterns, options) {
        const { line, pos, debug, depth } = options;
        let _a = null;
        let _match = 0;
        let _index = -1;
        let l = line.substring(pos);
        const { RefPatterns } = require('./RefPatterns');

        patterns.forEach((s) => {
            let _ts = s;
            // if (s instanceof RefPatterns) {
            //     _ts = s.pattern;
            // }

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
                console.log('matcher-begin: ', {
                    '__name':_a.toString(),
                    name: _a.name, line, pos:
                        _match.index, depth,
                    hasParent: _a.parent != null,
                    isBlock: _a.isBlock,
                    isRef: _a instanceof RefPatterns,
                    value: _match[0],
                    regex: _a.matchRegex  
                });
            }
            // let _treatCapture = { ..._match};
            _match.offset = _match[0].length;
            options.treatBeginCaptures(_a, _match);
            
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
            let _p = null;
            if ( _p = /^:(?<symbol>=|^|#)(.)(?<number>\d+)/.exec(s)){
                //replacement value with pattern
                let n = parseInt(_p.groups['number']);
                let _s = _p.groups['symbol'];
                if (n > v.length ){
                    let _g = _p[2];
                    if (_s=='#'){
                        v = v.toString().padEnd(n, _g);
                    } else if(_s=='^'){
                        v = v.toString().padStart(n, _g); 
                    }
                    else if(_s=='='){
                        let c = Math.floor((n - v.length) / 2);
                       
                        v = v.toString().padEnd((c % 2)==0? n-c: n-c+1, _g);
                        v = v.toString().padStart(n, _g); 
                    }
                }
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
    static JSonValidate(q, validator, field_name, d, throw_on_error){

        let f = validator ? validator[field_name] : null;
        if (f && !f(d)){
            if (throw_on_error){
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
    static JSonParse(q, parse, parser, fieldname, data, refKey){
        let fc = parse ? parse[fieldname] : null;
        if (fc){
            return fc.apply(q, [data, parser, refKey]);
        }
        return data;
    }
}
exports.Utils = Utils;