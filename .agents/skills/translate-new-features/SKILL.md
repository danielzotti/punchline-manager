---
name: translate-new-features
description: Mandato to check and translate any new user interface text, buttons, alerts, or features into all supported languages (Italian/it.json and English/en.json). Triggers whenever UI files, pages, or components are added or modified.
---

# Translate New Features

This skill ensures that all user-facing strings are correctly localized in both Italian and English.

## Guidelines

1. **Identify User-Facing Text**: Whenever you add or modify components, pages, templates, or error messages that display text to the user, identify all hardcoded strings.
2. **Use translation hooks/libraries**: Ensure you use the application's localization framework (e.g., standard i18n JSON translation files under `src/i18n/`) instead of hardcoding strings in the UI components.
3. **Update translation files**:
   - Always update both translation files:
     - [it.json](file:///Users/daniel/Projects/github/punchline-manager/src/i18n/it.json)
     - [en.json](file:///Users/daniel/Projects/github/punchline-manager/src/i18n/en.json)
   - Keep the keys consistent and sorted/structured similarly in both files.
4. **Verification**:
   - Double-check that all translation keys used in the components actually exist in both translation JSON files.
