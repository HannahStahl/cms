import React from "react";
import "./Home.css";
import Login from "./Login";
import LoadingSpinner from "../components/LoadingSpinner";
import Items from "../containers/Items";

export default function Home(props) {
  function renderCards() {
    return (
      <div className="home-page-cards">
        {props.clientConfig.map(configInList => (
          <div key={configInList.id} className="home-page-card">
            <a href={`/${configInList.itemType.replace(/ /g, '_')}s`}>
              <div className="home-page-card-container">
                <h2>{configInList.itemType}s</h2>
              </div>
            </a>
          </div>
        ))}
      </div>
    );
  }

  function renderContent() {
    if (props.clientConfig.length > 0) {
      return (props.clientConfig.length > 1 ? renderCards() : <Items {...props} pageConfig={props.clientConfig[0]} />);
    }
    return <LoadingSpinner />;
  }

  function renderLander() {
    return (
      <Login
        isAuthenticated={props.isAuthenticated}
        userHasAuthenticated={props.userHasAuthenticated}
        clientConfig={props.clientConfig}
        setClientConfig={props.setClientConfig}
      />
    );
  }

  return (
    <div className="Home">
      {props.isAuthenticated ? renderContent() : renderLander()}
    </div>
  );
}
