"use strict";



Object.defineProperty(exports, '__esModule', { value: true });

let Joiner = null;
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
        
        m_bufferSegments.marked = FormatterBuffer.InitMarkedSegment();
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
     * prepend value on segments
     * @param {string|{buffer:string, data:string}} value 
     */
    prepend(value){
        let buffer = null;
        let data = null;
        if (typeof(value)=='object'){
            ({buffer, data}= value);
            if (!buffer || !data){
                throw new Error('invalid data');
            }
        } else {
            if (typeof(value)=='string'){
            buffer = data = value;
            }
            else 
                throw new Error('not a string data'); 
        } 
        this.bufferSegments.unshift(buffer);
        this.dataSegments.unshift(data); 
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
        const { bufferSegments, dataSegments } = this;
        return FormatterBuffer.JoinSegments(bufferSegments, dataSegments); 
     }
    /**
     * copy join segment
     * @param {*} bufferSegments 
     * @param {*} dataSegments 
     * @param {string} join 
     * @returns 
     */
    static JoinSegments(bufferSegments, dataSegments, join = '') {
        let ch = null;
        let _bufferS = [];
        let _dataS = [];
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
                            // + | update marker optionration  
                            Utils.UpdateSegmentMarkerOperation(_marked, _idx, _OP[c]);
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
            _bufferS.push(bufferSegments.join(join));
            _dataS.push(dataSegments.join(join));
        }
        return { bufferSegment: _bufferS, dataSegment: _dataS };
    }
    /**
     * init marked segment
     * @returns 
     */
    static InitMarkedSegment(){
        const _g = []; 
        _g.op = {}; 
        return _g;
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
            const { buffer, data, marked, dataSegments, bufferSegments } = v;
            if (dataSegments && bufferSegments) {
                this._joinWith({ bufferSegment: bufferSegments, dataSegment: dataSegments });
            }
            else //if (buffer && data)
                {
                this.bufferSegments.push(buffer);
                this.appendToData(data);
                if (marked) {
                    if (!('marked' in this.bufferSegments)) {
                        this.bufferSegments.marked = FormatterBuffer.InitMarkedSegment();
                    }
                    const _idx = this.bufferSegments.length - 1;
                    this.bufferSegments.marked.push(_idx);
                    if (typeof (marked) == 'object') {
                        if (!('op' in this.bufferSegments.marked)){
                            this.bufferSegments.marked.op = [];
                        }
                        Utils.UpdateSegmentMarkerOperation( this.bufferSegments.marked, _idx, marked);
                     
                    }
                }
            }
        }
    }
    /**
     * push data segment
     * @param {*} v 
     */
    appendToData(v) {
        this.dataSegments.push(v);
    }
    /**
     * store to buffer
     * @param {string|{_buffer:string, _data:{bufferSegment:[*], dataSegment:[*]}}} buffer 
     * @param {*} param1 
     */
    storeToBuffer(buffer, { lastDefineStates }) {
        if (typeof (buffer) == 'string') {
            if (lastDefineStates && (buffer == lastDefineStates.bufferSegment.join(''))) {
                this.appendToBuffer({ buffer, data: lastDefineStates.dataSegment.join('') });
            }
            else {
                // + | just store to buffer 
                this.appendToBuffer(buffer);
            }
        } else {
            const { _buffer, _data } = buffer;
            if (!_data?.bufferSegment){
                // + | missing buffer segment
                this.appendToBuffer(_buffer);
                return;
                throw new Error('missing buffer segment');
            }
            let rs = _data.bufferSegment.join('');
            if (_buffer != rs) {
                // TODO : update list of item to join operation and trim line
                this.appendToBuffer({ buffer:_buffer, data: '-nop-'}); // lastDefineStates.dataSegment.join('') });
                return;
                throw new Error('invalid buffer mismatch segments');
            }
            this._joinWith(_data);

        }
    }
    static ClearSegments({dataSegment, bufferSegment}){
        dataSegment.length = 0;
        bufferSegment.length = 0;
        if ('marked' in bufferSegment){ 
            bufferSegment.marked.length = 0;
            bufferSegment.marked.op = []; 
        }
    }
    /**
     * reduce buffer segment index
     * @param {number} count 
     * @param {*} bufferSegment 
     */
    static ReduceBufferSegmentIndex(count, bufferSegment){
          // + | reduce index 
          const TS = [];
          bufferSegment.marked?.forEach(v=>{
              const _op = bufferSegment.marked.op[v];
              const _new_idx = v-count;
              if (_op){
                  delete(bufferSegment.marked.op[v]); 
                  Utils.UpdateSegmentMarkerOperation(bufferSegment.marked, _new_idx,_op);  
              }
              TS.push(_new_idx);  
          }); 
          bufferSegment.marked.length = 0;
          bufferSegment.marked.push(...TS);
    }
    /**
     * join with segment
     * @param {{bufferSegment:[*], dataSegment:[*]}} param0 
     */
    _joinWith({ bufferSegment, dataSegment }) {
        const { FormatterSegmentJoin} = Utils.Classes;

        let join = Joiner || (() => { Joiner = new FormatterSegmentJoin(); return Joiner })();
        join.bufferSegment = bufferSegment;
        join.dataSegment = dataSegment;
        join.updateData({ bufferSegment: this.bufferSegments, dataSegment: this.dataSegments });
    }
    /**
     * clear segments
     */
    clear() {
        const { bufferSegments, dataSegments } = this;
        bufferSegments.length = 0;
        dataSegments.length = 0;
        bufferSegments.marked = [];
    }
    /**
     * clear outputs
     */
    clearOutput() {
        this.output.length = 0;
        this.dataOutput.length = 0;
    }
    /**
     * clear all 
     */
    clearAll() {
        this.clear();
        this.clearOutput();
    }
    /**
     * trim end data
     */
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
     * retrieve last segment info
     */
    lastSegmentInfo(){
        const { bufferSegments } = this;
        if (bufferSegments.length > 0) {
            const idx = bufferSegments.length - 1;
            const _buffer =  bufferSegments[idx];
            const op = FormatterBuffer.GetBufferMarkedOperation(bufferSegments, idx); 
            return new FormatterSegmentInfo(_buffer, op);
        }
        return null;
    }
    /**
     * get buffer sement
     * @param {*} bufferSegments 
     * @param {*} idx 
     */
    static GetBufferMarkedOperation(bufferSegments, idx){
        let op = null;
        if (idx in bufferSegments.marked){
            let l = bufferSegments.marked[idx];
            if (l in bufferSegments.marked.op){
                op = bufferSegments.marked.op[l];
            }
        }
        return op;
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
     * @param {{ bufferSegment:[], dataSegment:[] }} bufferData 
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

                Utils.TrimBufferSegment(bufferSegment, dataSegment);
                Utils.ReorderBufferSegment(bufferSegment);
                let elt = dataSegment.filter(o => o);
                dataSegment.length = 0;
                dataSegment.push(...elt);
                return dataSegment;
                // const _tlist = bufferSegment.marked.slice(0);
                // let _count = 0;
                // let _dir = 0;



                // while (_tlist.length > 0) {
                //     _idx = _dir == 0 ? _tlist.shift() : _tlist.pop();
                //     let _top = bufferSegment.marked.op[_idx] || null;
                //     let _trim = _dir == 0 ? _idx == _count : false;
                //     if (_top && _trim && _top.trimmed) {
                //         //let _ts = q[_idx];
                //         delete (q[_idx]);
                //         delete (dataSegment[_idx]);
                //         delete (bufferSegment.marked.op[_idx]);
                //         delete (bufferSegment.marked[_count])
                //     }
                //     if (_dir==1){
                //         if (!_trim){
                //             break;
                //         }
                //     } else {
                //         if (!_trim){
                //             _dir = 1;
                //         }
                //     }
                //     _count++;
                // }
                // const _marked = bufferSegment.marked.filter(o => o);
                // bufferSegment.marked.length = 0;
                // bufferSegment.marked.push(..._marked);
                break;
            default:
                if (typeof (op) == 'function') {
                    while (bufferSegment.marked.length > 0) {
                        _idx = bufferSegment.marked.shift();
                        s = q[_idx];
                        if (op(s)) {
                            delete (q[_idx]);
                            delete (dataSegment[_idx]);
                        }
                    }

                }
        }

        let elt = dataSegment.filter(o => o);
        dataSegment.length = 0;
        dataSegment.push(...elt);

        bufferSegment.length = 0;
        elt = q.filter(o => o);
        bufferSegment.push(...elt);
        return bufferData;
    }
}

const { FormatterSegmentInfo } = require("./FormatterSegmentInfo");
const { FormatterSegmentJoin } = require("./FormatterSegmentJoin");
const { Utils } = require("./Utils");

exports.FormatterBuffer = FormatterBuffer;