"use strict";

Object.defineProperty(exports, '__esModule', {value:true});

class FormatterSyntaxException extends Error{
    At;

    constructor(message, {lineCount}){
        super(message);
        this.At = lineCount;
    }
}
exports.FormatterSyntaxException = FormatterSyntaxException;