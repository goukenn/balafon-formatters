"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

/** 
 */
class CssAtRuleProperty {
  syntax;
  inherits;
  get initialValue(){
    return this['initial-value'];
  }
  set initialValue(v){
    this['initial-value'] = v;
  }
  toJSON(){
    let l = {...this};
    l.inherits= typeof(l.inherits)=='boolean' ? l.inherits : l.inherits=='true';
    return l;
  }
}
exports.CssAtRuleProperty = CssAtRuleProperty;