"use strict";
Object.defineProperty(exports, '__ESModule', { value: true });


/**
 * use to operate on line matching 
 */
class FormatterLineMatcher {
    /**
     * source line
     * @type {?string}
     */
    #m_soureLine;
    /**
     * current line
     * @type {?string}
     */
    #m_line;
    /**
     * current offset 
    * @type {?number}
     */
    #m_offset;
    /**
     * expected next position
     * @type {?number}
     */
    #m_nextPosition;
    /**
     * 
     */
    constructor() {
        const MATCHER_STATES = [];

        this.save = function (new_value) {
            const { sourceLine, line, offset, position } = this;
            MATCHER_STATES.push({ sourceLine, line, offset, position });
            if (typeof(new_value)=='string') {
                this.sourceLine = new_value;
            }
        }
        this.restore = () => {
            const def = MATCHER_STATES.pop();
            if (def) {
                const { sourceLine, line, offset, position } = def;
                this.sourceLine = sourceLine;
                this.#m_line = line;
                this.#m_offset = offset;
                this.#m_nextPosition = position;
            }
        }
    }


    /**
     * define source line
     * @param {?string} v 
     */
    set sourceLine(v) {
        if (v == undefined) throw new Error('value not allowed');
        this.#m_soureLine = v;
        this.#m_offset = 0;
        this.#m_nextPosition = 0;
    }
    get sourceLine() {
        return this.#m_soureLine;
    }
    get line() {
        return this.#m_line;
    }
    set line(v) {
        this.#m_line = v;
    }
    get subLine() {
        return this.#m_soureLine.substring(this.#m_offset);
    }
    get nextLine() {
        return this.#m_soureLine.substring(this.#m_nextPosition);
    } 
    /**
     * get current offset
     */
    get offset() {
        return this.#m_offset;
    }
    get position() {
        return this.#m_nextPosition;
    }
    set position(v) {
        if (v != this.#m_nextPosition) {
            if (v < this.#m_nextPosition) {
                throw new Error('next position not allowed')
            }
            this.#m_offset = this.#m_nextPosition;
            this.#m_nextPosition = v;
        }
    }
    reset(){
        this.#m_offset = 0;
        this.#m_nextPosition = 0;
    }
}

exports.FormatterLineMatcher = FormatterLineMatcher;