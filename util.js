function RemoveLineBreak(str) {
  return str.replace(/(\r\n|\n|\r)/gm," ");
}

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
