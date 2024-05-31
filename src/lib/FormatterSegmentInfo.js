"use strict";
Object.defineProperty(exports, '__esModule', {value:true});


/**
 * formatter buffer setting
 */
class FormatterSegmentInfo{
    #m_buffer;
    #m_op;

    constructor(buffer, op){
        this.#m_buffer = buffer;
        this.#m_op = op;
    }
    toString(){
        return this.#m_buffer;
    }
    get buffer(){
        return this.#m_buffer;
    }
    get isMarked(){
        return this.#m_op != null;
    }
    get info(){
        if (this.isMarked){
            return this.#m_op;
        }
        return null;
    }
}


exports.FormatterSegmentInfo = FormatterSegmentInfo;