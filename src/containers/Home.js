import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import "./Home.css";
import DraggableItemsList from "../components/DraggableItemsList";
import Login from "./Login";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Home(props) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      if (!props.isAuthenticated) {
        return;
      }
      try {
        if (props.clientConfig && props.clientConfig.length === 1) {
          if (props.clientConfig[0].categorized) {
            const categories = await API.get("items-api", `/categories/${props.clientConfig[0].id}`);
            setCategories(categories);
          } else {
            const [items, photos, itemsToPhotos] = await Promise.all([
              API.get("items-api", `/itemsOfSpecifiedType/${props.clientConfig[0].id}`),
              API.get("items-api", "/photos"),
              API.get("items-api", "/itemsToPhotos"),
            ]);
            items.forEach((item, i) => {
              const photoIds = itemsToPhotos
                .filter(itemToPhoto => itemToPhoto.itemId === item.itemId)
                .map(itemToPhoto => itemToPhoto.photoId);
              const firstPhotoId = photoIds[0];
              const firstPhoto = firstPhotoId && photos.find(photo => photo.photoId === firstPhotoId);
              items[i].itemPhoto = firstPhoto && firstPhoto.photoName;
            });
            setItems(items);
          }
        }
      } catch (e) {
        alert(e);
      }
      setIsLoading(false);
    }
    onLoad();
  }, [props.isAuthenticated, props.clientConfig]);

  function renderCategoriesList(categories) {
    return (
      <div>
        <DraggableItemsList
          itemType='category'
          itemTypePlural='categories'
          originalItems={categories}
          newItemURL={`categories/new/${props.clientConfig[0].id}`}
          clientConfig={props.clientConfig[0]}
        />
      </div>
    );
  }

  function renderItemsList(items) {
    return (
      <div>
        <DraggableItemsList
          itemType='item'
          itemTypePlural='items'
          originalItems={items}
          newItemURL={`items/new/${props.clientConfig[0].id}/uncategorized`}
          clientConfig={props.clientConfig[0]}
        />
      </div>
    );
  }

  function renderList() {
    return props.clientConfig[0].categorized ? (
      <div className="categories">
        <div className="page-header">
          <h1>{`${props.clientConfig[0].itemType} Categories`}</h1>
        </div>
        {!isLoading && renderCategoriesList(categories)}
      </div>
    ) : (
      <div className="items">
        <div className="page-header">
          <h1>{`${props.clientConfig[0].itemType}s`}</h1>
        </div>
        {!isLoading && renderItemsList(items)}
      </div>
    );
  }

  function renderCards() {
    return (
      <div className="home-page-cards">
        {props.clientConfig.map(configInList => (
          <div key={configInList.id} className="home-page-card">
            <a href={`/${configInList.itemType}s`}>
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
      if (props.clientConfig.length > 1) {
        return renderCards();
      }
      return renderList();
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
