/*
var regex = /?$/;
if (regex.test(document.location.href)) {
}
*/
if (document.location.href.substr(-1) === '?') {
  var targetURL = "http://qudao.gongxiao.tmall.com/supplier/user/invitation_list.htm?spm=a1z0g.27.1000495.4.mmNUmY";
  document.location.href = targetURL;
}
