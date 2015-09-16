// automatically login, don't click, there might be auth code to input

chrome.storage.sync.get({
  username: '',  // must be set in background.js otherwise errors!
  password: '',
}, function(items) {
  document.getElementById("TPL_username_1").value = items.username;
  document.getElementById("TPL_password_1").value = items.password;
});

