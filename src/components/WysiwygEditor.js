import React, { useState } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './WysiwygEditor.css';
import { s3Upload } from '../libs/awsLib';
import config from '../config';
 
export default function TextEditor(props) {
  let startState;
  if (props.value) {
    startState = EditorState.createWithContent(
      ContentState.createFromBlockArray(htmlToDraft(props.value).contentBlocks)
    );
  } else {
    startState = EditorState.createEmpty();
  }
  const [value, setValue] = useState(startState);
 
  const onChange = (value) => {
    setValue(value);
    if (props.onChange) props.onChange(draftToHtml(convertToRaw(value.getCurrentContent())));
  };

  const onImageUpload = (file) => {
    return s3Upload(file).then((fileName) => {
      const link = `${config.cloudfrontURL}/${props.clientConfig.userId}/${fileName}`;
      return ({ data: { link } });
    });
  }
 
  return (
    <Editor
      editorState={value}
      onEditorStateChange={onChange}
      wrapperClassName="wysiwyg-editor"
      toolbarClassName="wysiwyg-editor-toolbar"
      editorClassName="wysiwyg-editor-content"
      toolbar={{
        image: {
          uploadCallback: onImageUpload,
          previewImage: true,
          defaultSize: { width: '100%', height: 'auto' }
        }
      }}
    />
  );
}
