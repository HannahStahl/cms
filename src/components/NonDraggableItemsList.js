import React from "react";
import config from '../config';
import "./NonDraggableItemsList.css";
import DraftLabel from './DraftLabel';

export default function NonDraggableItemsList({
  items, itemType, itemTypePlural, newItemURL, short, clientConfig,
}) {
  const sortedItems = items.sort((a, b) => {
    if (a.itemPublished && b.itemPublished) {
      if (a.datePublished > b.datePublished) return -1;
      if (b.datePublished > a.datePublished) return 1;
      return 0;
    }
    if (a.itemPublished) return 1;
    if (b.itemPublished) return -1;
    if (a.updatedAt > b.updatedAt) return -1;
    if (b.updatedAt > a.updatedAt) return 1;
    return 0;
  });

  return (
    <div className="NonDraggableItemsList">
      <div className="item">
        <a className="item-name new-item" href={newItemURL}>
          <h4>{`+ Create new ${itemType}`}</h4>
        </a>
      </div>
      {sortedItems.map((item, index) => (
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
            {!item.itemPublished && <DraftLabel />}
          </div>
        </div>
      ))}
    </div>
  );
}
