"use strict";
Object.defineProperty(exports, '__esModule', { value: true });


class FormatterBufferUtils{

    /**
     * just treat formatter value
     * @param formatter 
     * @param value 
     * @param marker 
     * @param option 
     * @return {{buffer:string, data:string}}
     */
    static TreatValue(formatter, value, marker, option){
        option.saveBuffer();
        option.appendToBuffer(value, marker);
        let _value = option.buffer;
        let _data = option.data;
        option.restoreSavedBuffer();

        return {buffer:_value, data:_data};
    }
}

exports.FormatterBufferUtils = FormatterBufferUtils;