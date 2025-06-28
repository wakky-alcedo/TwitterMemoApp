// src/composables/useMemoStore.ts
import { ref } from 'vue';

// メモデータのインターフェースを定義
interface Memo {
  id: string; // Twitter ID をメモのキーとして使用
  text: string; // メモの内容
  timestamp: string; // ★追加: メモが保存された日付/時刻
}

// localStorage に保存するキー名
const MEMO_KEY = 'twitter-memo-app-memos';

// 全てのメモデータをリアクティブな ref として管理
const memos = ref<Memo[]>(loadMemos());

// localStorage からメモを読み込む関数
function loadMemos(): Memo[] {
  const stored = localStorage.getItem(MEMO_KEY);
  // localStorage にデータがあれば JSON としてパースし、なければ空の配列を返す
  return stored ? JSON.parse(stored) : [];
}

// 現在のメモデータを localStorage に保存する関数
function saveMemos() {
  localStorage.setItem(MEMO_KEY, JSON.stringify(memos.value));
}

// メモ管理のための Composable 関数
export default function useMemoStore() {
  /**
   * 指定された Twitter ID と内容でメモを保存または更新する
   * @param id Twitter ID
   * @param text メモの内容
   */
  const saveMemo = (id: string, text: string) => {
    // 現在の日付を yy/MM/dd 形式で取得
    const now = new Date();
    const formattedDate = now.toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' });

    const existingMemoIndex = memos.value.findIndex((memo) => memo.id === id); // ID で検索
    if (existingMemoIndex !== -1) {
      // 既存のメモがあれば内容とタイムスタンプを更新
      memos.value[existingMemoIndex].text = text;
      memos.value[existingMemoIndex].timestamp = formattedDate; // ★更新: タイムスタンプを更新
    } else {
      // なければ新しいメモとして ID、内容、タイムスタンプを追加
      memos.value.push({ id, text, timestamp: formattedDate }); // ★追加: タイムスタンプを追加
    }
    saveMemos(); // 変更を localStorage に保存
  };

  /**
   * 指定された Twitter ID のメモを取得する
   * @param id Twitter ID
   * @returns メモのオブジェクト、または undefined
   */
  const getMemo = (id: string): string => {
    // ID に一致するメモを検索し、その内容を返す。見つからなければ空文字列。
    // メモオブジェクト全体が必要な場合は find() を直接返すように変更
    return memos.value.find((memo) => memo.id === id)?.text || '';
  };

  /**
   * 全てのメモデータを取得する (エクスポート用)
   * @returns 全てのメモの配列
   */
  const getAllMemos = (): Memo[] => {
    return memos.value;
  };

  /**
   * メモデータをインポートする (既存のデータを上書き)
   * @param newMemos インポートする新しいメモデータの配列
   * @returns インポートが成功したかどうか
   */
  const importMemos = (newMemos: Memo[]): boolean => {
    try {
      // インポートするデータが配列であり、各要素が 'id' と 'text' を持つか簡単な形式チェック
      // timestamp フィールドも必須にする場合はここに追加
      if (!Array.isArray(newMemos) || !newMemos.every(memo => typeof memo === 'object' && memo !== null && 'id' in memo && 'text' in memo && 'timestamp' in memo)) {
        console.error("Invalid data format for import. Expected array of objects with 'id', 'text', and 'timestamp' properties.");
        return false; // 形式が不正な場合はインポート失敗
      }
      memos.value = newMemos; // 全てのメモを新しいデータで上書き
      saveMemos(); // 変更を localStorage に保存
      console.log('Memos imported successfully.');
      return true; // インポート成功
    } catch (error) {
      console.error('Error importing memos:', error);
      return false; // エラー発生時はインポート失敗
    }
  };

  // Composable 関数が返すプロパティとメソッド
  return {
    memos, // 全てのメモデータ (リアクティブ)
    saveMemo, // メモ保存関数
    getMemo, // メモ取得関数
    getAllMemos, // 全メモ取得関数 (エクスポート用)
    importMemos,  // メモインポート関数
  };
}
