# New Widget Scaffold

Scaffold a new chat widget component for the Medgulf Smart Assistant.

## Instructions

Create a new widget in `src/components/widgets/` following the rules below.

The widget name is: **$ARGUMENTS**

## Required Structure

Every widget must follow this exact pattern:

```jsx
// src/components/widgets/{WidgetName}.jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function {WidgetName}({ payload, onSubmit }) {
  const { t } = useTranslation()
  const [submitted, setSubmitted] = useState(false)
  const [value, setValue] = useState(/* initial state from payload */)

  const handleSubmit = () => {
    // 1. Client-side validation first — never call onSubmit with invalid data
    // 2. setSubmitted(true) — widget becomes read-only
    // 3. onSubmit({ ...data }) — passes data up, never calls webhookService directly
    setSubmitted(true)
    onSubmit({ /* structured data */ })
  }

  if (submitted) {
    return (
      <div className="widget-confirmed">
        {/* Read-only confirmed state with checkmark */}
      </div>
    )
  }

  return (
    <div className="widget-active rtl:text-right">
      {/* Active interactive state */}
    </div>
  )
}
```

## Rules to enforce
1. Props are always `{ payload, onSubmit }` — nothing else from context/store
2. Widget becomes read-only (submitted view) after onSubmit is called — no going back
3. All strings via `t('widgetName.key')` — add keys to BOTH en.json and ar.json
4. Tailwind RTL variants (`rtl:`) for any directional styling
5. Client-side validation inline, not in a separate validator file
6. No direct calls to webhookService — onSubmit only

## After creating the component
1. Add it to the MessageFactory map in `src/components/chat/MessageFactory.jsx`
2. Add the translation keys to `src/locales/en.json` and `src/locales/ar.json`
3. Create a mock payload fixture in `src/mock/n8n/{widget-name}-response.json`
