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
import WysiwygEditor from "../components/WysiwygEditor";

export default function Item(props) {
  const [pageConfig, setPageConfig] = useState({});
  const [item, setItem] = useState(null);
  const [categoryId, setCategoryId] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [itemsInCategory, setItemsInCategory] = useState([]);
  const [itemName, setItemName] = useState("");
  const [itemLink, setItemLink] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemHtml, setItemHtml] = useState("");
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
    function loadItem() {
      return API.get("items-api", `/item/${props.match.params.id}`);
    }

    function loadCategories(cmsPageConfigId) {
      return API.get("items-api", `/categories/${cmsPageConfigId}`);
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

    function loadItemsInCategory(categoryId, cmsPageConfigId) {
      if (pageConfig.categorized) {
        return API.get("items-api", `/items/${categoryId}`);
      }
      return API.get("items-api", `/itemsOfSpecifiedType/${cmsPageConfigId}`);
    }

    async function onLoad() {
      try {
        const item = await loadItem();
        const pageConfig = props.clientConfig.find(configInList => configInList.id === item.cmsPageConfigId);
        const [
          categories,
          tags,
          tagsForItem,
          colors,
          colorsForItem,
          sizes,
          sizesForItem,
          photos,
          photosForItem,
          itemsInCategory,
        ] = await Promise.all([
          loadCategories(pageConfig.id),
          loadTags(),
          loadTagsForItem(),
          loadColors(),
          loadColorsForItem(),
          loadSizes(),
          loadSizesForItem(),
          loadPhotos(),
          loadPhotosForItem(),
          loadItemsInCategory(item.categoryId, pageConfig.id),
        ]);
        const {
          categoryId,
          itemName,
          itemLink,
          itemDescription,
          itemHtml,
          itemPrice,
          itemSalePrice,
          itemOnSale,
        } = item;

        if (photosForItem) {
          const itemPhotos = [];
          photosForItem.forEach((photoForItem) => {
            const fileName = photos.find(photo => photo.photoId === photoForItem.photoId).photoName;
            itemPhotos.push({ name: fileName, url: `${config.cloudfrontURL}/${pageConfig.userId}/${fileName}` });
          });
          setItemPhotos(itemPhotos);
        }

        setPageConfig(pageConfig);
        setCategoryOptions(categories);
        setItemsInCategory(itemsInCategory);
        setCategoryId(categoryId);
        setItemName(itemName || "");
        setItemLink(itemLink || "");
        setItemDescription(itemDescription || "");
        setItemHtml(itemHtml || "");
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
  }, [props, pageConfig]);

  function validateDraftForm() {
    return itemName.length > 0;
  }

  function validatePublishForm() {
    return (
      (!pageConfig.name || itemName.length > 0)
      && (!pageConfig.link || itemLink.length > 0)
      && (!pageConfig.description || itemDescription.length > 0)
      && (!pageConfig.html || itemHtml.length > 0)
      && (!pageConfig.photo || (itemPhotos && itemPhotos.length > 0))
      && (!pageConfig.price || itemPrice > 0)
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
      window.alert(`A ${pageConfig.itemType} by this name already exists${pageConfig.categorized ? ' in this category' : ''}.`);
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

    let itemRank = item.itemRank;
    if (categoryId !== item.categoryId) {
      itemRank = itemsInCategory.length > 0 ? (itemsInCategory[itemsInCategory.length - 1].itemRank + 1) : 0;
    }

    try {
      await Promise.all([
        saveItem({
          itemName,
          itemLink: itemLink !== "" ? itemLink : undefined,
          itemDescription: itemDescription !== "" ? itemDescription : undefined,
          itemHtml: itemHtml !== "" ? itemHtml : undefined,
          itemPrice: itemPrice !== "" ? itemPrice : undefined,
          itemSalePrice: itemSalePrice !== "" ? itemSalePrice : undefined,
          itemOnSale,
          itemPublished,
          categoryId,
          itemRank,
          cmsPageConfigId: item.cmsPageConfigId,
        }),
        savePhotos(updatedItemPhotos),
        saveTags(),
        saveColors(),
        saveSizes(),
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

  function deleteItem() {
    return API.del("items-api", `/items/${props.match.params.id}`);
  }

  async function handleDelete(event) {
    event.preventDefault();
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${pageConfig.itemType}?`
    );
    if (!confirmed) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteItem();
      if (pageConfig.categorized) {
        props.history.push(`/categories/${categoryId}`);
      } else if (props.clientConfig.length > 1) {
        props.history.push(`/${pageConfig.itemType.replace(/ /g, '_')}s`);
      } else {
        props.history.push('/');
      }
    } catch (e) {
      alert(e);
      setIsDeleting(false);
    }
  }

  function hasProhibitedCharacter(e) {
    return e.target.value.includes('_') || e.target.value.includes('?');
  }

  async function updateCategoryId(newCategoryId) {
    setCategoryId(newCategoryId);
    setItemsInCategory(await API.get("items-api", `/items/${newCategoryId}`));
  }

  return (
    <div className="Item">
      {item && (
        <div className="page-header">
          <h1>{`Edit ${pageConfig.itemType}`}</h1>
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
        </div>
      )}
      {!item ? <LoadingSpinner /> : (
        <Form>
          <div className="form-fields">
            <div className={pageConfig.html ? 'full-width' : 'left-half'}>
              {pageConfig.categorized && (
                <Form.Group controlId="categoryId">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    value={categoryId}
                    as="select"
                    onChange={e => updateCategoryId(e.target.value)}
                  >
                    {categoryOptions.map(category => (
                      <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                    ))}
                  </Form.Control>
                </Form.Group>
              )}
              {pageConfig.html && pageConfig.photo && (
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
              )}
              {pageConfig.html && pageConfig.photo && itemPhotos && itemPhotos.length > 0 && (
                <DraggablePhotosGrid updateItems={setItemPhotos} items={itemPhotos} />
              )}
              {pageConfig.name && (
                <Form.Group controlId="itemName">
                  <Form.Label>{pageConfig.title ? 'Title' : 'Name'}</Form.Label>
                  <Form.Control
                    value={itemName}
                    type="text"
                    onChange={e => !hasProhibitedCharacter(e) && setItemName(e.target.value)}
                  />
                </Form.Group>
              )}
              {pageConfig.link && (
                <Form.Group controlId="itemLink">
                  <Form.Label>Link</Form.Label>
                  <Form.Control
                    value={itemLink}
                    type="text"
                    onChange={e => setItemLink(e.target.value)}
                  />
                </Form.Group>
              )}
              {pageConfig.description && (
                <Form.Group controlId="itemDescription">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    value={itemDescription}
                    as="textarea"
                    onChange={e => setItemDescription(e.target.value)}
                  />
                </Form.Group>
              )}
              {pageConfig.html && (
                <Form.Group controlId="itemHtml">
                  <Form.Label>Content</Form.Label>
                  <WysiwygEditor
                    value={itemHtml}
                    onChange={setItemHtml}
                  />
                </Form.Group>
              )}
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
            {!pageConfig.html && (
              <div className="right-half">
                {!pageConfig.html && pageConfig.photo && (
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
                )}
                {!pageConfig.html && pageConfig.photo && itemPhotos && itemPhotos.length > 0 && (
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
            )}
          </div>
        </Form>
      )}
    </div>
  );
}
