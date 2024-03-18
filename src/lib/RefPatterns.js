Object.defineProperty(exports, '__esModule', {value:true});

const { Patterns } = require("./Patterns");

class RefPatterns extends Patterns {
    
    /**
     * reference pattern
     * @param {Patterns} pattern 
     */
    constructor(pattern){
        super();
        if (!pattern || !(pattern instanceof Patterns)){
            throw new Error('pattern not a Pattern instance');
        }
        // + | init property ref keys 
        (function(q, pattern){
            const _keys = Object.keys(q);
            _keys.forEach(i => {
                // let t = typeof (q[i]);
                // if (/function|object/.test(t))
                //     return;
                let _i = Object.getOwnPropertyDescriptor(q, i);
                if (!_i || (_i.get) || _i.writable) {
                    // q[i] = pattern[i];
                    Object.defineProperty(q, i, {get(){ return pattern[i]; }})
                } 
            });
        })(this, pattern);
 
        Object.defineProperty(this, 'pattern', { get(){return pattern; }}); 
    }
    check(l, option, parentMatcherInfo){
        return this.pattern.check(l, option, parentMatcherInfo);
    } 
    toString(){
        return `RefPatterns[#${this.pattern.name}]`;
    }   
    endRegex(p){
        return this.pattern.endRegex(p);
    } 
}
exports.RefPatterns = RefPatterns;