"use strict";

Object.defineProperty(exports, '__esModule', { value: true });
const globalRegExp = RegExp;
const NATIVE_EXEC = (() => {
    const _fn = globalRegExp.prototype.exec;
    if (_fn == 'function exec() { [native code] }')
        return _fn;
    throw new Error('missing native Regex.exec');
})();
const NATIVE_TEST = (() => {
    const _fn = globalRegExp.prototype.test;
    if (_fn == 'function test() { [native code] }')
        return _fn;
    throw new Error('missing native Regex.test');
})();
/**
 * implement native RegExp because some extension override required function
 */
class NativeRegExp {
    static #sm_states = [];
    static Save() {
        NativeRegExp.#sm_states.unshift({
            exec: globalRegExp.prototype.exec,
            test: globalRegExp.prototype.test
        });
        globalRegExp.prototype.exec = NATIVE_EXEC;
        globalRegExp.prototype.test = NATIVE_TEST;
    }
    static Restore(){
        const _g = NativeRegExp.#sm_states.shift();
        if (_g){
            globalRegExp.prototype.exec = _g.exec;
            globalRegExp.prototype.test = _g.test;
        }
    }
}

NativeRegExp.prototype.exec = NATIVE_EXEC;
NativeRegExp.prototype.test = NATIVE_TEST;

exports.NativeRegExp = NativeRegExp;