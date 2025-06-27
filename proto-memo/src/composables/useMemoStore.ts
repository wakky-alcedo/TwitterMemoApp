import { ref } from 'vue';

interface Memo {
  url: string;
  text: string;
}

const MEMO_KEY = 'twitter-memo-app-memos';

const memos = ref<Memo[]>(loadMemos());

function loadMemos(): Memo[] {
  const stored = localStorage.getItem(MEMO_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveMemos() {
  localStorage.setItem(MEMO_KEY, JSON.stringify(memos.value));
}

export default function useMemoStore() {
  const saveMemo = (url: string, text: string) => {
    const existingMemoIndex = memos.value.findIndex((memo) => memo.url === url);
    if (existingMemoIndex !== -1) {
      memos.value[existingMemoIndex].text = text;
    } else {
      memos.value.push({ url, text });
    }
    saveMemos();
  };

  const getMemo = (url: string) => {
    return memos.value.find((memo) => memo.url === url)?.text || '';
  };

  return {
    memos,
    saveMemo,
    getMemo,
  };
}