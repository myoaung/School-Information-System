import '@testing-library/jest-dom';
import React from 'react';

// Provide React globally for components that use React.* without importing (e.g. React.memo)
globalThis.React = React;
