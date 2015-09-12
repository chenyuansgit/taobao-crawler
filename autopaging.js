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

function GoNextPage() {
  $(".page-next")[0].click();
}

function CheckLastPage() {
  // do sth to see whether we're at last page
}


function main() {

  var targetRegex = /qudao.gongxiao.tmall.com/;
  if (!targetRegex.test(document.location.href)) {
    console.log("redirecting...");
    return;
  }
  
  console.log("recording...");

  var items = $("#J_InviteList").find('tbody').find('.item');
  var json = [];
  for (var i = 0, max = items.length; i < max; i++) {
    var tds = $(items[i]).children();
    json.push({
      user_id     : $(tds[0]).children(':first').html(),
//      user_link   : 'http:' + $(tds[0]).children(':first').attr('href'),
//      user_icon   : $(tds[0]).children(':first').next().html(),
//      level       : $(tds[1]).html(),
      rate        : $(tds[2]).html(),
      open_date   : $(tds[3]).html(),
      type        : $(tds[4]).html(),
      invite_date : $(tds[5]).html(),
      invite_mode : $(tds[6]).html(),
      invite_stat : $(tds[7]).children(':first').html()
    });
  }
  DeepTrim(json);

  var fields = Object.keys(json[0]);
  var csv = json.map(function(row){
    return fields.map(function(fieldName){
      return '"' + (row[fieldName] || '') + '"';
    });
  });
  csv.unshift(fields); // add header column
  csv = csv.join('\r\n');

  alert(csv);
  console.log(csv);
  //window.open( "data:application/csv;charset=utf-8," + escape(csv));

  // gen message
  var pageNum = $(".page-cur").html();
  var ack = pageNum >= '1' ? 'end' : 'ongoing';  // nocommit
  var message = {
    type : "info", 
    data : json,
    page : pageNum,
    ack  : ack};

  chrome.runtime.sendMessage(message, function(response) {
    if (response && response.ack) {
      if (response.ack == "got") {
        GoNextPage();
        console.log("go next page");
      } else if (response.ack == 'done') {
        console.log("crawling done");
      }
    } else {
      console.log("info response missing");
    }
  });
}

main();
