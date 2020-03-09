import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import "./Home.css";
import DraggableItemsList from "../components/DraggableItemsList";
import Login from "./Login";

export default function Home(props) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      if (!props.isAuthenticated) {
        return;
      }
      try {
        const categories = await loadCategories();
        setCategories(categories);
      } catch (e) {
        alert(e);
      }
      setIsLoading(false);
    }
    onLoad();
  }, [props.isAuthenticated]);

  function loadCategories() {
    return API.get("items-api", "/categories");
  }

  function renderCategoriesList(categories) {
    const { clientConfig } = props;
    return (
      <div>
        <DraggableItemsList
          itemType='category'
          itemTypePlural='categories'
          originalItems={categories}
          newItemURL='/categories/new'
          clientConfig={clientConfig}
        />
      </div>
    );
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

  function renderCategories() {
    const { clientConfig } = props;
    return (
      <div className="categories">
        <div className="page-header">
          <h1>{`${clientConfig.itemType} Categories`}</h1>
        </div>
        {!isLoading && renderCategoriesList(categories)}
      </div>
    );
  }

  return (
    <div className="Home">
      {props.isAuthenticated ? renderCategories() : renderLander()}
    </div>
  );
}
