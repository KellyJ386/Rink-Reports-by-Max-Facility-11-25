'use client'

import type { FieldType, FieldTypeConfig, FormField } from '../types'
import { TextFieldRender, TextFieldEdit, TextareaFieldRender, TextareaFieldEdit } from './TextField'
import { NumberFieldRender, NumberFieldEdit } from './NumberField'
import { SelectFieldRender, SelectFieldEdit } from './SelectField'
import {
  CheckboxFieldRender,
  CheckboxFieldEdit,
  CheckboxGroupFieldRender,
  CheckboxGroupFieldEdit,
  RadioGroupFieldRender,
  RadioGroupFieldEdit,
} from './CheckboxField'
import {
  DateFieldRender,
  DateFieldEdit,
  TimeFieldRender,
  TimeFieldEdit,
  DateTimeFieldRender,
  DateTimeFieldEdit,
} from './DateTimeField'
import { SignatureFieldRender, SignatureFieldEdit, PhotoFieldRender, PhotoFieldEdit } from './MediaFields'
import { SectionFieldRender, SectionFieldEdit } from './SectionField'
import { IceDepthGridFieldRender, IceDepthGridFieldEdit } from './IceDepthGridField'
import { BodyDiagramFieldRender, BodyDiagramFieldEdit } from './BodyDiagramField'
import { WeatherFieldRender, WeatherFieldEdit } from './WeatherField'

// Field type icons as SVG components
const icons = {
  text: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  textarea: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  ),
  number: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  ),
  email: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  phone: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  select: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
    </svg>
  ),
  checkbox: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  checkboxGroup: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  radioGroup: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  date: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  time: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  datetime: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  signature: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  photo: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    </svg>
  ),
  iceDepthGrid: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  bodyDiagram: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  section: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
  ),
  weather: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  ),
  calculated: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  temperature: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9V3m0 0L9 6m3-3l3 3M12 21a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  ),
  measurement: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  ),
}

// Field type registry
export const fieldRegistry: Record<FieldType, FieldTypeConfig> = {
  text: {
    type: 'text',
    label: 'Text',
    icon: icons.text,
    category: 'basic',
    defaultField: { label: 'Text Field', placeholder: 'Enter text...' },
    EditComponent: TextFieldEdit,
    RenderComponent: TextFieldRender,
  },
  textarea: {
    type: 'textarea',
    label: 'Long Text',
    icon: icons.textarea,
    category: 'basic',
    defaultField: { label: 'Long Text', placeholder: 'Enter detailed text...' },
    EditComponent: TextareaFieldEdit,
    RenderComponent: TextareaFieldRender,
  },
  number: {
    type: 'number',
    label: 'Number',
    icon: icons.number,
    category: 'basic',
    defaultField: { label: 'Number', placeholder: '0' },
    EditComponent: NumberFieldEdit,
    RenderComponent: NumberFieldRender,
  },
  email: {
    type: 'email',
    label: 'Email',
    icon: icons.email,
    category: 'basic',
    defaultField: { label: 'Email', placeholder: 'email@example.com' },
    EditComponent: TextFieldEdit,
    RenderComponent: TextFieldRender,
  },
  phone: {
    type: 'phone',
    label: 'Phone',
    icon: icons.phone,
    category: 'basic',
    defaultField: { label: 'Phone', placeholder: '(555) 123-4567' },
    EditComponent: TextFieldEdit,
    RenderComponent: TextFieldRender,
  },
  select: {
    type: 'select',
    label: 'Dropdown',
    icon: icons.select,
    category: 'choice',
    defaultField: {
      label: 'Select Option',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ],
    },
    EditComponent: SelectFieldEdit,
    RenderComponent: SelectFieldRender,
  },
  checkbox: {
    type: 'checkbox',
    label: 'Checkbox',
    icon: icons.checkbox,
    category: 'choice',
    defaultField: { label: 'I agree to the terms' },
    EditComponent: CheckboxFieldEdit,
    RenderComponent: CheckboxFieldRender,
  },
  checkboxGroup: {
    type: 'checkboxGroup',
    label: 'Checkbox Group',
    icon: icons.checkboxGroup,
    category: 'choice',
    defaultField: {
      label: 'Select all that apply',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
      ],
    },
    EditComponent: CheckboxGroupFieldEdit,
    RenderComponent: CheckboxGroupFieldRender,
  },
  radioGroup: {
    type: 'radioGroup',
    label: 'Radio Group',
    icon: icons.radioGroup,
    category: 'choice',
    defaultField: {
      label: 'Choose one',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
      ],
    },
    EditComponent: RadioGroupFieldEdit,
    RenderComponent: RadioGroupFieldRender,
  },
  date: {
    type: 'date',
    label: 'Date',
    icon: icons.date,
    category: 'date',
    defaultField: { label: 'Date' },
    EditComponent: DateFieldEdit,
    RenderComponent: DateFieldRender,
  },
  time: {
    type: 'time',
    label: 'Time',
    icon: icons.time,
    category: 'date',
    defaultField: { label: 'Time' },
    EditComponent: TimeFieldEdit,
    RenderComponent: TimeFieldRender,
  },
  datetime: {
    type: 'datetime',
    label: 'Date & Time',
    icon: icons.datetime,
    category: 'date',
    defaultField: { label: 'Date & Time' },
    EditComponent: DateTimeFieldEdit,
    RenderComponent: DateTimeFieldRender,
  },
  signature: {
    type: 'signature',
    label: 'Signature',
    icon: icons.signature,
    category: 'media',
    defaultField: { label: 'Signature', required: true },
    EditComponent: SignatureFieldEdit,
    RenderComponent: SignatureFieldRender,
  },
  photo: {
    type: 'photo',
    label: 'Photo',
    icon: icons.photo,
    category: 'media',
    defaultField: { label: 'Photo' },
    EditComponent: PhotoFieldEdit,
    RenderComponent: PhotoFieldRender,
  },
  iceDepthGrid: {
    type: 'iceDepthGrid',
    label: 'Ice Depth Grid',
    icon: icons.iceDepthGrid,
    category: 'special',
    defaultField: { label: 'Ice Depth Measurements', required: true },
    EditComponent: IceDepthGridFieldEdit,
    RenderComponent: IceDepthGridFieldRender,
  },
  bodyDiagram: {
    type: 'bodyDiagram',
    label: 'Body Diagram',
    icon: icons.bodyDiagram,
    category: 'special',
    defaultField: { label: 'Injury Location', bodyDiagramConfig: { view: 'front', markers: [] } },
    EditComponent: BodyDiagramFieldEdit,
    RenderComponent: BodyDiagramFieldRender,
  },
  section: {
    type: 'section',
    label: 'Section Header',
    icon: icons.section,
    category: 'layout',
    defaultField: { label: 'Section Title' },
    EditComponent: SectionFieldEdit,
    RenderComponent: SectionFieldRender,
  },
  weather: {
    type: 'weather',
    label: 'Weather',
    icon: icons.weather,
    category: 'special',
    defaultField: { label: 'Current Weather', weatherConfig: { autoFetch: true, units: 'imperial', fields: ['temperature', 'humidity', 'conditions', 'wind'] } },
    EditComponent: WeatherFieldEdit,
    RenderComponent: WeatherFieldRender,
  },
  calculated: {
    type: 'calculated',
    label: 'Calculated',
    icon: icons.calculated,
    category: 'special',
    defaultField: { label: 'Calculated Value', calculatedConfig: { operation: 'sum', sourceFields: [], formula: '', decimalPlaces: 2 } },
    EditComponent: NumberFieldEdit,
    RenderComponent: NumberFieldRender,
  },
  temperature: {
    type: 'temperature',
    label: 'Temperature',
    icon: icons.temperature,
    category: 'special',
    defaultField: { label: 'Temperature', placeholder: '0', measurementConfig: { unit: '°F', precision: 1 } },
    EditComponent: NumberFieldEdit,
    RenderComponent: NumberFieldRender,
  },
  measurement: {
    type: 'measurement',
    label: 'Measurement',
    icon: icons.measurement,
    category: 'special',
    defaultField: { label: 'Measurement', placeholder: '0', measurementConfig: { unit: 'in', precision: 2 } },
    EditComponent: NumberFieldEdit,
    RenderComponent: NumberFieldRender,
  },
}

// Get fields by category
export function getFieldsByCategory() {
  const categories = {
    basic: [] as FieldTypeConfig[],
    choice: [] as FieldTypeConfig[],
    date: [] as FieldTypeConfig[],
    media: [] as FieldTypeConfig[],
    special: [] as FieldTypeConfig[],
    layout: [] as FieldTypeConfig[],
  }

  Object.values(fieldRegistry).forEach((config) => {
    categories[config.category].push(config)
  })

  return categories
}

// Create a new field with default values
export function createField(type: FieldType): FormField {
  const config = fieldRegistry[type]
  return {
    id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    label: config.defaultField.label || type,
    ...config.defaultField,
  }
}

// Export individual components for direct use
export {
  TextFieldRender,
  TextFieldEdit,
  TextareaFieldRender,
  TextareaFieldEdit,
  NumberFieldRender,
  NumberFieldEdit,
  SelectFieldRender,
  SelectFieldEdit,
  CheckboxFieldRender,
  CheckboxFieldEdit,
  CheckboxGroupFieldRender,
  CheckboxGroupFieldEdit,
  RadioGroupFieldRender,
  RadioGroupFieldEdit,
  DateFieldRender,
  DateFieldEdit,
  TimeFieldRender,
  TimeFieldEdit,
  DateTimeFieldRender,
  DateTimeFieldEdit,
  SignatureFieldRender,
  SignatureFieldEdit,
  PhotoFieldRender,
  PhotoFieldEdit,
  SectionFieldRender,
  SectionFieldEdit,
  IceDepthGridFieldRender,
  IceDepthGridFieldEdit,
  BodyDiagramFieldRender,
  BodyDiagramFieldEdit,
  WeatherFieldRender,
  WeatherFieldEdit,
}
