"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const { engines }  = require("../lib/EndMissingEngine/engines")
const { bhtml } = engines;
const ENGINES = {
    'source.bhtml': bhtml
}
const REF = {};
class FormatterEndMissingEngine{
    static Get(scopeName){
        if (!(scopeName in REF)){
            const  d  = ENGINES[scopeName]
            REF[scopeName] = new d();
        }
        return REF[scopeName];
    }
}

exports.FormatterEndMissingEngine = FormatterEndMissingEngine;