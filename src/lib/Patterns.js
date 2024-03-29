Object.defineProperty(exports, '__esModule', {value:true});

const { RefPatterns } = require('./RefPatterns');
const { Utils } = require('./Utils');
class Patterns{
    match;
    begin;
    end;
    name;
    comment;
    patterns;
    /**
     * if match append line feed after this instruct
     */
    lineFeed;
     /**
     * @var {?bool}
     */
    isBlock;

     /**
     * @var {?{start: string, end: string}} 
     */
    block;
    /**
     * @var {?bool}
     */
    allowMultiline;
    /**
     * @var {?bool}
     */
    preserveLineFeed;

    constructor(){
        this.patterns = [];
        this.isBlock = false;
        this.allowMultiline = true;
        this.preserveLineFeed = false;
    }
    json_parse(parser, fieldname, data, refKey){ 
        const patterns = Utils.ArrayParser(Patterns, RefPatterns);
        const _regex_parser = (s)=>{
            if (typeof(s)=='string'){
                return new RegExp(s);
            }
            return s;
        };
        const q = this;
        const parse = {
            patterns(n,parser, refKey){
                let d = patterns.apply(q, [n,parser, refKey]);
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
            return fc.apply(q, [data, parser, refKey]);
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
    get blockStart(){
        const t = this.matchType;
        if (!this.isBlock || (t!=0)){
            return '';
        }
        return this.block?.start || this.begin.toString().trim();
    }
    get blockEnd(){
        const t = this.matchType;
        if (!this.isBlock || (t!=0)){
            return '';
        }
        return this.block?.end || this.end.toString().trim();
    }
}

exports.Patterns = Patterns;