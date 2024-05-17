"use strict";
Object.defineProperty(exports, '__ESModule', {value:true});


/**
 * @typedef IFormatterTypeDefinition
 * @type {object}
 * @property {string[]} bufferSegment;
 * @property {string[]} dataSegment;
 */

class FormatterSegmentOperation{

    /**
     * @var {IFormatterTypeDefinition}
     */
    data;

    /**
     * 
     * @param {IFormatterTypeDefinition} data 
     */
    constructor(data){
        this.data = data;
    }
    replace(regex, value){
        const { data }=  this;
        let _value = this.data.dataSegment.join('').toString();
        if( typeof(regex) != 'string'){
            regex = regex.toString()
            regex = new RegExp(regex.slice(1, regex.lastIndexOf('/')-1 ), "d");
        }
        let _p = null;
        if (_p = regex.exec(_value)){
            let idx = _p.index;
            let segmentIndex = this._getSegmentIndex(this.data.dataSegment, idx);
            if(segmentIndex==-1){
                throw new Error('missing segment index');
            }
            data.dataSegment[segmentIndex] = data.dataSegment[segmentIndex].replace(regex, value.data);
            data.bufferSegment[segmentIndex] = value.buffer;
        }
    }
    trimEnd(){
        while(q = this.data.dataSegment.pop()){
            q = q.trimEnd();
            if (q.length>0){
                this.data.dataSegment.push(q);
                break;
            }
            this.data.bufferSegment.pop();
        }
    }
    trimStart(){
        while(q = this.data.dataSegment.shift()){
            q = q.trimStart();
            if (q.length>0){
                this.data.dataSegment.push(q);
                break;
            }
            this.data.bufferSegment.shift();
        }
    }
    trim(){
        this.trimStart();
        this.trimEnd();
    }
    _getSegmentIndex(data, idx){
        let pos = 0;
        for(let i = 0; i < data.length; i++){
                let s = data[i];
                let ln = s.length;
                if ((pos<=idx) && (idx < (pos+ln))){
                    return i;
                }
                pos+= ln;
        }
        return -1;
    }
}

exports.FormatterSegmentOperation = FormatterSegmentOperation;