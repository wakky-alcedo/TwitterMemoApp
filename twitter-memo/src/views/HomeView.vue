<template>
  <div class="home-container">
    <!-- ヘッダー -->
    <header class="header">
      <h1 class="app-title">
        <span class="icon">🐦</span>
        Twitter Memo
      </h1>
      <div class="memo-count">{{ memoCount }}件保存中</div>
    </header>

    <!-- メイン入力エリア -->
    <main class="main-content">
      <div class="input-section">
        <div class="input-group">
          <label for="twitter-url" class="input-label">
            TwitterプロフィールURL
          </label>
          <input
            id="twitter-url"
            v-model="currentUrl"
            type="url"
            class="url-input"
            placeholder="https://twitter.com/username または https://x.com/username"
            @input="onUrlChange"
          />
          <div v-if="currentUsername" class="username-preview">
            @{{ currentUsername }}
          </div>
        </div>

        <div class="input-group">
          <label for="memo-text" class="input-label">
            メモ
          </label>
          <textarea
            id="memo-text"
            v-model="currentMemo"
            class="memo-input"
            placeholder="このユーザーについてのメモを入力..."
            rows="4"
          ></textarea>
        </div>

        <div class="button-group">
          <button
            @click="handleSave"
            :disabled="!canSave"
            class="save-button"
            :class="{ 'save-button--update': isUpdate }"
          >
            {{ isUpdate ? '更新' : '保存' }}
          </button>
          
          <button
            v-if="isUpdate"
            @click="handleDelete"
            class="delete-button"
          >
            削除
          </button>
          
          <button
            @click="handleClear"
            class="clear-button"
          >
            クリア
          </button>
        </div>

        <!-- 状態メッセージ -->
        <div v-if="statusMessage" class="status-message" :class="statusType">
          {{ statusMessage }}
        </div>
      </div>

      <!-- 保存済みメモ一覧 -->
      <div class="memo-list-section">
        <h2 class="section-title">保存済みメモ ({{ memoList.length }}件)</h2>
        
        <div v-if="memoList.length === 0" class="empty-state">
          まだメモが保存されていません
        </div>
        
        <div v-else class="memo-list">
          <div
            v-for="memo in memoList"
            :key="memo.id"
            class="memo-item"
            @click="loadMemo(memo)"
          >
            <div class="memo-header">
              <div class="username">@{{ memo.username }}</div>
              <div class="memo-date">
                {{ formatDate(memo.updatedAt) }}
              </div>
            </div>
            <div class="memo-preview">
              {{ memo.memo.substring(0, 100) }}{{ memo.memo.length > 100 ? '...' : '' }}
            </div>
            <div class="memo-url">
              <a :href="memo.twitterUrl" target="_blank" rel="noopener noreferrer">
                プロフィールを開く ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- フッター -->
    <footer class="footer">
      <div class="footer-actions">
        <button @click="handleExport" class="footer-button">
          データをエクスポート
        </button>
        <button @click="handleClearAll" class="footer-button footer-button--danger">
          全データ削除
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMemoStore, type MemoData } from '@/composables/useMemoStore'

// Composable
const {
  memoList,
  memoCount,
  saveMemo,
  getMemo,
  deleteMemo,
  hasMemo,
  clearAllMemos,
  exportData,
  extractUsernameFromUrl
} = useMemoStore()

// リアクティブな状態
const currentUrl = ref('')
const currentMemo = ref('')
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | ''>('')

// 計算プロパティ
const currentUsername = computed(() => extractUsernameFromUrl(currentUrl.value))
const isUpdate = computed(() => hasMemo(currentUrl.value))
const canSave = computed(() => currentUrl.value.trim() && currentMemo.value.trim())

// URL変更時の処理
function onUrlChange() {
  const existingMemo = getMemo(currentUrl.value)
  if (existingMemo) {
    currentMemo.value = existingMemo.memo
  }
}

// メモ保存
function handleSave() {
  if (!canSave.value) return

  const success = saveMemo(currentUrl.value, currentMemo.value)
  if (success) {
    showStatus('メモを保存しました', 'success')
  } else {
    showStatus('保存に失敗しました', 'error')
  }
}

// メモ削除
function handleDelete() {
  if (confirm('このメモを削除しますか？')) {
    const success = deleteMemo(currentUrl.value)
    if (success) {
      currentMemo.value = ''
      showStatus('メモを削除しました', 'success')
    } else {
      showStatus('削除に失敗しました', 'error')
    }
  }
}

// 入力クリア
function handleClear() {
  currentUrl.value = ''
  currentMemo.value = ''
  clearStatus()
}

// 全データ削除
function handleClearAll() {
  if (confirm('すべてのメモを削除しますか？この操作は取り消せません。')) {
    const success = clearAllMemos()
    if (success) {
      handleClear()
      showStatus('すべてのメモを削除しました', 'success')
    } else {
      showStatus('削除に失敗しました', 'error')
    }
  }
}

// データエクスポート
function handleExport() {
  try {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `twitter-memo-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showStatus('データをエクスポートしました', 'success')
  } catch {
    showStatus('エクスポートに失敗しました', 'error')
  }
}

// 既存メモの読み込み
function loadMemo(memo: MemoData) {
  currentUrl.value = memo.twitterUrl
  currentMemo.value = memo.memo
  clearStatus()
  // 画面上部にスクロール
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ステータス表示
function showStatus(message: string, type: 'success' | 'error') {
  statusMessage.value = message
  statusType.value = type
  setTimeout(clearStatus, 3000)
}

function clearStatus() {
  statusMessage.value = ''
  statusType.value = ''
}

// 日付フォーマット
function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.home-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background: #f8f9fa;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.app-title {
  margin: 0 0 10px 0;
  color: #1DA1F2;
  font-size: 2rem;
  font-weight: bold;
}

.icon {
  margin-right: 10px;
}

.memo-count {
  color: #666;
  font-size: 0.9rem;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.input-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.input-group {
  margin-bottom: 20px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.url-input, .memo-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.url-input:focus, .memo-input:focus {
  outline: none;
  border-color: #1DA1F2;
}

.username-preview {
  margin-top: 8px;
  padding: 8px 12px;
  background: #e8f5fe;
  border-radius: 6px;
  color: #1DA1F2;
  font-weight: 500;
  font-size: 0.9rem;
}

.memo-input {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.save-button, .delete-button, .clear-button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-button {
  background: #1DA1F2;
  color: white;
}

.save-button:hover:not(:disabled) {
  background: #1991db;
}

.save-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.save-button--update {
  background: #17bf63;
}

.save-button--update:hover {
  background: #14a653;
}

.delete-button {
  background: #e0245e;
  color: white;
}

.delete-button:hover {
  background: #c91c4e;
}

.clear-button {
  background: #657786;
  color: white;
}

.clear-button:hover {
  background: #556676;
}

.status-message {
  margin-top: 16px;
  padding: 12px;
  border-radius: 6px;
  font-weight: 500;
}

.status-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.memo-list-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.section-title {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.3rem;
}

.empty-state {
  text-align: center;
  color: #666;
  padding: 40px;
  font-style: italic;
}

.memo-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.memo-item {
  padding: 20px;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.memo-item:hover {
  border-color: #1DA1F2;
  box-shadow: 0 2px 8px rgba(29, 161, 242, 0.1);
}

.memo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.username {
  font-weight: 600;
  color: #1DA1F2;
  font-size: 1.1rem;
}

.memo-date {
  color: #666;
  font-size: 0.85rem;
}

.memo-preview {
  color: #333;
  line-height: 1.4;
  margin-bottom: 12px;
}

.memo-url a {
  color: #1DA1F2;
  text-decoration: none;
  font-size: 0.9rem;
}

.memo-url a:hover {
  text-decoration: underline;
}

.footer {
  margin-top: 40px;
  padding: 20px;
  text-align: center;
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-button {
  padding: 10px 20px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.footer-button:hover {
  background: #f5f5f5;
}

.footer-button--danger {
  border-color: #e0245e;
  color: #e0245e;
}

.footer-button--danger:hover {
  background: #fdf2f5;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .home-container {
    padding: 15px;
  }
  
  .input-section, .memo-list-section {
    padding: 20px;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .save-button, .delete-button, .clear-button {
    width: 100%;
  }
  
  .footer-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .footer-button {
    width: 200px;
  }
}
</style>