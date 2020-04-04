import React from "react";
import config from '../config';
import "./NonDraggableItemsList.css";

export default function NonDraggableItemsList({
  items, itemType, itemTypePlural, newItemURL, short, clientConfig,
}) {
  return (
    <div className="NonDraggableItemsList">
      <div className="item">
        <a className="item-name new-item" href={newItemURL}>
          <h4>{`+ Create new ${itemType}`}</h4>
        </a>
      </div>
      {items.map((item, index) => (
        <div key={item[`${itemType}Id`]} index={index}>
          <div className="item">
            <a href={`/${itemTypePlural}/${item[`${itemType}Id`]}`}>
              <img
                className="item-photo"
                alt={item[`${itemType}Name`]}
                src={item[`${itemType}Photo`] ? (
                  `${config.cloudfrontURL}/${clientConfig.userId}/${item[`${itemType}Photo`]}`
                ) : `${process.env.PUBLIC_URL}/placeholder.jpg`}
              />
            </a>
            <a
              className="item-name"
              href={`/${itemTypePlural}/${item[`${itemType}Id`]}`}
            >
              <h4 className={short ? 'short' : ''}>{item[`${itemType}Name`]}</h4>
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
