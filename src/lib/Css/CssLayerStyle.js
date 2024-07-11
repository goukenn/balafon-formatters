"use strict";
Object.defineProperty(exports, '__esModule', { value: true });
const { CssStyle } = require("./CssStyle")
/** 
 */
class CssLayerStyle extends CssStyle{
    get childs(){
        const _key = '@childs'; 
        if (!(_key in this)){
            this[_key] = {};
        }
        return this[_key];
    }
}
exports.CssLayerStyle = CssLayerStyle;