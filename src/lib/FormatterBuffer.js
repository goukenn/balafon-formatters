"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

/**
 * @import (./IBufferData)
 */

/**
 * class that help to manibule buffer by segment
 * @property {string[]} output 
 * @property {string[]} dataOutput 
 * @property {string[]} bufferSegments 
 * @property {string[]} dataSegments 
 */
class FormatterBuffer {
    static DEBUG = false;
    /**
     * set the formatter buffer identification 
     */
    id;
    constructor() {
        var m_output = [];
        var m_bufferSegments = [];
        var m_dataSegments = [];
        var m_dataOutput = [];

        /*
        arry of buffer segment
         */
        Object.defineProperty(this, 'bufferSegments', { get() { return m_bufferSegments; } });
        Object.defineProperty(this, 'dataSegments', { get() { return m_dataSegments; } });
        Object.defineProperty(this, 'output', { get() { return m_output; } });
        Object.defineProperty(this, 'dataOutput', { get() { return m_dataOutput; } });
        Object.defineProperty(this, 'length', { get() { return m_bufferSegments.length; } });

    }
    get isEmpty() {
        return this.bufferSegments.length == 0;
    }
    /**
     * get the buffer offset content
     * @param {number} offset 
     * @param {string} join 
     * @returns {string}
     */
    getContent(offset, join = '') {
        return this.bufferSegments.slice(offset).join(join || '');
    }
    /**
     * get data segment offset
     * @param {*} offset 
     * @param {*} join 
     * @returns 
     */
    getData(offset, join = '') {
        return this.dataSegments.slice(offset).join(join || '');
    }
    /**
     * get buffer segment
     * @var {string}
     */
    get buffer() {
        return this.bufferSegments.join('');
    }
    /**
     * retrieve data
     * @var {string}
     */
    get data() {
        return this.dataSegments.join('');
    }
    /**
     * join the buffer segments
     * @param {null|string} join 
     * @returns string
     */
    join(join) {

        return this.bufferSegments.join(join || '');
    }
    /**
     * join segment 
     */
    joinSegments(join = '') {
        let ch = null;
        let _bufferS = [];
        let _dataS = [];
        const { bufferSegments, dataSegments } = this;
        if (bufferSegments.marked) {
            const q = bufferSegments.marked;
            q.sort();
            const _OP = q.op;
            let _call = (tab, q, marked) => {
                let c = 0;
                let t = [];
                const _bufferS = [];
                const _marked = [];
                _marked.op = {};
                tab.forEach(a => {
                    if ((q.length > 0) && (q[0] == c)) {
                        if (t.length > 0) {
                            _bufferS.push(t.join(join));
                            t.length = 0;
                        }
                        _bufferS.push(a);
                        q.shift();
                        let _idx = _bufferS.length - 1;
                        if (c in _OP) {
                            _marked.op[_idx] = _OP[c];
                        }
                        _marked.push(_idx);
                    } else {
                        t.push(a);
                    }
                    c++;
                });
                if (t.length > 0) {
                    _bufferS.push(t.join(join));
                    t.length = 0;
                }
                if (marked) {
                    _bufferS.marked = _marked;
                }
                return _bufferS;
            };

            _bufferS = _call(bufferSegments, q.slice(0), true);
            _dataS = _call(dataSegments, q.slice(0));

        } else {
            _bufferS.push(this.join(join));
            _dataS.push(this.dataSegments.join(join));
        }
        return { bufferSegment: _bufferS, dataSegment: _dataS };
    }
    /**
     * append value to buffer segment
     * @param {string|{buffer:string, data: string, marked: boolean}} v 
     */
    appendToBuffer(v) {
        if (typeof (v) == 'string') {
            this.bufferSegments.push(v);
            this.appendToData(v);
        } else {
            const { buffer, data, marked } = v;
            this.bufferSegments.push(buffer);
            this.appendToData(data);
            if (marked) {
                if (!this.bufferSegments.marked) {
                    this.bufferSegments.marked = [];
                    this.bufferSegments.marked.op = {};
                }
                const _idx = this.bufferSegments.length - 1;
                this.bufferSegments.marked.push(_idx);
                if (typeof (marked) == 'object') {
                    this.bufferSegments.marked.op[_idx] = marked;
                }
            }
        }
    }
    appendToData(v) {
        this.dataSegments.push(v);
    }
    storeToBuffer(buffer, { lastDefineStates }) {
        if (lastDefineStates && (buffer == lastDefineStates.bufferSegment.join(''))) {
            this.appendToBuffer({ buffer, data: lastDefineStates.dataSegment.join('') });
        }
        else {
            // just store to buffer 
            this.appendToBuffer(buffer);
        }
    }
    /**
     * clear segments
     */
    clear() {
        this.bufferSegments.length = 0;
        this.dataSegments.length = 0;
    }
    clearOutput() {
        this.output.length = 0;
        this.dataOutput.length = 0;
    }
    clearAll() {
        this.clear();
        this.clearOutput();
    }
    trimEnd() {
        const { bufferSegments, dataSegments } = this;
        let q = null;
        [bufferSegments, dataSegments].forEach(segment => {
            while (segment.length > 0) {
                q = segment.pop();
                q = q.trimEnd();
                if (q.length > 0) {
                    segment.push(q);
                    break;
                }
            }
        });
    }
    trimStart() {
        const { bufferSegments, dataSegments } = this;
        let q = null;
        [bufferSegments, dataSegments].forEach(segment => {
            while (segment.length > 0) {
                q = segment.unshift();
                q = q.trimEnd();
                if (q.length > 0) {
                    segment.push(q);
                    break;
                }
            }
        });
    }
    trim() {
        this.trimStart();
        this.trimEnd();
    }
    /**
     * last segment value
     * @returns {null|string}
     */
    lastSegment() {
        const { bufferSegments } = this;
        if (bufferSegments.length > 0) {
            return bufferSegments[bufferSegments.length - 1];
        }
        return null;
    }
    lastDataSegment() {
        const { dataSegments } = this;
        if (dataSegments.length > 0) {
            return dataSegments[dataSegments.length - 1];
        }
        return null;
    }
    /**
     * replace last segment with new value
     * @param {*} newValue 
     */
    replaceLastSegment(newValue) {
        const { bufferSegments } = this;
        bufferSegments.pop();
        bufferSegments.push(newValue);
    }

    /**
     * 
     * @param {*} bufferData 
     * @param {*|'*'|'trimmed'|(a)=>boolean} op 
     * @returns 
     */
    static TreatMarkedSegments(bufferData, op = '*') {
        const { bufferSegment, dataSegment } = bufferData; 
        const q = bufferSegment.slice(0);
        let _idx = -1;
        switch (op) {
            case '*': {
                // remove all marked segments
                while (bufferSegment.marked.length > 0) {
                    _idx = bufferSegment.marked.shift();
                    delete (q[_idx]);
                    delete (dataSegment[_idx]);
                } 
            }
            break;
            case 'trimmed': 
            const _tlist = bufferSegment.marked.slice(0);
            let _count = 0;
            while (_tlist.length > 0) {
                    _idx = _tlist.shift();
                    let _top = bufferSegment.marked.op[_idx] || null;
                    if (_top && _top.trimmed){
                        //let _ts = q[_idx];
                        delete (q[_idx]);
                        delete (dataSegment[_idx]);
                        delete(bufferSegment.marked.op[_idx]);
                        delete(bufferSegment.marked[_count])
                    }
                    _count++;
                } 
                const _marked = bufferSegment.marked.filter(o=>o);
                bufferSegment.marked.length = 0;
                bufferSegment.marked.push(..._marked);
                break;
            default:
            if (typeof(op) == 'function'){ 
                while (bufferSegment.marked.length > 0) {
                    _idx = bufferSegment.marked.shift();
                    s = q[_idx];
                    if (op(s)){
                        delete (q[_idx]);
                        delete (dataSegment[_idx]);
                    }
                }
            
            }
        }

        let elt = dataSegment.filter(o=>o);
        dataSegment.length = 0;
        dataSegment.push(...elt);
        
        bufferSegment.length = 0;
        elt = q.filter(o => o);
        bufferSegment.push(...elt);
        return bufferData;
    }
}

exports.FormatterBuffer = FormatterBuffer;