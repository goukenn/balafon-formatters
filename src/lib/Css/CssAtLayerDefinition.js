"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

/** 
 */
class CssAtLayerDefinition {
  list;
  styles;  
  constructor() {
    this.list = [];
    this.styles = {}; 
  }
  toJSON() {
    let l = {};
    if (this.list.length > 0) {
      l['list'] = this.list;
    }
    if (Object.keys(this.styles).length > 0) {
      l['styles'] = this.styles;
    }
    
    return l;
  }
}
exports.CssAtLayerDefinition = CssAtLayerDefinition;