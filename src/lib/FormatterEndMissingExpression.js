"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

class FormatterEndMissingExpression{
    #expression;
    #captures;

    constructor(expression,captures){
        this.#expression = expression;
        this.#captures = captures;
    }
    get expression(){
        return this.#expression;
    }
    get captures(){
        return this.#captures;
    }
    /**
     * 
     * @param {*} group 
     */
    load(group, transform, engine, value, marker, option, captures){
        let _e = this.expression;
        let _ret = null;
        let _p = transform(new RegExp(_e), group); 
        let _captures = captures ||  this.captures;
        let _args = [engine, value, marker, option, _captures];
        let _cp = (new Function('engine', "return "+_p)).apply(null, _args);
        if (Array.isArray(_cp)){
            _p = _cp.shift();
            _args.shift();
            _args.unshift(..._cp);
            _args.unshift(engine);
            _ret = _p.call(..._args);
            
        }else{
            _args = [engine, value, marker, option, captures];
            let _fc = new Function('engine','value', 'marker', 'option', 'return (()=>'+_p+')();');
            _ret = _fc.call(null, _args);
        }
        return _ret;
    }
}
exports.FormatterEndMissingExpression = FormatterEndMissingExpression;