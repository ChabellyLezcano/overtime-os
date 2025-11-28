// src/utils/copyToClipboard.ts

export async function copyToClipboard(
  text: string,
  options?: {
    setCopied?: (value: boolean) => void;
    timeoutMs?: number;
  },
): Promise<boolean> {
  const { setCopied, timeoutMs = 1500 } = options || {};

  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    console.error('Clipboard API is not available in this environment.');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);

    if (setCopied) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), timeoutMs);
    }

    return true;
  } catch (error) {
    console.error('Failed to copy text to clipboard', error);
    return false;
  }
}
