"use strict";
const { Formatters, Utils } = require("./lib/Formatters");
// + | ---------------------------------------
// + | check parent function evaluation 
// + | ---------------------------------------

 




const json_data = require("./formatters/html.btm-syntax.json");
const testdata = require('./../tests/source.data.json');
const _formatter = Formatters.CreateFrom(json_data);

function runTest(tests, _formatter, index){
    let testCount = 0;
    if (index){
        tests = tests.slice(index);
    }
    tests.forEach(o=>{
        if (o.name){
            console.log('run test ... '+o.name);
        } else{
            console.log("runngin test " + testCount);
        }
        // else {
        //     return;
        // }
        let s = _formatter.format(
            o.s
            );
            let e = o.e;
            if (Array.isArray(o.e)){
                e = e.join("\n");
            }

            if (s==e){
                testCount++;
                return;
        } 
        console.log('input : ', o.s.join(''));
        compareString(s, o.e);
        throw new Error("failed : "+testCount);
    });
}

function compareString(r, o){
    let idx = 0; 
    let data = typeof(o)=='string' ?  o.split("\n") : o;
    console.log(' ++++ = expected');
    console.log(' ---- = return');
    console.log("\n-result");
    console.log(r);
    console.log("\n-compare");
    r.split('\n').forEach((l)=>{
        let g = idx in data ? data[idx]: '';
        if (l== g){
            console.log(l);
        }else{ 
            console.log("++++ |"+((g+'').length.toString().padStart(10, ' '))+" |"+g);
            console.log("---- |"+((l+'').length.toString().padStart(10, ' '))+" |"+l); 
        }
        idx++;
    });
    if (idx<data.length){
        data.slice(idx).forEach(l=>{
            console.log('++++ ' + l);
        });
    }
}

runTest(testdata.tests, _formatter);


console.log("done");