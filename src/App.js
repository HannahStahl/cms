import React, { useState, useEffect } from "react";
import { Auth } from "aws-amplify";
import { withRouter } from "react-router-dom";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Routes from "./Routes";
import "./App.css";
import config from "./config";

function App(props) {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const [clientConfig, setClientConfig] = useState({});

  useEffect(() => {
    onLoad();
  }, []);

  async function onLoad() {
    try {
      await Auth.currentSession();
      const { id } = await Auth.currentUserInfo();
      console.log(id);
      const clientConfigFromDB = await fetch(`${config.clientConfigURL}/${id}`).then(response => response.json());
      userHasAuthenticated(true);
      setClientConfig(clientConfigFromDB);
    }
    catch(e) {
      if (e !== 'No current user') {
        console.log(e);
      }
    }

    setIsAuthenticating(false);
  }

  async function handleLogout() {
    await Auth.signOut();
    userHasAuthenticated(false);
    props.history.push("/");
  }

  return (
    !isAuthenticating && (
      <div className="App container">
        {isAuthenticated && (
          <Navbar collapseOnSelect expand="lg" fixed="top">
            <Navbar.Brand>
              <Nav.Link href="/">Home</Nav.Link>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse>
              <Nav>
                {isAuthenticated ? (
                  <Nav.Item onClick={handleLogout}>
                    <Nav.Link>Log out</Nav.Link>
                  </Nav.Item>
                ) : (
                  <Nav.Item>
                    <Nav.Link href="/">Log in</Nav.Link>
                  </Nav.Item>
                )}
              </Nav>
            </Navbar.Collapse>
          </Navbar>
        )}
        <div style={{ paddingTop: isAuthenticated ? 100 : 0 }}>
          <Routes appProps={{ isAuthenticated, userHasAuthenticated, clientConfig, setClientConfig }} />
        </div>
      </div>
    )
  );
}

export default withRouter(App);
