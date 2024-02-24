Object.defineProperty(exports, '__esModule', {value:true});
  
const { JSonParser } = require("./JSonParser");
class Utils{ 
    static JSonParseData(class_name, data){
        let parser = new JSonParser;
        parser.source = class_name;
        parser.data = data;
        return Utils.LoadData(parser, new class_name(), data); //.parse();
    }
    static LoadData(parser, obj, data){
        return JSonParser._LoadData(parser, obj, data); 
    }
    /**
     * array parser callback
     * @param {*} class_name 
     * @returns 
     */
    static ArrayParser(class_name){
        return (d, parser)=>{
            let _out = [];
            d.forEach((a)=>{
                const { include }= a;
                let _o = null;
                if (include){
                    if (include[0]=='#'){
                        let _key = include.substring(1);
                        let _def = parser.data.repository[_key];
                        if (_def){ 
                            _o = new class_name();
                            JSonParser._LoadData(parser, _o, _def);
                        }
                    }
                } else {
                    _o = new class_name();
                    JSonParser._LoadData(parser, _o, a);
                }
                if (_o){
                    _out.push(_o);
                }

            });
            return _out;
        }
    }

    static GetPatternMatcher(patterns, options){
        const { line, pos } = options;
        let _a = null;
        let _match = 0;
        let _index = -1;
        let l = line.substring(pos);

        patterns.forEach((s)=>{
            let p = s.check(l);
            if (p && ((_index==-1)|| (_index>p.index))){
                _index = p.index;
                _a = s;
                _match = p;
            }
        });
        if (_a){
            _a.startMatch(l, _match);
            console.log("match....", l);
        }
        return _a;
    }
    static GetRegexFrom(s, p){

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