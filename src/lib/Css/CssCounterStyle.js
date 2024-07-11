"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

class CssCounterStyle{
    system;
    symbols;
    negative;
    prefix;
    suffix;
    range;
    pad;
    fallback;
    get speakAs(){
        return this['speak-as'];
    }
    set speakAs(v){
        this['speak-as'] = v;
    }
    get additiveSymbols(){
        return this['additive-symbols'];
    }
    set additiveSymbols(v){
        this['additive-symbols'] = v;
    }
}

exports.CssCounterStyle = CssCounterStyle;