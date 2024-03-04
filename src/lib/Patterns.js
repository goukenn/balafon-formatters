Object.defineProperty(exports, '__esModule', {value:true});

const { JSonParser } = require('./JSonParser'); 
const { ReplaceWithCondition } = require('./ReplaceWithCondition');
const { Utils } = require('./Utils');
class Patterns{
    /**
     * 
     */
    match;
    /**
     * start capture 
     */
    begin;
    /**
     * end match
     */
    end;
    /**
     * the name of this pattern
     */
    name;
    /**
     * describe this pattern
     */
    comment;
      /**
     * @var {?string} use for token matching
     */
    tokenID;
    /**
     * @var {?array} list of patterns
     */
    patterns;
    /**
     * indicate that this must be used as lineFeed
     * @var {?bool}
     */
    lineFeed;
     /**
      * indicate that this must be consider as a block element
     * @var {?bool}
     */
    isBlock;

    /**
     * get or set condition expression to set if this element is a bloc.
     * @var {?string}
     */
    emptyBlockCondition;

    /**
     * get or set condition expression to evaluate if this element change the parent block property.
     * @var {?string}
     */
    requestParentBlockCondition;

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

    /**
     * depend on token force trim end white space for buffer
     */
    nextTrimWhiteSpace = false;

    /**
     * similar likje end expression will replace the match apend value before adding it to buffer
     */
    replaceWith;

    /**
     * replace with condition object 
     * @var {} 
     */
    replaceWithCondition

    beginCaptures;

    /**
     * used for end captures
     */
    endCaptures;

    /**
     * apply to both begin and end captures definition
     */
    captures;

    /**
     * get updated parent props, {isBlock:?bool, lineFeed:?bool}
     */
    updateParentProps;


    /**
     * use to mark section as a buffer transform - according to parent 
     * passing the transformed data to parent end 
     */
    transformToken;

    /**
     * list of tranform operation
     * @var {string|string[]}
     */
    transform;

    constructor(){
        this.patterns = [];
        this.isBlock = false;
        this.allowMultiline = true;
        this.preserveLineFeed = false;
        var m_parent = null;

        Object.defineProperty(this, 'parent', {get(){return m_parent;}, set(v){m_parent = v;}});
    }
    json_parse(parser, fieldname, data, refKey, refObj){ 
        const { Patterns, RefPatterns } = Utils.Classes;

        const patterns = Utils.ArrayParser(Patterns, RefPatterns);
        const _regex_parser = (s)=>{
            return Utils.RegexParse(s); 
        };
        const _capture_parser = (s, parser)=>{

            let d = {}; 
            for(let i in s){
                let m = new Patterns; 
                JSonParser._LoadData(parser, m, s[i]);  
                d[i] = m; 
                parser.initialize(m); 
            } 
            return d;

        }
        const q = this;

        const parse = {
            patterns(n,parser, refKey, refObj){
                let d = patterns.apply(q, [n,parser, refKey, refObj]);
                d.forEach((s)=>{
                    s.parent = q;
                });
                return d;
            }, // update with parent
            begin: _regex_parser,
            end: _regex_parser,
            match: _regex_parser,
            replaceWith: _regex_parser,
            replaceWithCondition(n , parser, ){
                let m = new ReplaceWithCondition; 
                JSonParser._LoadData(parser, m, n, refObj);  
                return m;
            },
            beginCaptures :_capture_parser,
            endCaptures :_capture_parser,
            captures :_capture_parser,
            transform(n,parser){
                if (typeof(n)=='string'){
                    let t = []
                    n.split(',').forEach((i)=>{
                        i.trim();
                        if (i.length>0)
                            t.push(i);
                    });
                    return t;
                }
                if (Array.isArray(n)){
                    return n;
                }
            }
        };
        let fc = parse[fieldname];
        if (fc){
            return fc.apply(q, [data, parser, refKey, refObj]);
        }
        return data;
    }
    json_validate(field_name, d, throw_on_error){
        const validator = {
            patterns(d){
                return Array.isArray(d);
            },
            replaceWithCondition(d){
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
    get matchRegex(){
        return this.matchType == 0? this.begin : this.match;
    }
    get index(){
        return this.m_match?.index;
    }
    get group(){
        return this.m_match;
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
    toString(){
        return `Patterns[#${this.name}]`;
    }
}


 
exports.Patterns = Patterns;