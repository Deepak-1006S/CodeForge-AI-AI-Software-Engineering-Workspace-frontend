import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface MonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
  height?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  language,
  onChange,
  readOnly = false,
  height = '100%',
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure editor
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      fontLigatures: true,
      minimap: { enabled: true },
      lineNumbers: 'on',
      roundedSelection: true,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: true,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      wordWrap: 'on',
    });

    // Add custom keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getAction('editor.action.formatDocument')?.run();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
      editor.focus();
    });
  };

  return (
    <div className="w-full h-full">
      <Editor
        height={height}
        defaultLanguage={language}
        language={language}
        value={value}
        onChange={onChange}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          contextmenu: true,
          minimap: {
            enabled: true,
          },
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
      />
    </div>
  );
};
