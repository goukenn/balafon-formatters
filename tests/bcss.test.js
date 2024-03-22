"use stricts";

const { Formatters } = require("../src/lib/Formatters");
const webUtils = require("../src/web/Utils");

let _data = [{"range":[1,11],"rf":"xxsm-screen"},{"range":[3,2],"rf":"sm"},{"range":[5,7],"rf":"-screen"}];

let _s = 0;
let _explode = null
_data.forEach((a)=>{
    let [min, max] = a.range;
    if (_explode==null){
        _explode = [];
        _explode.push(min);
        _explode.push(max);
    }
    else{
        let _lmax = _explode[_explode.length-1];
        _explode[_explode.length-2];

        if (max < _lmax){
            _explode.pop();
            _explode.push(min);
            _explode.push(max);
            _explode.push(_lmax);
        }
    }

});

console.log(_explode);
// return;



const _formatter = Formatters.Load('bcss', webUtils.webStyleClass);
const _def = {};
_formatter.debug = true;
_formatter.listener = null;//webUtils.webFormattingListener(_def);
const data = _formatter.format([
    "# default-media sm ",    
    "@xxsm-screen{}",
    "@def{}"
]);
 

console.log("result: ");
console.log(data);
console.log('');
console.log('done');
