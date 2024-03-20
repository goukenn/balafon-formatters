"use strict";
Object.defineProperty(exports, 'enModule', { value: true });



class FormatterPatternException extends Error{
    constructor(msg, pattern, match, line){
        if (line){
            msg += ' At '+line;
        }
        super(msg);
        Object.defineProperty(this, 'pattern', {get(){return pattern}});
        Object.defineProperty(this, 'match', {get(){return match}});
    }
}


exports.FormatterPatternException = FormatterPatternException;