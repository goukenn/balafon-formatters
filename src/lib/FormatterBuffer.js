"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

/**
 * class that help to manibule buffer by segment
 */
class FormatterBuffer{
    constructor(){ 
        var m_output = [];
        var m_bufferSegments = [];
        
        
        /*
        arry of buffer segment
         */
        Object.defineProperty(this, 'bufferSegments', { get(){ return m_bufferSegments;} })
        Object.defineProperty(this, 'output', { get(){ return m_output;} }) 
        Object.defineProperty(this, 'length', { get(){ return m_bufferSegments.length;} })
       
    }
    /**
     * get the buffer offset content
     * @param {number} offset 
     * @param {string} join 
     * @returns 
     */
    getContent(offset,join=''){
        return this.bufferSegments.slice(offset).join(join||'');
    }
    /**
     * get buffer segment
     */
    get buffer(){
        return this.bufferSegments.join('');
    }
    /**
     * join the buffer segments
     * @param {null|string} join 
     * @returns string
     */
    join(join){
        return this.bufferSegments.join(join||'');
    }
    /**
     * append value to buffer segment
     * @param {string} v 
     */
    appendToBuffer(v){ 
        this.bufferSegments.push(v); 
    }
    /**
     * clear segments
     */
    clear(){
        this.bufferSegments.length = 0;
    }
    trimEnd(){
        const { bufferSegments} = this;
        let q = null;
        while(bufferSegments.length>0){
            q = bufferSegments.pop();
            q = q.trimEnd();
            if (q.length>0){
                bufferSegments.push(q);
                break;
            }
        }
    }
}

exports.FormatterBuffer = FormatterBuffer;