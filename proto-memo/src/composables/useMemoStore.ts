import { ref } from 'vue';

interface Memo {
  id: string; // Twitter ID をキーとする
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
  const saveMemo = (id: string, text: string) => {
    const existingMemoIndex = memos.value.findIndex((memo) => memo.id === id); // id で検索
    if (existingMemoIndex !== -1) {
      memos.value[existingMemoIndex].text = text;
    } else {
      memos.value.push({ id, text }); // id を使用して保存
    }
    saveMemos();
  };

  const getMemo = (id: string) => {
    return memos.value.find((memo) => memo.id === id)?.text || ''; // id で検索
  };

  return {
    memos,
    saveMemo,
    getMemo,
  };
}