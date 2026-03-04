/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly VITE_CONTACT_FORM_ACTION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
