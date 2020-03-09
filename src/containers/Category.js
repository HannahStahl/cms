import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import "./Category.css";
import DraggableItemsList from "../components/DraggableItemsList";
import config from '../config';
import LoadingSpinner from "../components/LoadingSpinner";

export default function Category(props) {
  const [file, setFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [items, setItems] = useState([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    function loadCategories() {
      return API.get("items-api", "/categories");
    }
    function loadCategory() {
      return API.get("items-api", `/category/${props.match.params.id}`);
    }
    function loadItemsForCategory() {
      return API.get("items-api", `/items/${props.match.params.id}`);
    }
    function loadPhotos() {
      return API.get("items-api", "/photos");
    }
    function loadItemsToPhotos() {
      return API.get("items-api", "/itemsToPhotos");
    }
    async function onLoad() {
      try {
        const [categories, category, items, photos, photosForItems] = await Promise.all([
          loadCategories(), loadCategory(), loadItemsForCategory(), loadPhotos(), loadItemsToPhotos(),
        ]);
        const { categoryName, categoryPhoto } = category;
        if (categoryPhoto) {
          category.categoryPhotoURL = `${config.cloudfrontURL}/${clientConfig.userId}/${categoryPhoto}`;
        }
        items.forEach((item, i) => {
          const photoIds = photosForItems
            .filter(photoToItem => photoToItem.itemId === item.itemId)
            .map(photoToItem => photoToItem.photoId);
          const firstPhotoId = photoIds[0];
          const firstPhoto = firstPhotoId && photos.find(photo => photo.photoId === firstPhotoId);
          items[i].itemPhoto = firstPhoto && firstPhoto.photoName;
        });
        setCategories(categories);
        setCategoryName(categoryName);
        setCategory(category);
        setItems(items);
      } catch (e) {
        console.log('here');
        alert(e);
      }
    }
    onLoad();
  }, [props.match.params.id]);

  function validateDraftForm() {
    return categoryName.length > 0;
  }

  function validatePublishForm() {
    return categoryName.length > 0 && (category.categoryPhotoURL || file);
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      const splitFileName = file.name.toLowerCase().split('.');
      const fileExtension = splitFileName[splitFileName.length - 1];
      if (!["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
        alert(`Please upload an image file.`);
        return;
      }
      setFile(file);
    }
  }

  function saveCategory(category) {
    return API.put("items-api", `/categories/${props.match.params.id}`, {
      body: category
    });
  }

  function categoryNameExists() {
    const lowercaseName = categoryName.toLowerCase();
    const lowercaseNames = categories.map((categoryInList) => categoryInList.categoryName.toLowerCase());
    return lowercaseNames.includes(lowercaseName);
  }

  async function handleSubmit(categoryPublished) {
    if (categoryName.toLowerCase() !== category.categoryName.toLowerCase() && categoryNameExists()) {
      window.alert('A category by this name already exists.');
      return;
    }
    let categoryPhoto;
    if (categoryPublished) {
      setIsSaving(true);
    } else {
      setIsSavingDraft(true);
    }
    try {
      if (file) {
        categoryPhoto = await s3Upload(file);
      }
      await saveCategory({
        categoryName,
        categoryPhoto: categoryPhoto || category.categoryPhoto,
        categoryPublished,
        categoryRank: category.categoryRank,
      });
      props.history.push("/");
    } catch (e) {
      alert(e);
      setIsSaving(false);
      setIsSavingDraft(false);
    }
  }

  function deleteCategory() {
    return API.del("items-api", `/categories/${props.match.params.id}`);
  }

  async function handleDelete(event) {
    event.preventDefault();
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await deleteCategory();
      props.history.push("/");
    } catch (e) {
      alert(e);
      setIsDeleting(false);
    }
  }

  function renderItemsList(items) {
    return (
      <DraggableItemsList
        itemType='item'
        itemTypePlural='items'
        originalItems={items}
        newItemURL={`/items/new/${props.match.params.id}`}
        short
        clientConfig={clientConfig}
      />
    );
  }

  function renderItems() {
    const { clientConfig } = props;
    return (
      <div className="items">
        <Form.Group>
          <Form.Label className="items-list-label">
            {`${clientConfig.itemType}s`}
          </Form.Label>
          <ListGroup>
            {renderItemsList(items)}
          </ListGroup>
        </Form.Group>
      </div>
    );
  }

  function hasProhibitedCharacter(e) {
    return e.target.value.includes('_') || e.target.value.includes('?');
  }

  function renderCategoryDetails() {
    return (
      <Form>
        <Form.Group controlId="categoryName">
          <Form.Label>Name</Form.Label>
          <Form.Control
            value={categoryName}
            type="text"
            onChange={e => !hasProhibitedCharacter(e) && setCategoryName(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="file">
          <Form.Label>Image</Form.Label>
          <Form.Control onChange={handleFileChange} type="file" />
          {(file || category.categoryPhotoURL) && (
            <img
              src={file ? URL.createObjectURL(file) : category.categoryPhotoURL}
              alt={categoryName}
              height={150}
            />
          )}
        </Form.Group>
      </Form>
    );
  }

  const { clientConfig } = props;

  return (
    <div className="Category">
      <div className="page-header">
        <h1>Edit Category</h1>
        {category && (
          <div className="form-buttons">
            <LoaderButton
              onClick={() => handleSubmit(false)}
              size="lg"
              variant="outline-secondary"
              isLoading={isSavingDraft}
              disabled={!validateDraftForm()}
            >
              {category.categoryPublished ? 'Save & Unpublish' : 'Save Draft'}
            </LoaderButton>
            {items.filter((item) => item.itemPublished).length > 0 && (
              <LoaderButton
                onClick={() => handleSubmit(true)}
                size="lg"
                variant="outline-primary"
                isLoading={isSaving}
                disabled={!validatePublishForm()}
              >
                {category.categoryPublished ? 'Save' : 'Save & Publish'}
              </LoaderButton>
            )}
            <LoaderButton
              size="lg"
              variant="outline-danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete
            </LoaderButton>
          </div>
        )}
      </div>
      {!category ? <LoadingSpinner /> : (
        <>
          {items.filter((item) => item.itemPublished).length === 0 && (
            <p className="note">
              {`Categories can be moved out of Draft state once they have at least one published ${clientConfig.itemType}.`}
            </p>
          )}
          <div className="content">
            {renderCategoryDetails()}
            {renderItems()}
          </div>
        </>
      )}
    </div>
  );
}
