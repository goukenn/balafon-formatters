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
     * append value to buffer segment
     * @param {string|{buffer:string, data: string}} v 
     */
    appendToBuffer(v) {
        if (typeof(v)=='string'){
            this.bufferSegments.push(v);
            this.appendToData(v);
        } else {
            const {buffer, data} = v;
            this.bufferSegments.push(buffer);
            this.appendToData(data);
        }
    }
    appendToData(v) {
        this.dataSegments.push(v);
    }
    storeToBuffer(buffer, {lastDefineStates}){
        if (buffer == lastDefineStates.bufferSegment.join('')){
            this.appendToBuffer({buffer, data: lastDefineStates.dataSegment.join('')});
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
    trim(){
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
}

exports.FormatterBuffer = FormatterBuffer;