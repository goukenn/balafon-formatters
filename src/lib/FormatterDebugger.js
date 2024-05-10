"use strict";

const { FormatterBuffer } = require("./FormatterBuffer");

Object.defineProperty(exports, "__ESModule", { value: true });

class FormatterDebugger {
    constructor(all) {
        const q = this;
        this.feature = (name) => {
            if (all) {
                return true;
            }
            if (name in q) {
                return q[name];
            }
            return false;
        }
    }
    static DebugAll() {
        return DEBUG_ALL;
    }
    static Load(data) {
        let c = new FormatterDebugger;
        let top_keys = {};
        Object.keys(data).forEach((i) => {
            let r = data[i];
            let tp = ((i)=>{i = i.split('.'); i.pop(); return i.join('.'); })(i);
            if (tp.length>0){
                top_keys[tp] = 1;
            }

            Object.defineProperty(c, i, {
                get: function () {
                    if (typeof (r) == "function") {
                        return r();
                    }
                    return r;
                }
            });
        });
        for(let i in top_keys){
            if (i in c )
                continue;
            Object.defineProperty(c, i, { value: true}); 
        }
        return c;
    }

}

const DEBUG_ALL = new FormatterDebugger(true);


exports.FormatterDebugger = FormatterDebugger;