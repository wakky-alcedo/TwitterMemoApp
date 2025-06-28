// src/composables/useMemoStore.ts
import { ref } from 'vue';

// メモデータのインターフェースを定義
interface Memo {
  id: string; // Twitter ID をメモのキーとして使用
  text: string; // メモの内容
  timestamp: string; // メモが最後に保存または更新された日付/時刻 (最終更新日)
  createdAt: string; // メモが最初に作成された日付 (作成日)
}

// localStorage に保存するキー名
const MEMO_KEY = 'twitter-memo-app-memos';

// 全てのメモデータをリアクティブな ref として管理
const memos = ref<Memo[]>(loadMemos());

// localStorage からメモを読み込む関数
function loadMemos(): Memo[] {
  const stored = localStorage.getItem(MEMO_KEY);
  // localStorage にデータがあれば JSON としてパースし、なければ空の配列を返す
  const loadedMemos: Memo[] = stored ? JSON.parse(stored) : [];

  // 古いデータ形式（createdAt がない）の対応
  return loadedMemos.map(memo => {
    if (!memo.createdAt) {
      // createdAt がない場合、timestamp を作成日として設定
      // timestamp も古い yy/MM/dd 形式かもしれないが、ここではそのまま代入
      memo.createdAt = memo.timestamp;
    }
    return memo;
  });
}

function saveMemos() {
  localStorage.setItem(MEMO_KEY, JSON.stringify(memos.value));
}

// メモ管理のための Composable 関数
export default function useMemoStore() {
  /**
   * 日付を yyyy/MM/dd 形式で取得するヘルパー関数
   * @returns フォーマットされた日付文字列
   */
  const getFormattedDate = (): string => {
    const now = new Date();
    // yyyy/MM/dd 形式で取得
    return now.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  /**
   * 指定された Twitter ID と内容でメモを保存または更新する
   * @param id Twitter ID
   * @param text メモの内容
   */
  const saveMemo = (id: string, text: string) => {
    const formattedCurrentDate = getFormattedDate(); // yyyy/MM/dd 形式で取得

    const existingMemoIndex = memos.value.findIndex((memo) => memo.id === id); // ID で検索
    if (existingMemoIndex !== -1) {
      // 既存のメモがあれば内容とタイムスタンプ (最終更新日) を更新
      memos.value[existingMemoIndex].text = text;
      memos.value[existingMemoIndex].timestamp = formattedCurrentDate; // 最終更新日を更新
      // createdAt は既存のものを保持し、更新しない
    } else {
      // なければ新しいメモとして ID、内容、最終更新日、作成日を追加
      memos.value.push({ id, text, timestamp: formattedCurrentDate, createdAt: formattedCurrentDate }); // 作成日も yyyy/MM/dd 形式で設定
    }
    saveMemos(); // 変更を localStorage に保存
  };

  /**
   * 指定された Twitter ID のメモを取得する
   * @param id Twitter ID
   * @returns メモの内容、または空文字列
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
      // 'timestamp' も必須とする。'createdAt' はオプション扱いとする（古いデータとの互換性のため）
      if (!Array.isArray(newMemos) || !newMemos.every(memo => typeof memo === 'object' && memo !== null && 'id' in memo && 'text' in memo && 'timestamp' in memo)) {
        console.error("Invalid data format for import. Expected array of objects with 'id', 'text', and 'timestamp' properties.");
        return false; // 形式が不正な場合はインポート失敗
      }

      // インポート時に createdAt がない場合のフォールバック処理
      const processedMemos: Memo[] = newMemos.map(memo => {
          if (!memo.createdAt) {
              // createdAt が存在しない場合、timestamp を代用する
              memo.createdAt = memo.timestamp;
          }
          // timestamp と createdAt が yyyy/MM/dd 形式であることを前提とする
          return memo as Memo; // Memo型としてアサート
      });

      memos.value = processedMemos; // 全てのメモを新しいデータで上書き
      saveMemos(); // 変更を localStorage に保存
      console.log('Memos imported successfully.');
      return true; // インポート成功
    } catch (error) {
      console.error('Error importing memos:', error);
      return false; // エラー発生時はインポート失敗
    }
  };

  /**
   * 指定された Twitter ID のメモをリストから削除する
   * @param id 削除するメモの Twitter ID
   */
  const deleteMemo = (id: string) => {
    // 指定された ID 以外のメモでフィルタリングし、リストを更新
    memos.value = memos.value.filter(memo => memo.id !== id);
    saveMemos(); // 変更を localStorage に保存
    console.log(`Memo with ID ${id} deleted.`);
  };


  // Composable 関数が返すプロパティとメソッド
  return {
    memos, // 全てのメモデータ (リアクティブ)
    saveMemo, // メモ保存関数
    getMemo, // メモ取得関数
    getAllMemos, // 全メモ取得関数 (エクスポート用)
    importMemos,  // メモインポート関数
    deleteMemo, // メモ削除関数
  };
}
