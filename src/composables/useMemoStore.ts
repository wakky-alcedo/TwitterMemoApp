// src/composables/useMemoStore.ts
import { ref } from 'vue';

// メモデータのインターフェースを定義
interface Memo {
  id: string; // Twitter ID をメモのキーとして使用
  text: string; // メモの内容
  timestamp: string; // メモが最後に保存または更新された日付/時刻 (最終更新日) - ISO 8601 形式
  createdAt: string; // メモが最初に作成された日付 (作成日) - ISO 8601 形式
}

const MEMO_KEY = 'twitter-memo-app-memos';

const memos = ref<Memo[]>(loadMemos());

/**
 * localStorage からメモを読み込む関数
 * 古い形式のデータにも対応し、createdAt がない場合は timestamp を代用する
 * @returns 読み込まれたメモの配列
 */
function loadMemos(): Memo[] {
  const stored = localStorage.getItem(MEMO_KEY);
  const loadedMemos: Memo[] = stored ? JSON.parse(stored) : [];

  return loadedMemos.map(memo => {
    // 既存のデータで createdAt がない場合、timestamp を代用
    if (!memo.createdAt) {
      memo.createdAt = memo.timestamp;
    }
    // timestamp や createdAt が古い yy/MM/dd 形式の場合、ISO形式に変換する（初回ロード時のみ）
    // ただし、この変換は厳密な日付の復元を保証しないため、新規保存/更新時にのみISO形式を強制する
    // 例: "24/06/28" を "2024-06-28T00:00:00.000Z" のように
    if (memo.timestamp && !memo.timestamp.includes('T')) {
        const parts = memo.timestamp.split('/');
        // 年が2桁の場合、2000年代と仮定して4桁に変換
        const fullYear = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
        memo.timestamp = new Date(parseInt(fullYear), parseInt(parts[1]) - 1, parseInt(parts[2])).toISOString();
    }
    if (memo.createdAt && !memo.createdAt.includes('T')) {
        const parts = memo.createdAt.split('/');
        const fullYear = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
        memo.createdAt = new Date(parseInt(fullYear), parseInt(parts[1]) - 1, parseInt(parts[2])).toISOString();
    }
    return memo;
  });
}

/**
 * 現在のメモデータを localStorage に保存する関数
 */
function saveMemos() {
  localStorage.setItem(MEMO_KEY, JSON.stringify(memos.value));
}

export default function useMemoStore() {
  /**
   * 現在の日時を ISO 8601 形式の文字列で取得するヘルパー関数
   * 例: "2025-06-28T10:30:00.000Z"
   * @returns ISO 形式の現在の日時文字列
   */
  const getIsoDateTime = (): string => {
    return new Date().toISOString();
  };

  /**
   * 指定された Twitter ID と内容でメモを保存または更新する
   * @param id Twitter ID
   * @param text メモの内容
   */
  const saveMemo = (id: string, text: string) => {
    const currentIsoDateTime = getIsoDateTime(); // 現在の日時をISO形式で取得

    const existingMemoIndex = memos.value.findIndex((memo) => memo.id === id); // ID で検索
    if (existingMemoIndex !== -1) {
      // 既存のメモがあれば内容と timestamp (最終更新日) を更新
      memos.value[existingMemoIndex].text = text;
      memos.value[existingMemoIndex].timestamp = currentIsoDateTime; // 最終更新日をISO形式で更新
      // createdAt は既存のものを保持し、更新しない
    } else {
      // なければ新しいメモとして ID、内容、最終更新日、作成日を追加
      memos.value.push({ id, text, timestamp: currentIsoDateTime, createdAt: currentIsoDateTime }); // 作成日もISO形式で設定
    }
    saveMemos(); // 変更を localStorage に保存
  };

  /**
   * 指定された Twitter ID のメモの内容を取得する
   * @param id Twitter ID
   * @returns メモの内容、または空文字列
   */
  const getMemo = (id: string): string => {
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
   * インポートするデータ形式のバリデーションも行う
   * @param newMemos インポートする新しいメモデータの配列
   * @returns インポートが成功したかどうか
   */
  const importMemos = (newMemos: Memo[]): boolean => {
    try {
      // インポートするデータが配列であり、各要素が 'id', 'text', 'timestamp' を持つかチェック
      // 'createdAt' はオプション扱いとする（古いデータや外部インポートとの互換性のため）
      if (!Array.isArray(newMemos) || !newMemos.every(memo => typeof memo === 'object' && memo !== null && 'id' in memo && 'text' in memo && 'timestamp' in memo)) {
        console.error("Invalid data format for import. Expected array of objects with 'id', 'text', and 'timestamp' properties.");
        return false; // 形式が不正な場合はインポート失敗
      }

      // インポート時に createdAt がない場合や、日付形式がISOでない場合のフォールバック処理
      const processedMemos: Memo[] = newMemos.map(memo => {
          // createdAt が存在しない場合、timestamp を代用する
          if (!memo.createdAt) {
              memo.createdAt = memo.timestamp;
          }
          // timestamp/createdAt がISO形式でない場合、ISO形式に変換を試みる（インポート時の互換性のため）
          if (memo.timestamp && !memo.timestamp.includes('T')) {
              const parts = memo.timestamp.split('/');
              const fullYear = parts[0].length === 2 ? `20${parts[0]}` : parts[0]; // yyをyyyyに変換（暫定）
              memo.timestamp = new Date(parseInt(fullYear), parseInt(parts[1]) - 1, parseInt(parts[2])).toISOString();
          }
          if (memo.createdAt && !memo.createdAt.includes('T')) {
              const parts = memo.createdAt.split('/');
              const fullYear = parts[0].length === 2 ? `20${parts[0]}` : parts[0]; // yyをyyyyに変換（暫定）
              memo.createdAt = new Date(parseInt(fullYear), parseInt(parts[1]) - 1, parseInt(parts[2])).toISOString();
          }
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
