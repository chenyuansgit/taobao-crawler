// Create the XHR object.
function CreateCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
}

// Dr.\nBoom will be:
// Dr. Boom
function RemoveLineBreak(str) {
  return str.replace(/(\r\n|\n|\r)/gm," ");
}

// Remove all line break junks from an object
function DeepTrim(obj) {
  for (var prop in obj) {
    var value = obj[prop], type = typeof value;
    if (value != null && (type == "string" || type == "object") && obj.hasOwnProperty(prop)) {
      if (type == "object") {
        DeepTrim(obj[prop]);
      } else {
        obj[prop] = obj[prop].trim();
        obj[prop] = RemoveLineBreak(obj[prop]);
      }
    }
  }
}

function JSON2CSV(json) {
  var fields = Object.keys(json[0]);
  var csv = json.map(function(row){
    return fields.map(function(fieldName){
      return '"' + (row[fieldName] || '') + '"';
    });
  });
  csv.unshift(fields); // add header column
  csv = csv.join('\r\n');
  return csv;
}

function Object2ListText(obj) {
  var arr = Object.keys(obj).map(function (key) {return key + ' ' + obj[key];} );
  return arr.join('\r\n');
}
