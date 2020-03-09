import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import Form from "react-bootstrap/Form";
import CreatableSelect from 'react-select/creatable';
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import "./Item.css";
import config from '../config';
import DraggablePhotosGrid from "../components/DraggablePhotosGrid";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Item(props) {
  const [item, setItem] = useState(null);
  const [categoryId, setCategoryId] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [itemsInCategory, setItemsInCategory] = useState([]);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemSalePrice, setItemSalePrice] = useState("");
  const [itemOnSale, setItemOnSale] = useState(false);
  const [itemSizes, setItemSizes] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [itemColors, setItemColors] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [itemTags, setItemTags] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [itemPhotos, setItemPhotos] = useState([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    function loadCategories() {
      return API.get("items-api", "/categories");
    }

    function loadItem() {
      return API.get("items-api", `/item/${props.match.params.id}`);
    }

    function loadTags() {
      return API.get("items-api", "/tags");
    }

    function loadTagsForItem() {
      return API.get("items-api", `/itemsToTags/${props.match.params.id}`);
    }

    function loadColors() {
      return API.get("items-api", "/colors");
    }

    function loadColorsForItem() {
      return API.get("items-api", `/itemsToColors/${props.match.params.id}`);
    }

    function loadSizes() {
      return API.get("items-api", "/sizes");
    }

    function loadSizesForItem() {
      return API.get("items-api", `/itemsToSizes/${props.match.params.id}`);
    }

    function loadPhotos() {
      return API.get("items-api", "/photos");
    }

    function loadPhotosForItem() {
      return API.get("items-api", `/itemsToPhotos/${props.match.params.id}`);
    }

    async function onLoad() {
      try {
        const [
          categories,
          item,
          tags,
          tagsForItem,
          colors,
          colorsForItem,
          sizes,
          sizesForItem,
          photos,
          photosForItem,
        ] = await Promise.all([
          loadCategories(),
          loadItem(),
          loadTags(),
          loadTagsForItem(),
          loadColors(),
          loadColorsForItem(),
          loadSizes(),
          loadSizesForItem(),
          loadPhotos(),
          loadPhotosForItem(),
        ]);
        const {
          categoryId,
          itemName,
          itemDescription,
          itemPrice,
          itemSalePrice,
          itemOnSale,
        } = item;

        const itemsInCategory = await API.get("items-api", `/items/${categoryId}`);

        if (photosForItem) {
          const itemPhotos = [];
          photosForItem.forEach((photoForItem) => {
            const fileName = photos.find(photo => photo.photoId === photoForItem.photoId).photoName;
            itemPhotos.push({ name: fileName, url: `${config.cloudfrontURL}/${clientConfig.userId}/${fileName}` });
          });
          setItemPhotos(itemPhotos);
        }

        setCategoryOptions(categories);
        setItemsInCategory(itemsInCategory);
        setCategoryId(categoryId);
        setItemName(itemName || "");
        setItemDescription(itemDescription || "");
        setItemPrice(itemPrice || "");
        setItemSalePrice(itemSalePrice || "");
        setItemOnSale(itemOnSale || "");
        setItem(item);

        const tagOptions = tags.map(tag => ({
          value: tag.tagId,
          label: tag.tagName,
        }));
        setTagOptions(tagOptions);
        const selectedTagOptions = tagsForItem.map(tagForItem => ({
          value: tagForItem.tagId,
          label: tags.find(tag => tag.tagId === tagForItem.tagId).tagName,
        }));
        setItemTags(selectedTagOptions);

        const colorOptions = colors.map(color => ({
          value: color.colorId,
          label: color.colorName,
        }));
        setColorOptions(colorOptions);
        const selectedColorOptions = colorsForItem.map(colorForItem => ({
          value: colorForItem.colorId,
          label: colors.find(color => color.colorId === colorForItem.colorId).colorName,
        }));
        setItemColors(selectedColorOptions);

        const sizeOptions = sizes.map(size => ({
          value: size.sizeId,
          label: size.sizeName,
        }));
        setSizeOptions(sizeOptions);
        const selectedSizeOptions = sizesForItem.map(sizeForItem => ({
          value: sizeForItem.sizeId,
          label: sizes.find(size => size.sizeId === sizeForItem.sizeId).sizeName,
        }));
        setItemSizes(selectedSizeOptions);
      } catch (e) {
        alert(e);
      }
    }

    onLoad();
  }, [props.match.params.id]);

  function validateDraftForm() {
    return itemName.length > 0;
  }

  function validatePublishForm() {
    return (
      itemName.length > 0
      && itemDescription.length > 0
      && itemPrice > 0
      && (!itemOnSale || itemSalePrice > 0)
      && (itemSizes && itemSizes.length > 0)
      && (itemColors && itemColors.length > 0)
      && (itemPhotos && itemPhotos.length > 0)
    );
  }

  function handleFileChange(event) {
    let i = 0;
    let nonImageFound = false;
    const files = Array.from(event.target.files);
    while (i < files.length && !nonImageFound) {
      const file = files[i];
      const splitFileName = file.name.toLowerCase().split('.');
      const fileExtension = splitFileName[splitFileName.length - 1];
      if (!["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
        nonImageFound = true;
      }
      i++;
    }
    if (nonImageFound) {
      alert(`Please upload image files only.`);
    } else {
      setItemPhotos(itemPhotos.concat(Array.from(event.target.files)));
    }
  }

  function saveItem(item) {
    return API.put("items-api", `/items/${props.match.params.id}`, {
      body: item
    });
  }

  async function saveTags() {
    return API.post("items-api", "/attributes", {
      body: {
        selectedIds: itemTags ? itemTags.map(tag => tag.value) : [],
        itemId: props.match.params.id,
        attributeType: 'tag',
      }
    });
  }

  async function saveColors() {
    return API.post("items-api", "/attributes", {
      body: {
        selectedIds: itemColors ? itemColors.map(color => color.value) : [],
        itemId: props.match.params.id,
        attributeType: 'color',
      }
    });
  }

  async function saveSizes() {
    return API.post("items-api", "/attributes", {
      body: {
        selectedIds: itemSizes ? itemSizes.map(size => size.value) : [],
        itemId: props.match.params.id,
        attributeType: 'size',
      }
    });
  }

  async function savePhotos(newItemPhotos) {
    return API.post("items-api", "/attributes", {
      body: {
        selectedIds: newItemPhotos.map(photo => photo.name),
        itemId: props.match.params.id,
        attributeType: 'photo',
      }
    });
  }

  function itemNameExists() {
    const lowercaseName = itemName.toLowerCase();
    const lowercaseNames = itemsInCategory.map((itemInCategory) => itemInCategory.itemName.toLowerCase());
    return lowercaseNames.includes(lowercaseName);
  }

  async function handleSubmit(itemPublished) {
    if (itemName.toLowerCase() !== item.itemName.toLowerCase() && itemNameExists()) {
      const { clientConfig } = props;
      window.alert(`A ${clientConfig.itemType} by this name already exists in this category.`);
      return;
    }
    let updatedItemPhotos = itemPhotos.map(itemPhoto => ({
      name: itemPhoto.name, url: itemPhoto.url,
    }));
    if (itemPhotos.length > 0) {
      const photoUploadPromises = [];
      itemPhotos.forEach((itemPhoto) => {
        if (itemPhoto.size) {
          photoUploadPromises.push(s3Upload(itemPhoto));
        }
      });
      if (itemPublished) {
        setIsSaving(true);
      } else {
        setIsSavingDraft(true);
      }
      const photoURLs = await Promise.all(photoUploadPromises);
      let photoURLsIndex = 0;
      itemPhotos.forEach((itemPhoto, index) => {
        if (itemPhoto.size) {
          updatedItemPhotos[index].name = photoURLs[photoURLsIndex];
          photoURLsIndex++;
        }
      });
    }

    if (itemPublished) {
      setIsSaving(true);
    } else {
      setIsSavingDraft(true);
    }

    try {
      await Promise.all([
        saveItem({
          itemName,
          itemDescription: itemDescription !== "" ? itemDescription : undefined,
          itemPrice: itemPrice !== "" ? itemPrice : undefined,
          itemSalePrice: itemSalePrice !== "" ? itemSalePrice : undefined,
          itemOnSale,
          itemPublished,
          categoryId,
          itemRank: item.itemRank,
        }),
        savePhotos(updatedItemPhotos),
        saveTags(),
        saveColors(),
        saveSizes(),
      ]);
      props.history.push(`/categories/${categoryId}`);
    } catch (e) {
      alert(e);
      setIsSaving(false);
      setIsSavingDraft(false);
    }
  }

  function deleteItem() {
    return API.del("items-api", `/items/${props.match.params.id}`);
  }

  async function handleDelete(event) {
    event.preventDefault();
    const { clientConfig } = props;
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${clientConfig.itemType}?`
    );
    if (!confirmed) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteItem();
      props.history.push(`/categories/${categoryId}`);
    } catch (e) {
      alert(e);
      setIsDeleting(false);
    }
  }

  function hasProhibitedCharacter(e) {
    return e.target.value.includes('_') || e.target.value.includes('?');
  }

  const { clientConfig } = props;

  return (
    <div className="Item">
      <div className="page-header">
        <h1>{`Edit ${clientConfig.itemType}`}</h1>
        {item && (
          <div className="form-buttons">
            <LoaderButton
              onClick={() => handleSubmit(false)}
              size="lg"
              variant="outline-secondary"
              isLoading={isSavingDraft}
              disabled={!validateDraftForm()}
            >
              {item.itemPublished ? 'Save & Unpublish' : 'Save Draft'}
            </LoaderButton>
            <LoaderButton
              onClick={() => handleSubmit(true)}
              size="lg"
              variant="outline-primary"
              isLoading={isSaving}
              disabled={!validatePublishForm()}
            >
              {item.itemPublished ? 'Save' : 'Save & Publish'}
            </LoaderButton>
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
      {!item ? <LoadingSpinner /> : (
        <Form>
          <div className="form-fields">
            <div className="left-half">
              <Form.Group controlId="categoryId">
                <Form.Label>Category</Form.Label>
                <Form.Control
                  value={categoryId}
                  as="select"
                  onChange={e => setCategoryId(e.target.value)}
                >
                  {categoryOptions.map(category => (
                    <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                  ))}
                </Form.Control>
              </Form.Group>
              <Form.Group controlId="itemName">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  value={itemName}
                  type="text"
                  onChange={e => !hasProhibitedCharacter(e) && setItemName(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="itemDescription">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  value={itemDescription}
                  as="textarea"
                  onChange={e => setItemDescription(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="itemPrice">
                <Form.Label>Price</Form.Label>
                <Form.Control
                  value={itemPrice}
                  type="number"
                  onChange={e => setItemPrice(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="itemSalePrice">
                <Form.Label>Sale Price</Form.Label>
                <Form.Control
                  value={itemSalePrice}
                  type="number"
                  onChange={e => setItemSalePrice(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="itemOnSale">
                <Form.Check
                  type="checkbox"
                  checked={itemOnSale}
                  onChange={e => setItemOnSale(e.target.checked)}
                  label="On Sale"
                />
              </Form.Group>
            </div>
            <div className="right-half">
              <Form.Group controlId="file">
                <Form.Label>Images</Form.Label>
                <Form.Control onChange={handleFileChange} type="file" multiple />
              </Form.Group>
              {itemPhotos && itemPhotos.length > 0 && (
                <DraggablePhotosGrid updateItems={setItemPhotos} items={itemPhotos} />
              )}
              <Form.Group controlId="itemSizes">
                <Form.Label>Sizes</Form.Label>
                <CreatableSelect
                  isMulti
                  onChange={setItemSizes}
                  options={sizeOptions}
                  placeholder=""
                  value={itemSizes}
                />
              </Form.Group>
              <Form.Group controlId="itemColors">
                <Form.Label>Colors</Form.Label>
                <CreatableSelect
                  isMulti
                  onChange={setItemColors}
                  options={colorOptions}
                  placeholder=""
                  value={itemColors}
                />
              </Form.Group>
              <Form.Group controlId="itemTags">
                <Form.Label>Tags</Form.Label>
                <CreatableSelect
                  isMulti
                  onChange={setItemTags}
                  options={tagOptions}
                  placeholder=""
                  value={itemTags}
                />
              </Form.Group>
            </div>
          </div>
        </Form>
      )}
    </div>
  );
}
