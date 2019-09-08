import React from 'react'

const logout = () => {
  localStorage.setItem('user', '{loggedIn: false}');
  location.reload();
};

const Header = ({ user }) => {
  return (
    <nav className="navbar navbar-dark bg-dark navbar-expand-lg">
      <div className="navbar-brand">Codopolis</div>
      <ul className="navbar-nav ml-auto">
        <li className="nav-item active">
          <a id="user" className="nav-link">{user && user.username}<span className="sr-only">(current)</span></a>
        </li>
        <li className="nav-item">
          <a className="nav-link">Utils</a>
        </li>
      </ul>
      <div className="my-2 my-lg-0">
        <button id="logout" className="btn btn-outline-success my-2 my-sm-0" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}

export default Header
