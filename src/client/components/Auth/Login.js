import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Redirect } from 'react-router-dom'


const Login = ({ login }) => {
  const [username, setUsername] = useState('');
  const [suEmail, setSUEmail] = useState('');
  const [suPassword, setSUPassword] = useState('');
  const [suRPassword, setSURPassword] = useState('');
  const [lEmail, setLEmail] = useState('');
  const [lPassword, setLPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = () => {
    event.preventDefault();
    console.log("logs something", lEmail, lPassword);
    fetch('http://localhost:3000/users/login', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: lEmail,
        password: lPassword
      })
    }).then(res => {
      return res.json()
    }).then( res => {
      // Set the local storage equal to the user?
      localStorage.setItem('user', JSON.stringify({loggedIn: true, ...res}));
      login(true);
    })
  };

  const handleSignup = () => {

        event.preventDefault();

        // Super basic validation - increase errorCount variable if any fields are blank
        var errorCount = 0;
        const thInput = [username, suEmail, suPassword, suRPassword];
        thInput.forEach(function( val ) {
            if(val === '') { errorCount++; }
        });

        // Check and make sure errorCount's still at zero
        if(errorCount === 0) {

          if(suPassword === suRPassword) {

            if(suEmail.search("@") != -1) {
                fetch('http://localhost:3000/users/addUser', {
                  method: 'POST',
                  mode: 'cors',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    username,
                    email: suEmail,
                    password: suPassword
                  })
                }).then(res => {
                  return res.json()
                }).then( res => {
                  // Set the local storage equal to the user?
                  if (res.msg == "") {
                    localStorage.setItem('user', JSON.stringify({loggedIn: true, ...res}));
                    login(true);
                  }
                  else {
                    setRegisterError(`Error signing up: ${res.msg}`);
                  }
                })
              }
              else {
                setRegisterError("Please use a valid email address");
              }
            }
            else{
              setRegisterError("Please match passwords");
            }
        }
        else {
            setRegisterError("Please fill in all fields.");
            return false;
        }
  };

  const test = () => {
    fetch('/api', {
      headers:{
        "accepts":"application/json",
        "Content-Type": "application/json",
        "mode": "no-cors"
      }
    }).then(res => {
      return res.json()
    })
    .then((json) => {
      console.log("response", JSON.stringify(json));
    })
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-3"></div>
        <div className="col-md-6" id="container">
          <h1>Codopolis</h1>
          <form id="addUser">
            <h3 className="form-signin-heading">Signup to play!</h3>
            <input className="form-control" onChange={e => setUsername(e.target.value)} type="text" placeholder="Username" /><br />
            <input className="form-control" onChange={e => setSUEmail(e.target.value)} type="text" placeholder="Email Address" /><br />
            <input className="form-control" onChange={e => setSUPassword(e.target.value)} type="password" placeholder="Password" /><br />
            <input className="form-control" onChange={e => setSURPassword(e.target.value)} type="password" placeholder="Re-enter Password" /><br />
            <div className="field-error">{registerError}</div>
            <button className="btn btn-lg btn-primary btn-block" onClick={handleSignup}>Register</button>
          </form><br /><br />
          <form>
            <h3 className="form-signin-heading">Sign In</h3>
            <input className="form-control" onChange={e => setLEmail(e.target.value)} type="text" placeholder="Email" /><br />
            <input className="form-control" onChange={e => setLPassword(e.target.value)} type="password" placeholder="Password"/><br />
            <div className="field-error">{loginError}</div>
            <button className="btn btn-lg btn-primary btn-block" onClick={handleLogin} >Login</button><br />
          </form>
        </div>
      </div>
    </div>
  );
}

// Add User
function addUser(event) {

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

export default Login;

// const mapStateToProps = state => ({ user: state.user })
// export default connect(mapStateToProps, { login })(Login)
