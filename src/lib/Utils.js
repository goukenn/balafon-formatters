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
    static patternsParser(Patterns){
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
                            _o = new Patterns();
                            JSonParser._LoadData(parser, _o, _def);
                        }
                    }
                } else {
                    _o = new Patterns();
                    JSonParser._LoadData(parser, _o, a);
                }
                if (_o){
                    _out.push(_o);
                }

            });
            return _out;
        }
    }
}
 
exports.Utils = Utils;