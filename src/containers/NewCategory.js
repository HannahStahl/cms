import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import Form from "react-bootstrap/Form";
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import "./NewCategory.css";
import { hasProhibitedCharacter } from "../libs/utilsLib";

export default function NewCategory(props) {
  const [pageConfig] = useState(
    props.clientConfig.find(configInList => configInList.id === props.match.params.configId)
  );
  const [file, setFile] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function onLoad() {
      const categories = await API.get("items-api", `/categories/${pageConfig.id}`);
      setCategories(categories);
    }
    onLoad();
  }, [pageConfig.id]);

  function validateForm() {
    return categoryName.length > 0;
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

  function categoryNameExists() {
    const lowercaseName = categoryName.toLowerCase();
    const lowercaseNames = categories.map((categoryInList) => categoryInList.categoryName.toLowerCase());
    return lowercaseNames.includes(lowercaseName);
  }

  async function handleSubmit() {
    if (categoryNameExists()) {
      window.alert('A category by this name already exists.');
      return;
    }
    setIsLoading(true);
    try {
      const categoryPhoto = file ? await s3Upload(file) : null;
      await createCategory({
        categoryName, categoryPhoto,
        categoryRank: categories.length > 0 ? (categories[categories.length - 1].categoryRank + 1) : 0,
        cmsPageConfigId: pageConfig.id
      });
      if (props.clientConfig.length > 1) {
        props.history.push(`/${pageConfig.itemType.replace(/ /g, '_')}s`);
      } else {
        props.history.push("/");
      }
    } catch (e) {
      alert(e);
      setIsLoading(false);
    }
  }

  function createCategory(category) {
    return API.post("items-api", "/categories", {
      body: category
    });
  }

  return (
    <div className="NewCategory">
      <div className="page-header">
        <h1>Create Category</h1>
        <div className="form-buttons">
          <LoaderButton
            type="submit"
            size="lg"
            variant="outline-secondary"
            isLoading={isLoading}
            disabled={!validateForm()}
            onClick={handleSubmit}
          >
            Save Draft
          </LoaderButton>
        </div>
      </div>
      <p className="note">
        {`Categories can be moved out of Draft state once they have at least one published ${pageConfig.itemType}.`}
      </p>
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
          {file && (
            <Form.Text>
              <img
                src={URL.createObjectURL(file)}
                alt="Category Img"
                height={150}
              />
            </Form.Text>
          )}
        </Form.Group>
      </Form>
    </div>
  );
}
