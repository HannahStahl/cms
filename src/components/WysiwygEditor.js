import React, { useState } from 'react';
import RichTextEditor from 'react-rte';
import './WysiwygEditor.css';
 
export default function TextEditor(props) {
  const [value, setValue] = useState(RichTextEditor.createValueFromString(props.value, 'html'));
 
  const onChange = (value) => {
    setValue(value);
    if (props.onChange) props.onChange(value.toString('html'));
  };
 
  return <RichTextEditor value={value} onChange={onChange} />;
}
