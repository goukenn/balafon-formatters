"use strict";
const K_R = 'KAndR'
const PSR_2 = 'PSR-2';
const PSR_21 = 'PSR-21';
const PSR_12 = 'PSR-12';
const ALLMAN = 'Allman';
class FormattingCodeStyles{
    static get K_R(){return K_R; } 
    static get PSR_2(){return PSR_2; } 
    static get PSR_21(){return PSR_21; } 
    static get PSR_12(){return PSR_12; } 
    static get ALLMAN(){return ALLMAN; } 

    /**
     * 
     * @param {*} data 
     */
    static Support(data){
        // 
        return FormattingCodeStyles.GetSupportedValues().indexOf(data) != -1;
    }
    static GetSupportedValues(){
        return [
            K_R,PSR_2, PSR_21, PSR_12, ALLMAN
        ]
    }
}
exports.FormattingCodeStyles = FormattingCodeStyles;