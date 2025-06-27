// src/composables/useMemoStore.ts
export function useMemoStore() {
  const saveMemo = (url: string, memo: string) => {
    localStorage.setItem(url, memo); // URLをキーにメモを保存
  };

  const getMemo = (url: string) => {
    return localStorage.getItem(url) || ""; // メモを取得（ない場合は空文字）
  };

  return { saveMemo, getMemo };
}
