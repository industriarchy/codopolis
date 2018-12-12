// Userlist data array for filling in info box
var userListData = [];

// DOM Ready =============================================================
$(document).ready(function() {

    $('#btnAddUser').on('click', addUser);
    $('#btnLogin').on('click', login);
});

// Functions =============================================================

// LOGIN
function login(event) {
  event.preventDefault();
  // First do Password Check
  var email = $('#loginEmail').val();
  var pw = $('#loginPassword').val();
  $.ajax({
      type: 'POST',
      url: '/users/login/' + email + '/' + pw,
      dataType: 'JSON'
  }).done(function( response ) {
    if(response.msg == 'x') {
      alert('incorrect credentials!');
    }
    else {
      location.reload();
    }
  });

}

// Add User
function addUser(event) {

    event.preventDefault();

    // Super basic validation - increase errorCount variable if any fields are blank
    var errorCount = 0;
    $('#addUser input').each(function(index, val) {
        if($(this).val() === '') { errorCount++; }
    });

    // Check and make sure errorCount's still at zero
    if(errorCount === 0) {

      if($('#addUser input#inputPassword').val() == $('#addUser input#inputpasswordconf').val()) {

        if($('#addUser input#inputUserEmail').val().search("@") != -1) {
            // If it is, compile all user info into one object
            var newUser = {
                'username': $('#inputUserName').val(),
                'email': $('#inputUserEmail').val(),
                'password': $('#inputPassword').val()
            }

            // Use AJAX to post the object to our adduser service
            $.ajax({
                type: 'POST',
                data: newUser,
                url: '/users/adduser',
                dataType: 'JSON'
            }).done(function( response ) {

                // Check for successful (blank) response
                if (response.msg === '') {

                    // Clear the form inputs
                    $('#addUser fieldset input').val('');

                    // Update page
                    location.reload();

                }
                else {

                    // If something goes wrong, alert the error message that our service returned
                    alert('Error: ' + response.msg);

                }
            });
          }
          else {
            alert("please use a correct email address");
          }
        }
        else{
          alert("Please match passwords");
        }
    }
    else {
        // If errorCount is more than 0, error out
        alert('Please fill in all fields');
        return false;
    }
};

// Delete User
function deleteUser(event) {

    event.preventDefault();

    // Pop up a confirmation dialog
    var confirmation = confirm('Are you sure you want to delete this user?');

    // Check and make sure the user confirmed
    if (confirmation === true) {

        // If they did, do our delete
        $.ajax({
            type: 'DELETE',
            url: '/users/deleteuser/' + $(this).attr('rel')
        }).done(function( response ) {

            // Check for a successful (blank) response
            if (response.msg === '') {
            }
            else {
                alert('Error: ' + response.msg);
            }

            // Update the table
            populateTable();

        });

    }
    else {

        // If they said no to the confirm, do nothing
        return false;

    }

};
