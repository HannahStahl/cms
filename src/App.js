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
  const [clientConfig, setClientConfig] = useState([]);

  useEffect(() => {
    onLoad();
  }, []);

  async function onLoad() {
    try {
      await Auth.currentSession();
      const { id } = await Auth.currentUserInfo();
      const clientConfigFromDB = await fetch(`${config.clientConfigURL}/pages/${id}`).then(response => response.json());
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
    setClientConfig([]); // TODO figure out why this isn't working
    props.history.push("/");
  }

  return (
    !isAuthenticating && (
      <div className="App container">
        {isAuthenticated && (
          <Navbar collapseOnSelect expand="lg" fixed="top">
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse>
              <Nav>
                <Nav.Link href="/">Home</Nav.Link>
                {clientConfig.length > 1 && clientConfig.map(config => (
                  <Nav.Link key={config.id} href={`/${config.itemType.replace(/ /g, '_')}s`}>{config.itemType}s</Nav.Link>
                ))}
              </Nav>
            </Navbar.Collapse>
            {isAuthenticated ? (
              <div className="log-in-or-out" onClick={handleLogout}>Log out</div>
            ) : <a className="log-in-or-out" href="/">Log in</a>}
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
