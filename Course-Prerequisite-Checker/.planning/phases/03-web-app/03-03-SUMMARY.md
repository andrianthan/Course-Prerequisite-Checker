---
plan: "03-03"
phase: 03-web-app
status: complete
date: 2026-04-24
---

# 03-03 Summary — Upload UI + Transcript Confirm

## Components Added

### UploadCard.jsx
- Path: `frontend/src/components/UploadCard.jsx`
- Drag-and-drop PDF upload zone with three visual states: idle (dashed gray border), dragging (indigo border/bg), loading (spinner + "Parsing transcript…"), error (red border + message below)
- Props: `onUpload(file)`, `loading: bool`, `error: string|null`
- Covers UI-01: Upload Card spec

### CourseList.jsx
- Path: `frontend/src/components/CourseList.jsx`
- Controlled editable table: course_id in indigo monospace, grade shown as color-coded badge (green/amber/red)
- Inline edit via pencil icon — opens input + grade dropdown, Enter or Save commits
- Delete via X icon (hover-reveal)
- "+ Add course" button appends NEW placeholder row
- Covers UI-02: Course List spec

## App.jsx Updates
- Owns `completed`, `inProgress`, `hasTranscript`, `uploadLoading`, `uploadError` state
- Step 1 always visible; Step 2 (CourseList) conditionally rendered after `hasTranscript = true`
- Upload error propagates to UploadCard `error` prop → red border + message
- Steps 3-4 placeholder section present with data attributes for Plan 04 to mount into

## Build
- `cd frontend && npm run build` — succeeded cleanly (35 modules, 426ms)

## Requirements Covered
- UI-01: Upload Card (drag-drop, spinner, error)
- UI-02: Course Confirmation List (edit, delete, add)
