import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Modal from 'react-bootstrap/Modal';
import { API } from "aws-amplify";
import config from '../config';
import "./DraggableItemsList.css";
import LoaderButton from "./LoaderButton";

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const getItemStyle = (isDragging, draggableStyle) => ({
  background: isDragging ? "#eee" : "white", ...draggableStyle
});

export default function DraggableItemsList({
  originalItems, itemType, itemTypePlural, newItemURL, short, clientConfig, unsavedChanges,
}) {
  const [showModal, setShowModal] = useState(false);
  const [link, setLink] = useState(undefined);
  const [items, setItems] = useState(originalItems);
  useEffect(() => { setItems(originalItems); }, [originalItems])

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const updatedItems = reorder(items, result.source.index, result.destination.index);
    const promises = [];
    updatedItems.forEach((item, index) => {
      promises.push(API.put("items-api", `/${itemTypePlural}/${item[`${itemType}Id`]}`, {
        body: { ...item, [`${itemType}Rank`]: index }
      }));
    });
    Promise.all(promises).then((results) => {
      const successfulResults = results.filter(result => result.status === true);
      if (successfulResults.length < results.length) {
        console.log('Error saving new order');
      } else {
        console.log(`Order of ${itemTypePlural} saved!`);
      }
    });
    setItems(updatedItems);
  }

  const onLinkClick = (link) => {
    if (unsavedChanges) {
      setLink(link);
      setShowModal(true);
    } else {
      window.location.pathname = link;
    }
  };

  return (
    <div className="DraggableItemsList">
      <div className="item">
        <div className="item-name new-item" onClick={() => onLinkClick(newItemURL)}>
          <h4>{`+ Create new ${itemType}`}</h4>
        </div>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {items.map((item, index) => (
                <Draggable key={item[`${itemType}Id`]} draggableId={item[`${itemType}Id`]} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                      className="item"
                    >
                      <div onClick={() => onLinkClick(`/${itemTypePlural}/${item[`${itemType}Id`]}`)}>
                        <img
                          className="item-photo"
                          alt={item[`${itemType}Name`]}
                          src={item[`${itemType}Photo`] ? (
                            `${config.cloudfrontURL}/${clientConfig.userId}/${item[`${itemType}Photo`]}`
                          ) : `${process.env.PUBLIC_URL}/placeholder.jpg`}
                        />
                      </div>
                      <div
                        className="item-name"
                        onClick={() => onLinkClick(`/${itemTypePlural}/${item[`${itemType}Id`]}`)}
                      >
                        <h4 className={short ? 'short' : ''}>{item[`${itemType}Name`]}</h4>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Body>You are about to navigate to a new page. Do you wish to continue without saving your changes?</Modal.Body>
        <Modal.Footer>
          <LoaderButton variant="outline-secondary" onClick={() => setShowModal(false)}>
            No
          </LoaderButton>
          <LoaderButton variant="outline-primary" onClick={() => { window.location.pathname = link; }}>
            Yes
          </LoaderButton>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
