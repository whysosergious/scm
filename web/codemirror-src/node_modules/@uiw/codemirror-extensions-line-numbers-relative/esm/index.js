import { lineNumbers } from '@codemirror/view';
function formatNumber() {
  return lineNumbers({
    formatNumber: (lineNo, state) => {
      if (lineNo > state.doc.lines) {
        return '0';
      }
      var cursorLine = state.doc.lineAt(state.selection.asSingle().ranges[0].to).number;
      if (lineNo === cursorLine) {
        return '0';
      } else {
        return Math.abs(cursorLine - lineNo).toString();
      }
    }
  });
}
export var lineNumbersRelative = [formatNumber()];