"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

/**
 * formatter line segment
 */
class FormatterLineSegment extends Array {
    constructor(){
        super();
        let m_states = [];

        this.save = ()=>{
            m_states.push(this.slice(0));
            this.clear();
        };
        this.restore=()=>{
            let mps = m_states.pop();
            if (mps){
                this.clear();
                super.push(...mps);
            }
        };
    }
    store(segment, option) {
        if (!option.isCapturing) {
            super.push(segment);
        }
    }
    push(segment, option) {
        if (!option) {
            throw new Error('require option');
        }
        if (!option.isCapturing) {
            super.push(segment);
        }
    }
    unshift(segment, option) {
        if (!option) {
            throw new Error('require option');
        }
        if (!option.isCapturing) {
            super.unshift(segment);
        }
    }
    clear() {
        this.length = 0;
    }
}


exports.FormatterLineSegment = FormatterLineSegment;
