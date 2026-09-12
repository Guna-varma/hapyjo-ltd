/**
 * Pick a .txt file and return its UTF-8 content.
 * Used for survey TOP (multiple) and Depth (single) files.
 *
 * Web port: expo-document-picker -> a hidden <input type="file"> (the native OS file
 * chooser in a browser). Content is read with the File API, which is the same
 * fetch/text path the mobile module already used on web.
 */

export interface PickedSurveyFile {
  name: string;
  content: string;
}

/**
 * Opens the browser file chooser limited to text files.
 * Resolves null when the user cancels, matching the mobile picker's contract.
 */
export async function pickSurveyTextFile(): Promise<PickedSurveyFile | null> {
  const file = await pickOneFile('text/plain,.txt');
  if (!file) return null;
  const name = file.name || 'file.txt';
  let content = '';
  try {
    content = await file.text();
  } catch {
    content = '';
  }
  return { name, content };
}

/** Allows picking several TOP files in one go (survey TOP accepts multiple). */
export async function pickSurveyTextFiles(): Promise<PickedSurveyFile[]> {
  const files = await pickFiles('text/plain,.txt', true);
  const picked: PickedSurveyFile[] = [];
  for (const file of files) {
    let content = '';
    try {
      content = await file.text();
    } catch {
      content = '';
    }
    picked.push({ name: file.name || 'file.txt', content });
  }
  return picked;
}

async function pickOneFile(accept: string): Promise<File | null> {
  const files = await pickFiles(accept, false);
  return files[0] ?? null;
}

/**
 * Renders a transient file input and resolves with the chosen files.
 * `cancel` fires in browsers that support it; otherwise the promise settles when
 * the input reports a change, and is cleaned up on window focus as a fallback.
 */
function pickFiles(accept: string, multiple: boolean): Promise<File[]> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve([]);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.style.display = 'none';

    let settled = false;
    const finish = (files: File[]) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('focus', onFocus);
      input.remove();
      resolve(files);
    };
    // Browsers without a `cancel` event leave the promise open; focus returning to
    // the window with no selection means the chooser was dismissed.
    const onFocus = () => {
      setTimeout(() => {
        if (!settled && (input.files?.length ?? 0) === 0) finish([]);
      }, 300);
    };

    input.addEventListener('change', () => finish(Array.from(input.files ?? [])));
    input.addEventListener('cancel', () => finish([]));
    window.addEventListener('focus', onFocus);

    document.body.appendChild(input);
    input.click();
  });
}
