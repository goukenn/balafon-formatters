"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

class FormatterEndMissingExpression{
    #expression;

    constructor(expression){
        this.#expression = expression;
    }
    get expression(){
        return this.#expression;
    }
    /**
     * 
     * @param {*} group 
     */
    load(group, transform, engine, value){
        let _e = this.expression;
        let _ret = null;
        let _p = transform(new RegExp(_e), group); 
        let _fc = new Function('engine','value', 'return (()=>'+_p+')();');
        _ret = _fc.apply(null, [engine, value]);
        return _ret;
    }
}
exports.FormatterEndMissingExpression = FormatterEndMissingExpression;