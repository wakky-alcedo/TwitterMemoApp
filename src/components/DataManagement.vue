<script setup lang="ts">
import useMemoStore from '../composables/useMemoStore';

// useMemoStore から必要な関数を取得
const { getAllMemos, importMemos } = useMemoStore();

/**
 * 全てのメモデータを JSON 形式でエクスポートし、ファイルとしてダウンロードさせる
 * メモがない場合はアラートを表示し、処理を中断する
 */
const exportData = () => {
  const allMemos = getAllMemos(); // useMemoStore から全てのメモデータを取得
  if (allMemos.length === 0) {
    alert('保存されているメモがありません。');
    return;
  }
  // JSON データを見やすいように整形（インデント2）して文字列化
  const dataStr = JSON.stringify(allMemos, null, 2);
  // JSON 文字列を 'application/json' タイプの Blob オブジェクトとして作成
  const blob = new Blob([dataStr], { type: 'application/json' });
  // Blob から一時的な URL を生成
  const url = URL.createObjectURL(blob);
  // ダウンロード用の <a> 要素を作成
  const a = document.createElement('a');
  a.href = url; // 生成したURLを設定
  a.download = 'twitter_memos_backup.json'; // ダウンロード時のファイル名を指定
  // リンクを DOM の body に一時的に追加
  document.body.appendChild(a);
  a.click(); // プログラム的にクリックイベントを発火させ、ダウンロードを開始
  // 使用済みの一時 URL を解放し、DOM からリンク要素を削除
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert('メモをエクスポートしました！');
};

/**
 * ファイルからメモデータを読み込み、localStorage にインポートする
 * 選択されたファイルがなければアラートを表示
 * ファイル内容を JSON としてパースし、useMemoStore の importMemos 関数を呼び出す
 * インポート成功後、ユーザーに通知する (HomeViewでメモ一覧の更新をトリガーするようイベントを発行)
 * エラーが発生した場合は、その旨をユーザーに通知する
 * @param event ファイル選択イベント
 */
const importData = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]; // 選択されたファイルを取得
  if (!file) {
    alert('ファイルが選択されていません。');
    return;
  }

  const reader = new FileReader(); // FileReader オブジェクトを作成
  // ファイル読み込み完了時の処理を設定
  reader.onload = (e) => {
    try {
      // 読み込んだ内容（文字列）を JSON としてパース
      const parsedData = JSON.parse(e.target?.result as string);
      // useMemoStore の importMemos 関数を呼び出し、インポートを実行
      if (importMemos(parsedData)) {
        alert('メモをインポートしました！');
        // インポート後、HomeViewでメモ一覧を更新するためにイベントを発行
        // これにより、親コンポーネントが loadMemo を再度呼び出すことを期待
        emit('import-success'); 
      } else {
        alert('インポートするデータの形式が正しくありません。');
      }
    } catch (error) {
      // JSON パースエラーやその他のエラーを捕捉
      alert('ファイルの読み込み中にエラーが発生しました。JSON形式のファイルであることを確認してください。');
      console.error('File import error:', error);
    }
    // 同じファイルを再度選択できるように、ファイル入力要素の値をリセット
    (event.target as HTMLInputElement).value = '';
  };
  // ファイルをテキストとして読み込み開始
  reader.readAsText(file);
};

// 親コンポーネントへのイベント発行を定義
const emit = defineEmits(['import-success']);
</script>

<template>
  <h2>データ管理</h2>
  <div class="data-management-buttons">
    <button @click="exportData" class="export-button">エクスポート</button>
    <!-- ファイル入力要素を隠し、ラベルをクリック可能にしてボタンのように見せる -->
    <label class="import-button">
      インポート
      <input type="file" @change="importData" accept=".json" style="display: none;">
    </label>
  </div>
</template>

<style scoped>
/* ボタンの共通スタイル */
button {
  padding: 0.75em 1.5em;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
  transition: background-color 0.3s ease, transform 0.1s ease;
  font-weight: bold;
}

button:active {
  transform: translateY(1px);
}

.export-button {
  background-color: var(--button-export-bg);
  color: var(--button-export-text);
  font-size: 1em;
  line-height: 1;
}
.export-button:hover {
  background-color: var(--button-export-hover);
}

.import-button {
  display: inline-block;
  padding: 0.75em 1.5em;
  background-color: var(--button-import-bg);
  color: white; /* インポートボタンは常に白文字 */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  line-height: 1;
  text-align: center;
  vertical-align: middle;
  transition: background-color 0.3s ease, transform 0.1s ease;
  font-weight: bold;
}
.import-button:hover {
  background-color: var(--button-import-hover);
}
.import-button:active {
  transform: translateY(1px);
}

.data-management-buttons {
  margin-top: 1em;
  display: flex;
  gap: 10px;
}

/* h2 も scoped に含める */
h2 {
  color: var(--header-color);
}
</style>
