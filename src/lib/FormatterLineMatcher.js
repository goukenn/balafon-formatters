"use strict";
Object.defineProperty(exports, '__ESModule', { value: true });

const { RegexUtils } = require('./RegexUtils')
/**
 * use to operate on line matching 
 */
class FormatterLineMatcher {
    /**
     * start line flag
     * @var {?boolean} 
     */
    #m_startLine;

    /**
     * flag: middel pos when ending - must consider hown element
     */
    #m_middelPos;
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
     * get the start line flag
     */
    get startLine(){
        return this.#m_startLine;
    }
    /**
     * set the start line flag
     */
    set startLine(v){
        this.#m_startLine = v;
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
    set offset(v){
        this.#m_offset = v;
    }
    /**
     * chang the position
     */
    set position(v) {
        if (v != this.#m_nextPosition) {
            if (v < this.#m_nextPosition) {
                throw new Error('next position not allowed '+v+' vs '+this.#m_nextPosition)
            }
            this.#m_offset = this.#m_nextPosition;
            this.#m_nextPosition = v;
        }
    }
    reset(){
        this.#m_offset = 0;
        this.#m_nextPosition = 0;
    }
    /**
     * and and return regex result
     * @param {*} regex 
     * @returns {null|IRegexResult} regex result
     */
    check(regex){
        const _has_movement = RegexUtils.HasBackyardMovementCapture(regex);
        const _has_startLine = RegexUtils.CheckRequestStartLine(regex);
        const { subLine, nextLine, sourceLine, position, startLine, offset } = this;
        let _p = null;
        if (_has_startLine && startLine && (position == 0)) {
            _p = regex.exec(sourceLine);
            if (_p) {
                _p.move = false;
                return _p;
            }
        }
        if (_has_movement) {
            _p = regex.exec(subLine);
            if (_p) {
                _p.move = true;
                _p.index += offset;
                let _idx = _p.index;
                let cp = null;
                let _mark = false;
                while (_idx < position) {
                    _mark = true;
                    _idx++;
                    let new_s = sourceLine.substring(_idx);
                    cp = regex.exec(new_s);
                    if (cp) {
                        _idx += cp.index;
                        cp.index = _idx;
                        cp.input = sourceLine;
                        cp.move = true;
                    } else {
                        break;
                    }
                }
                if (_mark) {
                    if (!cp) {
                        _p = null;
                    } else {
                        _p = cp;
                    }
                }
                if (_p) {
                    _p.index += -position;
                }
            }  
        } else if (!_p) {
            _p = regex.exec(nextLine);
        }
        if (_p) {
            _p.index += position;
            _p.input = sourceLine;
            if (_p.index < position) {
                _p = null;
            }
        } 
        return _p;
    }
}

exports.FormatterLineMatcher = FormatterLineMatcher;