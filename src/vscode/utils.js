"use strict";

const { Formatters } = require("../formatter");

const webcolor = {
  aliceblue: "#EFF7FF",
  antiquewhite: "#F9EAD6",
  aqua: "#0FF",
  aquamarine: "#7FFFD3",
  azure: "#EFFFFF",
  beige: "#F4F4DB",
  bisque: "#FFE2C4",
  black: "#000",
  blanchedalmond: "#FFEACC",
  blue: "#00F",
  blueviolet: "#892BE2",
  brown: "#A52828",
  burlywood: "#DDB787",
  cadetblue: "#5E9EA0",
  chartreuse: "#7FFF00",
  chocolate: "#D1681E",
  coral: "#FF7F4F",
  cornflowerblue: "#6393ED",
  cornsilk: "#FFF7DB",
  crimson: "#DB143D",
  cyan: "#0FF",
  darkblue: "#00008C",
  darkcyan: "#008C8C",
  darkgoldenrod: "#B7870A",
  darkgray: "#A8A8A8",
  darkgreen: "#006300",
  darkgrey: "#A8A8A8",
  darkkhaki: "#BCB76B",
  darkmagenta: "#8C008C",
  darkolivegreen: "#546B2D",
  darkorange: "#FF8C00",
  darkorchid: "#93C",
  darkred: "#8C0000",
  darksalmon: "#E8967A",
  darkseagreen: "#8EBC8E",
  darkslateblue: "#473D8C",
  darkslategray: "#2D4F4F",
  darkslategrey: "#2D4F4F",
  darkturquoise: "#00CED1",
  darkviolet: "#9300D3",
  deeppink: "#FF1493",
  deepskyblue: "#00BFFF",
  dimgray: "#686868",
  dimgrey: "#686868",
  dodgerblue: "#1E8EFF",
  firebrick: "#B22121",
  floralwhite: "#FFF9EF",
  forestgreen: "#218C21",
  fuchsia: "#F0F",
  gainsboro: "#DBDBDB",
  ghostwhite: "#F7F7FF",
  gold: "#FFD600",
  goldenrod: "#D8A521",
  gray: "#7F7F7F",
  green: "#007F00",
  greenyellow: "#ADFF2D",
  grey: "#7F7F7F",
  honeydew: "#EFFFEF",
  hotpink: "#FF68B5",
  indianblue: "#00D9FF",
  indianred: "#CC5B5B",
  indigo: "#490082",
  ivory: "#FFFFEF",
  khaki: "#EFE58C",
  lavender: "#E5E5F9",
  lavenderblush: "#FFEFF4",
  lawngreen: "#7CFC00",
  lemonchiffon: "#FFF9CC",
  lightblue: "#ADD8E5",
  lightcoral: "#EF7F7F",
  lightcyan: "#E0FFFF",
  lightgoldenrodyellow: "#F9F9D1",
  lightgray: "#D3D3D3",
  lightgreen: "#8EED8E",
  lightgrey: "#D3D3D3",
  lightpink: "#FFB5C1",
  lightsalmon: "#FFA07A",
  lightseagreen: "#21B2AA",
  lightskyblue: "#87CEF9",
  lightslategray: "#778799",
  lightslategrey: "#778799",
  lightsteelblue: "#AFC4DD",
  lightyellow: "#FFFFE0",
  lime: "#0F0",
  limegreen: "#3C3",
  linen: "#F9EFE5",
  magenta: "#F0F",
  maroon: "#7F0000",
  mediumaquamarine: "#6CA",
  mediumblue: "#00C",
  mediumorchid: "#BA54D3",
  mediumpurple: "#9370D8",
  mediumseagreen: "#3DB270",
  mediumslateblue: "#7A68ED",
  mediumspringgreen: "#00F999",
  mediumturquoise: "#47D1CC",
  mediumvioletred: "#C61484",
  midnightblue: "#191970",
  mintcream: "#F4FFF9",
  mistyrose: "#FFE2E0",
  moccasin: "#FFE2B5",
  navajowhite: "#FFDDAD",
  navy: "#00007F",
  oldlace: "#FCF4E5",
  olive: "#7F7F00",
  olivedrab: "#6B8E23",
  orange: "#FFA500",
  orangered: "#ff4500",
  orchid: "#D870D6",
  palegoldenrod: "#EDE8AA",
  palegreen: "#99F999",
  paleturquoise: "#AFEDED",
  palevioletred: "#D87093",
  papayawhip: "#FFEFD6",
  peachpuff: "#FFD8BA",
  peru: "#CC843F",
  pink: "#FFBFCC",
  plum: "#DDA0DD",
  powderblue: "#AFE0E5",
  purple: "#7F007F",
  red: "#F00",
  rosybrown: "#BC8E8E",
  royalblue: "#3F68E0",
  saddlebrown: "#8C4411",
  salmon: "#F97F72",
  sandybrown: "#F4A360",
  seagreen: "#2D8C56",
  seashell: "#FFF4ED",
  sienna: "#A0512D",
  silver: "#BFBFBF",
  skyblue: "#87CEEA",
  slateblue: "#6B59CC",
  slategray: "#707F8E",
  slategrey: "#707F8E",
  snow: "#FFF9F9",
  springgreen: "#00FF7F",
  steelblue: "#4482B5",
  tan: "#D1B58C",
  teal: "#007F7F",
  thistle: "#D8BFD8",
  tomato: "#FF6347",
  transparent: "transparent",
  turquoise: "#3FE0D1",
  violet: "#ED82ED",
  wheat: "#F4DDB2",
  white: "#FFF",
  whitesmoke: "#F4F4F4",
  yellow: "#FF0",
  yellowgreen: "#9C3"
};
const _reverse_color_keys = (c => {
  //reverse keys
  let _o = {};
  for (let i in c) {
    let k = c[i];
    _o[k] = i;
  }
  return _o;
})(webcolor);

const _is_reducable_hex_color = hexColor => {
  return /^\b(?:([0-9a-f])\1){3,4}\b/i.test(hexColor);
};
const _is_web_color =
  /**
	 * 
	 * @param {vscode.Color} color 
	 * @param {{name:string}} ref name 
	 * @returns 
	 */
  (color, ref) => {
    let _key = _hex_color(color).toUpperCase();
    if (ref) {
      ref.hexColor = _key;
    }
    const _bkey = [];
    if (_is_reducable_hex_color(_key.substring(1))) {
      let n_key =
        "#" +
        _key.substring(1, 2) +
        _key.substring(3, 4) +
        _key.substring(5, 6);
      _bkey.push(n_key.toUpperCase());
    }
    _bkey.push(_key);
    while (_bkey.length > 0) {
      _key = _bkey.shift();
      if (_key in _reverse_color_keys) {
        if (ref) {
          ref.name = _reverse_color_keys[_key];
        }
        return true;
      }
    }
    return false;
  };
/**
 * 
 * @param {vscode.Color} color 
 */
function _hex_color(color) {
  let _a =
    color.alpha != 1
      ? parseInt(_clamp(Math.round(color.alpha * 255.0), 255))
          .toString(16)
          .padStart(2, "0")
      : "";
  return (
    "#" +
    (color.red * 255.0).toString(16).padStart(2, "0") +
    (color.green * 255.0).toString(16).padStart(2, "0") +
    (color.blue * 255.0).toString(16).padStart(2, "0") +
    _a
  );
}
function _clamp(v, max) {
  return Math.min(max, Math.max(0, v));
}

function _round_colorf(cl, p = 100.0) {
  return Math.round(cl * p) / p;
}

class utils {
  /**
	 * @param string name 
	 * @param vscode vscode
	 */
  static LoadProvideDocumentColor(name, vscode) {
    const _formatter = Formatters.Load(name);
    if (!_formatter) {
      throw new Error("missing formatter ");
    }
    return {
      provideDocumentColors(document, token) {
        const _text = document.getText(); 
        const _colors_lists = utils.ExtractColors(_formatter, _text);
        const _colors = [];
        if (_colors_lists) {
          try {
            _colors_lists.forEach(i => {
              let x = document.positionAt(i.sourceOffset * 1.0);
              let y = document.positionAt(i.sourceOffset + i.value.length);
              const _range = new vscode.Range(x, y);
              const _color = utils.GetColor(
                i.type == "webcolor" ? utils.ReverseColor(i.value) : i.value,
                vscode
              );
              const _clinfo = new vscode.ColorInformation(_range, _color);
              _colors.push(_clinfo);
            });
          } catch (ex) {
            console.debug("error ", ex);
          }
        }
        return _colors;
      }
    };
  }
  static GetProviderPresentation(id, vscode) {
    return {
      /**
				 * 
				 * @param {vscode.Color} color 
				 * @param {{document: vscode.TextDocument}, range: vscode.Range} context 
				 * @param {vscode.CancellationToken} token 
				 * @returns {vscode.ColorPresentation[]}
				 */
      provideColorPresentations(color, context, token) {
        // list of presntation color
        const _p = [];
        const cl = { R: 0, G: 0, B: 0, r: 0, g: 0, b: 0, A: 1, a: 1 };
        const _name = { name: "", hexColor: null };
        const _webcl = _is_web_color(color, _name);
        if (_webcl) {
          _p.push(new vscode.ColorPresentation(_name.name));
        }
        _p.push(new vscode.ColorPresentation(_name.hexColor));
        cl.R = color.red * 255.0;
        cl.G = color.green * 255.0;
        cl.B = color.blue * 255.0;
        cl.A = color.alpha * 100.0;
        cl.a = color.alpha;
        if (color.alpha == 1)
          _p.push(
            new vscode.ColorPresentation(`rgb(${cl.R}, ${cl.G}, ${cl.B})`)
          );
        _p.push(
          new vscode.ColorPresentation(
            `rgba(${cl.R}, ${cl.G}, ${cl.B}, ${cl.a})`
          )
        );
        _p.push(
          new vscode.ColorPresentation(
            `/* {${_round_colorf(color.red)}, ${_round_colorf(
              color.green
            )}, ${_round_colorf(color.blue)}, ${_round_colorf(color.alpha)}} */`
          )
        );
        return _p;
      }
    };
  }
  static ReverseColor(color) {
    return webcolor[color] || "#000";
  }
  /**
	 * get color utility
	 * @param {string} hexColor 
	 * @param {*} vscode vscode lib
	 * @returns 
	 */
  static GetColor(hexColor, vscode) {
    let _red = 0,
      _green = 0,
      _blue = 0;
    let _alpha = 1;
    const _v = hexColor.substring(1);
    const _type = hexColor.length - 1;
    switch (_type) {
      case 3:
      case 4:
        _red = parseInt(_v.substring(0, 1).repeat(2), 16) / 255.0;
        _green = parseInt(_v.substring(1, 2).repeat(2), 16) / 255.0;
        _blue = parseInt(_v.substring(2, 3).repeat(2), 16) / 255.0;
        if (_type == 4) {
          _alpha = parseInt(_v.substring(3, 4).repeat(2), 16) / 255.0;
        }
        break;
      case 6:
        _red = parseInt(_v.substring(0, 2), 16) / 255.0;
        _green = parseInt(_v.substring(2, 4), 16) / 255.0;
        _blue = parseInt(_v.substring(4, 6), 16) / 255.0;
        break;
    }
    return new vscode.Color(_red, _green, _blue, _alpha);
  }

  /**
	 * 
	 * @param {*} formatter 
	 * @param {string} src 
	 * @returns 
	 */
  static ExtractColors(formatter, src) {
    const _color_lists = [];
    const _listener = {
      /**
			 * 
			 * @param {*} marker 
			 * @param {*} option 
			 * @param {*} isSubFormatting 
			 * @returns 
			 */
      onEndHandler(marker, option, {isSubFormatting = false}) {
        if (isSubFormatting) {
          return;
        }
        const {
          tokenID,
          value,
          offset,
          sourceOffset
        } = Formatters.EndListenerArguments(marker, option);
        const { debug } = option;
        switch (tokenID) {
          case "webcolor":
          case "hexcolor":
            const _inf = {
              type: tokenID,
              value: value.source,
              sourceOffset,
              offset
            };
            _color_lists.push(_inf);
            debug && console.log(_inf);
            break;
        }
      }
    };
    formatter.listener = _listener;
    formatter.format(src);
    return _color_lists;
  }
}

exports.utils = utils;
