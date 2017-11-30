var docCookies = {
  getItem: function (name) {
    nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;  },
  parseMap: function(map) {
    var j = 0;
    var k = 0;
    for(var i=0; i < map.length; i++) {
      if(map[i] == '%') {
        // Detects a [
        if(map[i+1] == '5' && map[i+2] == 'B') {
          j++;
        }
        // Detects a comma
        if(map[i+1] == '2' && map[i+2] == 'C') {
          k++;
        }
      }
    }
    var columns = j-1;
    var rows = (k+1)/columns;
    j=0;
    k=0;
    var MAP = Array(columns).fill().map(() => Array(rows).fill(0));
    var depth = 0;
    for(var i=0; i < map.length; i++) {
      if(map[i] == '%') {
        // Detects a [
        if(map[i+1] == '5' && map[i+2] == 'B') {
          depth++;
        }
        // Detects a ]
        if(map[i+1] == '5' && map[i+2] == 'D') {
          if(i > 1 && depth > 1) {
            MAP[k][j] = map[i-1];
            k++;
            j=0;
          }
          depth--;
        }
        // Detects a comma
        if(map[i+1] == '2' && map[i+2] == 'C') {
          if(i > 1 && depth > 1) {
            MAP[k][j] = map[i-1];
            j++;
          }
        }
      }
    }
    return MAP;

  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
        sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
        break;
        case String:
        sExpires = "; expires=" + vEnd;
        break;
        case Date:
        sExpires = "; expires=" + vEnd.toUTCString();
        break;
      }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!sKey || !this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
    return true;
  },
  hasItem: function (sKey) {
    return (new RegExp("(?:^|;s*)" + encodeURIComponent(sKey).replace(/[-.+*]/g, "$&") + "s*=")).test(document.cookie);
  },
  keys: /* optional method: you can safely remove it! */ function () {
    var aKeys = document.cookie.replace(/((?:^|s*;)[^=]+)(?=;|$)|^s*|s*(?:=[^;]*)?(?:1|$)/g, "").split(/s*(?:=[^;]*)?;s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
      return aKeys;
  }
};
