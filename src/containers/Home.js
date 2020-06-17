import React from "react";
import { Redirect } from "react-router-dom";
import "./Home.css";
import Login from "./Login";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Home(props) {
  function renderContent() {
    if (props.clientConfig.length > 0) {
      return <Redirect to={`${props.clientConfig[0].itemType.replace(/ /g, '_')}s`} />;
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
