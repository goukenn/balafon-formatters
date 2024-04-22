"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

const { JSonParser } = require('./JSonParser'); 
const { ReplaceWithCondition } = require('./ReplaceWithCondition');
const { Utils } = require('./Utils');
const { RegexUtils } = require('./RegexUtils');
const { BlockInfo } = require('./BlockInfo');
const { PatterMatchErrorInfo } = require('./PatterMatchErrorInfo');
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
     * use for begin/while . to implement
     * @var {string|Regex}
     */
    while;

    /**
     * while captures definitions
     */
    whileCaptures;
    /**
     * setup the value on end missing
     */
    endMissingValue;
    /**
     * the name of this pattern
     */
    name;

    /**
     * capture set content name
     */
    contentName;
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
     * @var {?bool|BlockInfo}
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
     * mark this match as instruction separator. by default will be use as lineFeed. by default the contains will be checked
     * in match only alogrithm
     */
    isInstructionSeparator;

    //  /**
    //  * @var {?{start: string, end: string}} 
    //  */
    // block;
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
    replaceWithCondition;

    /**
     * apply transform on start line
     * @var {null|string|string[]}
     */
    startLineTransform;

    /**
     * 
     */
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
     * list of tranform operation
     * @var {string|string[]}
     */
    transform;

    /**
     * formatting mode
     */
    formattingMode = 0;

    /**
     * a glue value - to merge on 
     */
    isGlueValue;

    /**
     * throw error on matching
     * @var {null|bool|string|PatterMatchErrorInfo}
     */
    throwError;

    /**
     * stream action type.
     * value use only on streaming default is 'next'
     * @var {?string|'parent'|'next'}
     */
    streamAction;

    /**
     * captures to attach on stream or use captures as a fallback
     */
    streamCaptures;


    /**
     * indicate that this pattern must be only apply on start line
     * @var {boolean}
     */
    startLine=false;

    /**
     * @var {number}
     */
    applyEndPatternLast;
   
    /**
     * @var {boolean} debug this field
     */
    debug;

    /**
     * force close parent with litteral
     * @var {null|undefined|true|string} close parent with litteral
     */
    closeParent;

    constructor(){
        this.patterns = [];
        this.isBlock = false;
        this.allowMultiline = true;
        this.preserveLineFeed = false;
        var m_parent = null;
        var m_startOnly = false;

        Object.defineProperty(this, 'parent', {get(){return m_parent;}, set(v){
            if ((v==null)||(v instanceof Patterns) )
                m_parent = v;
            else 
                throw Error('parent value not valid');
        }});
        Object.defineProperty(this, 'isStartOnly', {get(){
            return m_startOnly;
        }, set(v){
            m_startOnly= v;
        }});
    }
    json_parse(parser, fieldname, data, refKey, refObj){ 
        const { Patterns, RefPatterns, CaptureInfo } = Utils.Classes;
        const q = this;
        const patterns = Utils.ArrayPatternsFromParser(parser, Patterns, RefPatterns);
        const transform = Utils.TransformPropertyCallback();
        const _regex_parser = (s)=>{
            if (s=='(??)'){
                q.isStartOnly = true;
                s = '';
            }
            return Utils.RegexParse(s, 'd'); 
        };
        const _capture_parser = Utils.JSONInitCaptureField(q); 
       
        const parse = {
            closeParent(n,parser){
                const _type = typeof(n);
                const { FormatterCloseParentInfo } = Utils.Classes;
                const _gcl = parser.closeParentInfoClassName || FormatterCloseParentInfo;
                if (_type=='object'){

                    let m = new _gcl; 
                    JSonParser._LoadData(parser, m, n);
                    return m;
                }
                if (_type=='boolean'){
                    return n;
                }
                if (_type=='string'){
                    return n;
                }
                throw new Error('invalid closeParentType');
            },
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
            streamCaptures: _capture_parser,
           transform,
           lineFeed(d, parser){
                return typeof(d)=='boolean' ? d : false; 
           },
           isBlock(d, parser){
                let _t = typeof(d);
                if (_t=='object'){
                    let m = new BlockInfo;
                    JSonParser._LoadData(parser, m, d);
                    return m;
                }
                return _t=='boolean' ? d : false;
           },
           throwError(d,parser){
                if (typeof(d)=="string"){
                    let l = new PatterMatchErrorInfo;
                    l.message = d;
                    return l;
                }
                return objOrBool(d, parser, PatterMatchErrorInfo); 
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
    /**
     * get if end is capture only regex
     */
    get isEndCaptureOnly(){
        let s = this.end;
        if (s){
            return RegexUtils.IsCapturedOnlyRegex(s.toString());
        }
        return false;
    }
    /**
     * get if begin capture only
     */
    get isBeginCaptureOnly(){
        let s = this.begin;
        if (s){
            return RegexUtils.IsCapturedOnlyRegex(s);
        }
        return false;
    }
    /**
     * get if block is capture only
     * @return {boolean}
     */
    get isCaptureOnly(){
        let { begin, end } = this;
        if (begin && end){
            return this.isBeginCaptureOnly && this.isEndCaptureOnly;
        }
        return false;
    }
    /**
     * is match capture only
     */
    get isMatchCaptureOnly(){
        let s = this.match;
        if (s){
            return RegexUtils.IsCapturedOnlyRegex(s);
        }
        return !1;
    }
    /**
     * new line continue state
     */
    get newLineContinueState(){
        return true;
    }
    static Init(_o){
        if ((_o.matchType == -1) && (_o.patterns?.length>0)){
            _o.patterns.forEach(s=>{
                _o._initRef(s);
            });
        }
    }
    /**
     * initialize reference
     * @param {*} a 
     */
    _initRef(a){
        if (!a.tokenID && this.tokenID){
            a.tokenID = this.tokenID;
        }
    }
    check(l, option, parentMatcherInfo){
        let p = null;
        const { begin, match , patterns} = this;
        if (begin){
            p = begin.exec(l);
        } else if (match){
            p = match.exec(l);
        } else {
            // + | use for pattern only definition list
            if (patterns){
                const cp = Utils.GetMatchInfo(patterns, l, option, parentMatcherInfo); 
                if (cp){
                    return {p: cp._match, s:cp._a, from:this, patterns: patterns, index: cp.index};
                }
                return false;
            }
            throw new Error("cannot check : "+l);
        }
        return {p,s:this, index:-1};
    }
    
    get matchRegex(){
        return this.matchType == 0? this.begin : this.match;
    }  
    /**
     * calculate end regex
     * @param {*} p 
     * @returns 
     */
    endRegex(p){
        if (this.matchType==0){ 
            let s = this.end.toString();
            let idx = s.lastIndexOf('/');
            let flag = '';
            if (idx<(s.length-1)){
                //remove options
                flag = s.substring(idx+1);
                s = s.substring(0, idx+1);
            }
            return Utils.GetRegexFrom(s, p, flag, 'end'); 
        }
        return null;
    }
    endWhile(p){
        if (this.matchType==2){ 
            let s = this.while.toString();
            let idx = s.lastIndexOf('/');
            let flag = '';
            if (idx<(s.length-1)){
                //remove options
                flag = s.substring(idx+1);
                s = s.substring(0, idx+1);
            }
            return Utils.GetRegexFrom(s, p, flag, 'while'); 
        }
        return null;
    }
    // get blockStart(){
    //     const t = this.matchType;
    //     if (!this.isBlock || (t!=0)){
    //         return '';
    //     }
    //     return this.block?.start || this.begin.toString().trim();
    // }
    // get blockEnd(){
    //     const t = this.matchType;
    //     if (!this.isBlock || (t!=0)){
    //         return '';
    //     }
    //     return this.block?.end || this.end.toString().trim();
    // }
    toString(){
        let { name, begin, end, match } = this;
        if (!name){
            name = JSON.stringify({type:this.matchType, match, 
                begin, end});
        }
        return `Patterns[#${name}]`;
    }
}


const objOrBool = (d, parser, class_type)=>{
    let _t = typeof(d);
    if (_t=='object'){
        let m = new class_type;
        JSonParser._LoadData(parser, m, d);
        return m;
    }
    return _t=='boolean' ? d : false;
}

 
exports.Patterns = Patterns;