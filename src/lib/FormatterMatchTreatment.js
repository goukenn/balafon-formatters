"use strict";
Object.defineProperty(exports, 'enModule', { value: true });


class FormatterMatchTreatment{
    static Init(source){
        const _op = [];
        let _data = undefined;
        _op.treatment = new FormatterMatchTreatment;
        Object.defineProperty(_op, 'treated', { get(){
            return (this.indexOf('replaceWith')!=-1);
        } });
        Object.defineProperty(_op, 'source', { get(){
            return source;
        } });
        Object.defineProperty(_op, 'data', { get(){
            return _data;
        }, set(v) {
            _data = v;
        } });
        return _op;
    }
}

exports.FormatterMatchTreatment = FormatterMatchTreatment;