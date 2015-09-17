function save_options() {
  var username = $('#username').val();
  var password = $('#password').val();
  var showpass = $('#showpass').prop('checked');
  chrome.storage.sync.set({
    username: username,
    password: password,
    showpass: showpass
  }, function() {
    // Update status to let user know options were saved.
    $('#savestatus').html('已保存');
    setTimeout(function() {
      $('#savestatus').html('');
    }, 750);
  });
}

function restore_options() {
  chrome.storage.sync.get({
    username: '',  // must be set in background.js otherwise errors!
    password: '',
    showpass: false
  }, function(items) {
    $('#username').val(items.username);
    $('#password').val(items.password);
    $('#showpass').prop('checked', items.showpass);
    show_password();
  });
}

function show_password() {
  if ($("#showpass").is(':checked')) {
    $('#password').attr('type', 'text');
  } else {
    $('#password').attr('type', 'password');
  }
}

function clear_queue() {
  chrome.storage.sync.set({
    datacache: []
  }, function() {
    $('#clearstatus').html('已清空');
    setTimeout(function() {
      $('#clearstatus').html('');
    }, 750);
  });
}


document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
document.getElementById('restore').addEventListener('click',
    restore_options);
document.getElementById('showpass').addEventListener('change',
    show_password);
document.getElementById('clearqueue').addEventListener('click',
    clear_queue);
