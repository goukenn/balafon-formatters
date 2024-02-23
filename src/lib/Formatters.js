Object.defineProperty(exports, '__esModule', {value:true});

const { Utils } = require("./Utils");
const { Patterns } = require("./Patterns");
const { JSonParser } = require("./JSonParser");

/**
 * formatters entry point
 */
class Formatters{
    patterns;
    repository;

    /**
     * validate current field name
     * @param {*} field_name 
     * @param {*} d 
     * @returns bool
     */
    json_validate(field_name, d, throw_on_error){
        const validator = {
            patterns(d){
                return Array.isArray(d);
            },
            repository(d){
                return typeof(d)=='object';
            }
        };
        let f = validator[field_name];
        if (f && !f(d)){
            if (throw_on_error){
                throw new Error(`[${field_name}] is not valid`);
            }
            return false;
        }
        return true;
    }
    json_parse(parser, fieldname, data){
        const patterns = Utils.patternsParser(Patterns);
        const parse = {
            patterns,
            repository(d,parser){
                let _out = {};
                let _o = null;
                for(let i in d){
                    _o = new Patterns();
                    JSonParser._LoadData(parser, _o, d[i]);
                    _out[i] = _o;
                }
                return _out;
            } 
        };
        let fc = parse[fieldname];
        if (fc){
            return fc(data, parser);
        }
        return data;
    }
}


exports.Formatters = Formatters;
exports.Utils = Utils;
exports.Patterns = Patterns;
exports.JSonParser = JSonParser;