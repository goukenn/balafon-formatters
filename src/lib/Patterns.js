Object.defineProperty(exports, '__esModule', {value:true});

const { Utils } = require('./Utils');
class Patterns{
    match;
    begin;
    end;
    name;
    comment;
    patterns;
    isBlock;
    /**
     * @var {?bool}
     */
    allowMultiline;

    constructor(){
        this.patterns = [];
        this.isBlock = false;
        this.allowMultiline = true;
    }
    json_parse(parser, fieldname, data){ 
        const patterns = Utils.ArrayParser(Patterns);
        const _regex_parser = (s)=>{
            if (typeof(s)=='string'){
                return new RegExp(s);
            }
            return s;
        };
        const q = this;
        const parse = {
            patterns(n,parser){
                let d = patterns(n,parser);
                d.forEach((s)=>{
                    s.m_parent = q;
                });
                return d;
            }, // update with parent
            begin: _regex_parser,
            end: _regex_parser,
            match: _regex_parser,
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

    get matchType(){
        if (this.begin){
            return 0;
        } else if (this.match){
            return 1;
        }
        return -1;
    }
    check(l){
        let p = null;
        if (this.begin){
            p = this.begin.exec(l);
        } else if (this.match){
            p = this.match.exec(l);
        } else {
            throw new Error("cannot check : "+l);
        }
        return p;
    }
    startMatch(l, p){
        this.m_line = l;
        this.m_match = p;
    }
    get index(){
        return this.m_match?.index;
    }
    get group(){
        return this.m_match;
    } 
  
    get parent(){
        return this.m_parent || null;
    }
    set parent(v){
        this.m_parent = v;
    }
    /**
     * calculate end regex
     * @param {*} p 
     * @returns 
     */
    endRegex(p){
        let s = this.end.toString();
        return Utils.GetRegexFrom(s, p); 
    }
}

exports.Patterns = Patterns;