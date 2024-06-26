"use strict";

const { Utils } = require("./Utils");

Object.defineProperty(exports, '__esModule', { value: true });



class FormatterSegmentJoin{
    /**
     * 
     */
    dataSegment;
    /**
     * 
     */
    bufferSegment;

    constructor(){
    }

    /**
     * update segment data
     * @param {*} segments 
     * @param {*} param1 
     */
    static UpdateSegmentData(segments,{dataSegment, bufferSegment}){
        let joiner = new FormatterSegmentJoin();
        joiner.dataSegment = dataSegment;
        joiner.bufferSegment = bufferSegment;
        joiner.updateData(segments);
    }
    /**
     * 
     * @param {{bufferSegment:[], dataSegment:[]}} segments segment list to update
     */
    updateData(segments){
        const {dataSegment, bufferSegment} = this;
        const _length = segments.bufferSegment.length;
        segments.bufferSegment.push(...bufferSegment);
        segments.dataSegment.push(...dataSegment);
        const { marked }  = bufferSegment;
        const { FormatterBuffer } = Utils.Classes;

        if (marked){
            if(!('op' in marked)){
                FormatterBuffer.InitOpMarkedSegment(marked);
            }
            // + | -------------------------
            // + | - to - 
            // + | -------------------------            
            if (!('marked' in segments.bufferSegment)){ 
                segments.bufferSegment.marked = FormatterBuffer.InitMarkedSegment();
            }
            let _i = 0;
            let _d = segments.bufferSegment.marked;
            marked.forEach(element => {
                const _idx = element + _length;
                if (!('op' in _d)){
                    FormatterBuffer.InitOpMarkedSegment(_d);
                }
                _d.push(_idx);
                let _ts = element in marked.op? marked.op[element] : null;
                Utils.UpdateSegmentMarkerOperation(_d, _idx, _ts);  
                _i++;
            });
        }
    }
   
}
 

exports.FormatterSegmentJoin =FormatterSegmentJoin