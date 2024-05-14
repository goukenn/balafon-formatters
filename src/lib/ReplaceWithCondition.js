"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

 
const { Utils } = require("./Utils");


class ReplaceWithCondition{
    /**
     * expression to check
     * @var {undefined|*}
     */
    expression;
    check;
    operator = '=';
    match;
    captures;

    constructor(){ 
    }

    json_parse(parser, fieldname, data, refKey){
        const _regex_parser = (s)=>{
            return Utils.RegexParse(s); 
        };
        const _capture_parser = Utils.JSONInitCaptureField(this);
        return Utils.JSonParse(this, {
            expression: _regex_parser,
            match: _regex_parser,
            captures : _capture_parser
        }, parser, fieldname, data, refKey);
    }
    json_validate(field_name, d, throw_on_error){
        let string_test = (v)=> typeof(v)=='string';
        return Utils.JSonValidate(this, {
            check:string_test,
            operator:string_test,
            operator:string_test,
        },field_name, d, throw_on_error); 
    }

}

exports.ReplaceWithCondition = ReplaceWithCondition;