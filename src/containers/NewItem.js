import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import Form from "react-bootstrap/Form";
import CreatableSelect from 'react-select/creatable';
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import "./NewItem.css";
import DraggablePhotosGrid from '../components/DraggablePhotosGrid';

export default function NewItem(props) {
  const [pageConfig] = useState(
    props.clientConfig.find(configInList => configInList.id === props.match.params.configId)
  );
  const [categoryId, setCategoryId] = useState(props.match.params.categoryId);
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

  useEffect(() => {
    function loadCategories() {
      return API.get("items-api", `/categories/${pageConfig.id}`);
    }

    function loadItems() {
      if (pageConfig.categorized) {
        return API.get("items-api", `/items/${categoryId}`);
      }
      return API.get("items-api", `/itemsOfSpecifiedType/${pageConfig.id}`);
    }

    function loadTags() {
      return API.get("items-api", "/tags");
    }

    function loadColors() {
      return API.get("items-api", "/colors");
    }

    function loadSizes() {
      return API.get("items-api", "/sizes");
    }

    async function onLoad() {
      try {
        const [categories, itemsInCategory, tags, colors, sizes] = await Promise.all([
          loadCategories(), loadItems(), loadTags(), loadColors(), loadSizes(),
        ]);

        setCategoryOptions(categories);

        setItemsInCategory(itemsInCategory);

        const tagOptions = tags.map(tag => ({
          value: tag.tagId,
          label: tag.tagName,
        }));
        setTagOptions(tagOptions);

        const colorOptions = colors.map(color => ({
          value: color.colorId,
          label: color.colorName,
        }));
        setColorOptions(colorOptions);

        const sizeOptions = sizes.map(size => ({
          value: size.sizeId,
          label: size.sizeName,
        }));
        setSizeOptions(sizeOptions);
      } catch (e) {
        alert(e);
      }
    }

    onLoad();
  }, [pageConfig, categoryId]);

  function validateDraftForm() {
    return itemName.length > 0;
  }

  function validatePublishForm() {
    return (
      itemName.length > 0
      && itemDescription.length > 0
      && (itemPhotos && itemPhotos.length > 0)
      && (!pageConfig.price || (itemPrice > 0))
      && (!pageConfig.sale || !itemOnSale || itemSalePrice > 0)
      && (!pageConfig.sizes || (itemSizes && itemSizes.length > 0))
      && (!pageConfig.colors || (itemColors && itemColors.length > 0))
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
      if (pageConfig.multiplePhotos) {
        setItemPhotos(itemPhotos.concat(files));
      } else {
        setItemPhotos(files);
      }
    }
  }

  function itemNameExists() {
    const lowercaseName = itemName.toLowerCase();
    const lowercaseNames = itemsInCategory.map((itemInCategory) => itemInCategory.itemName.toLowerCase());
    return lowercaseNames.includes(lowercaseName);
  }

  async function handleSubmit(itemPublished) {
    if (itemNameExists()) {
      window.alert(`A ${pageConfig.itemType} by this name already exists${pageConfig.categorized ? ' in this category' : ''}.`);
      return;
    }
    let updatedItemPhotos = itemPhotos.map(itemPhoto => ({
      name: itemPhoto.name, url: itemPhoto.url,
    }));
    if (itemPhotos.length > 0) {
      const photoUploadPromises = [];
      itemPhotos.forEach((itemPhoto) => {
        photoUploadPromises.push(s3Upload(itemPhoto));
      });
      if (itemPublished) {
        setIsSaving(true);
      } else {
        setIsSavingDraft(true);
      }
      const photoURLs = await Promise.all(photoUploadPromises);
      let photoURLsIndex = 0;
      itemPhotos.forEach((itemPhoto, index) => {
        updatedItemPhotos[index].name = photoURLs[photoURLsIndex];
        photoURLsIndex++;
      });
    }

    if (itemPublished) {
      setIsSaving(true);
    } else {
      setIsSavingDraft(true);
    }

    try {
      const newItem = await createItem({
        itemName,
        itemDescription: itemDescription !== "" ? itemDescription : undefined,
        itemPrice: itemPrice !== "" ? itemPrice : undefined,
        itemSalePrice: itemSalePrice !== "" ? itemSalePrice : undefined,
        itemOnSale,
        itemPublished,
        categoryId: pageConfig.categorized ? categoryId : undefined,
        itemRank: itemsInCategory.length > 0 ? (itemsInCategory[itemsInCategory.length - 1].itemRank + 1) : 0,
        cmsPageConfigId: pageConfig.id,
      });
      await Promise.all([
        saveTags(newItem.itemId),
        saveColors(newItem.itemId),
        saveSizes(newItem.itemId),
        savePhotos(newItem.itemId, updatedItemPhotos),
      ]);
      if (pageConfig.categorized) {
        props.history.push(`/categories/${categoryId}`);
      } else if (props.clientConfig.length > 1) {
        props.history.push(`/${pageConfig.itemType.replace(/ /g, '_')}s`);
      } else {
        props.history.push('/');
      }
    } catch (e) {
      alert(e);
      setIsSaving(false);
      setIsSavingDraft(false);
    }
  }

  function createItem(item) {
    return API.post("items-api", "/items", {
      body: item
    });
  }

  async function saveTags(itemId) {
    return API.post("items-api", "/attributes", {
      body: {
        selectedIds: itemTags ? itemTags.map(tag => tag.value) : [],
        itemId,
        attributeType: 'tag',
      }
    });
  }

  async function saveColors(itemId) {
    return API.post("items-api", "/attributes", {
      body: {
        selectedIds: itemColors ? itemColors.map(color => color.value) : [],
        itemId,
        attributeType: 'color',
      }
    });
  }

  async function saveSizes(itemId) {
    return API.post("items-api", "/attributes", {
      body: {
        selectedIds: itemSizes ? itemSizes.map(size => size.value) : [],
        itemId,
        attributeType: 'size',
      }
    });
  }

  async function savePhotos(itemId, newItemPhotos) {
    return API.post("items-api", "/attributes", {
      body: {
        selectedIds: newItemPhotos.map(photo => photo.name),
        itemId,
        attributeType: 'photo',
      }
    });
  }

  function hasProhibitedCharacter(e) {
    return e.target.value.includes('_') || e.target.value.includes('?');
  }

  return (
    <div className="NewItem">
      <div className="page-header">
        <h1>{`Create ${pageConfig.itemType}`}</h1>
        <div className="form-buttons">
          <LoaderButton
            onClick={() => handleSubmit(false)}
            size="lg"
            variant="outline-secondary"
            isLoading={isSavingDraft}
            disabled={!validateDraftForm()}
          >
            Save Draft
          </LoaderButton>
          <LoaderButton
            onClick={() => handleSubmit(true)}
            size="lg"
            variant="outline-primary"
            isLoading={isSaving}
            disabled={!validatePublishForm()}
          >
            Publish
          </LoaderButton>
        </div>
      </div>
      <Form>
        <div className="form-fields">
          <div className="left-half">
            {pageConfig.categorized && (
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
            )}
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
            {pageConfig.price && (
              <Form.Group controlId="itemPrice">
                <Form.Label>Price</Form.Label>
                <Form.Control
                  value={itemPrice}
                  type="number"
                  onChange={e => setItemPrice(e.target.value)}
                />
              </Form.Group>
            )}
            {pageConfig.sale && (
              <>
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
              </>
            )}
          </div>
          <div className="right-half">
            <Form.Group controlId="file">
              <Form.Label>
                {`Image${pageConfig.multiplePhotos ? 's' : ''}`}
              </Form.Label>
              <Form.Control
                onChange={handleFileChange}
                type="file"
                multiple={pageConfig.multiplePhotos}
              />
            </Form.Group>
            {itemPhotos && itemPhotos.length > 0 && (
              <DraggablePhotosGrid updateItems={setItemPhotos} items={itemPhotos} />
            )}
            {pageConfig.sizes && (
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
            )}
            {pageConfig.colors && (
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
            )}
            {pageConfig.tags && (
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
            )}
          </div>
        </div>
      </Form>
    </div>
  );
}
