// PDF Helper test
import * as pdfjsLib from 'pdfjs-dist';

export const isPdfJsAvailable = () => {
  return typeof pdfjsLib !== 'undefined';
};
