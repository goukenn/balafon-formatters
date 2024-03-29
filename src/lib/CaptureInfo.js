"use strict";
Object.defineProperty(exports, '__esModule', {value:true});
const { Utils } = require("./Utils");
class CaptureInfo{
    /**
     * string name of the capture info used in token
     * @var {?string}
     */
    name;

    /**
     * id used to setup rendering definition
     */
    tokenID;
    /**
     * extra patterns definition 
     * @var {null|[{include:string}|{extends: string}|Pattern]}
     */
    patterns;

    /**
     * transformation to apply to this element before send it to patterns list in case this patterns is set
     * @var {null|string|string[]|(v:string):string}
     */
    transform;
    /**
     * description of this 
     */
    comment;
    /**
     * replace with 
     */
    replaceWith;

    /**
     * transformat option 
     * @var {bool}
     */
    nextTrimWhiteSpace;

    /**
     * list of capture info 
     */
    captures;

    /**
     * format object 
     * @var {*} 
     */
    format;

    constructor(parent){ 

        Object.defineProperty(this, 'parent', {get(){return parent;}})
    }

    json_parse(parser, fieldname, data, refKey, refObj){
        const q = this;
        const { Patterns, RefPatterns } = Utils.Classes;
        const patterns = Utils.ArrayPatternsFromParser(parser, Patterns, RefPatterns);
        const transform = Utils.TransformPropertyCallback();
        const _regex_parser = (s)=>{
            return Utils.RegexParse(s, 'd'); 
        };
        const captures = Utils.JSONInitCaptureField(q);
        const parse = {
            patterns(n,parser, refKey, refObj){
                let d = patterns.apply(q, [n,parser, refKey, refObj]);
                d.forEach((s)=>{
                    // attach the pattern to the capture parent 
                    s.parent = q.parent;
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
            transform,
            captures
        };
        let fc = parse[fieldname];
        if (fc){
            return fc.apply(q, [data, parser, refKey, refObj]);
        }
        return data;
    }
}

exports.CaptureInfo = CaptureInfo;