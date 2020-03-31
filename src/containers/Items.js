import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import "./Items.css";
import DraggableItemsList from "../components/DraggableItemsList";

export default function Items(props) {
  const itemTypePlural = window.location.pathname.split('/')[1].replace(/_/g, ' ');
  const itemType = itemTypePlural.substring(0, itemTypePlural.length - 1);
  const [pageConfig] = useState(
    props.clientConfig.find(configInList => configInList.itemType === itemType)
  );
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      try {
        if (pageConfig.categorized) {
          const categories = await API.get("items-api", `/categories/${pageConfig.id}`);
          setCategories(categories);
        } else {
          const [items, photos, itemsToPhotos] = await Promise.all([
            API.get("items-api", `/itemsOfSpecifiedType/${pageConfig.id}`),
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
      } catch (e) {
        alert(e);
      }
      setIsLoading(false);
    }
    onLoad();
  }, [props.isAuthenticated, pageConfig]);

  function renderCategoriesList(categories) {
    return (
      <div>
        <DraggableItemsList
          itemType='category'
          itemTypePlural='categories'
          originalItems={categories}
          newItemURL={`categories/new/${pageConfig.id}`}
          clientConfig={pageConfig}
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
          newItemURL={`items/new/${pageConfig.id}/uncategorized`}
          clientConfig={pageConfig}
        />
      </div>
    );
  }

  return (
    <div className="Items">
      {pageConfig.categorized ? (
        <div className="categories">
          <div className="page-header">
            <h1>{`${pageConfig.itemType} Categories`}</h1>
          </div>
          {!isLoading && renderCategoriesList(categories)}
        </div>
      ) : (
        <div className="items">
          <div className="page-header">
            <h1>{`${pageConfig.itemType}s`}</h1>
          </div>
          {!isLoading && renderItemsList(items)}
        </div>
      )}
    </div>
  );
}
