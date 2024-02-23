Object.defineProperty(exports, '__esModule', {value:true});

const { Utils } = require('./Utils');
class Patterns{
    match;
    begin;
    end;
    name;
    comment;
    isBlock;
    patterns;

    constructor(){
        this.patterns = [];
        this.isBlock = false;
    }
    json_parse(parser, fieldname, data){ 
        const patterns = Utils.patternsParser(Patterns);
        const parse = {
            patterns
        };
        let fc = parse[fieldname];
        if (fc){
            return fc(data, parser);
        }
        return data;
    }
    json_validate(field_name, d, throw_on_error){
        const validator = {
            patterns(d){
                return Array.isArray(d);
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
}

exports.Patterns = Patterns;