"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

/** 
 */
class CssStyle {
   /**
    * append style definition
    * @param {*} css 
    * @param {*} def 
    */
   static AppendDef(css, def){
    for(let i in def){
        css[i] = def[i];
    }
   }
}
exports.CssStyle = CssStyle;