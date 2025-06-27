import { ref, computed, watch } from 'vue'

export interface MemoData {
  id: string
  twitterUrl: string
  username: string
  memo: string
  createdAt: string
  updatedAt: string
}

export interface MemoStore {
  [key: string]: MemoData
}

// Flutterでの移行を考慮した設計
// - localStorageアクセスは1箇所に集約
// - データ操作は純粋関数として分離
// - UIとロジックを完全分離

const STORAGE_KEY = 'twitter_memo_store'

class LocalStorageAdapter {
  static save(data: MemoStore): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      return false
    }
  }

  static load(): MemoStore {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return {}
    }
  }

  static clear(): boolean {
    try {
      localStorage.removeItem(STORAGE_KEY)
      return true
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      return false
    }
  }
}

// Twitter URLからユーザー名を抽出するヘルパー関数
function extractUsernameFromUrl(url: string): string {
  try {
    const match = url.match(/twitter\.com\/([^\/\?]+)/i) || 
                  url.match(/x\.com\/([^\/\?]+)/i)
    return match ? match[1].replace('@', '') : ''
  } catch {
    return ''
  }
}

// メモIDを生成（URLベース）
function generateMemoId(url: string): string {
  const username = extractUsernameFromUrl(url)
  return username.toLowerCase()
}

export function useMemoStore() {
  // リアクティブストア
  const store = ref<MemoStore>(LocalStorageAdapter.load())
  
  // 自動保存の設定
  watch(store, (newStore) => {
    LocalStorageAdapter.save(newStore)
  }, { deep: true })

  // 計算プロパティ
  const memoList = computed(() => 
    Object.values(store.value).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  )

  const memoCount = computed(() => Object.keys(store.value).length)

  // メモの追加・更新
  function saveMemo(twitterUrl: string, memoText: string): boolean {
    const username = extractUsernameFromUrl(twitterUrl)
    if (!username || !twitterUrl.trim()) {
      return false
    }

    const id = generateMemoId(twitterUrl)
    const now = new Date().toISOString()
    const isUpdate = id in store.value

    store.value[id] = {
      id,
      twitterUrl: twitterUrl.trim(),
      username,
      memo: memoText.trim(),
      createdAt: isUpdate ? store.value[id].createdAt : now,
      updatedAt: now
    }

    return true
  }

  // メモの取得
  function getMemo(twitterUrl: string): MemoData | null {
    const id = generateMemoId(twitterUrl)
    return store.value[id] || null
  }

  // メモの削除
  function deleteMemo(twitterUrl: string): boolean {
    const id = generateMemoId(twitterUrl)
    if (id in store.value) {
      delete store.value[id]
      return true
    }
    return false
  }

  // メモの存在チェック
  function hasMemo(twitterUrl: string): boolean {
    const id = generateMemoId(twitterUrl)
    return id in store.value
  }

  // 全データのクリア
  function clearAllMemos(): boolean {
    store.value = {}
    return LocalStorageAdapter.clear()
  }

  // エクスポート用（将来のクラウド同期に対応）
  function exportData(): string {
    return JSON.stringify(store.value, null, 2)
  }

  // インポート用（将来のクラウド同期に対応）
  function importData(jsonData: string): boolean {
    try {
      const importedStore = JSON.parse(jsonData)
      if (typeof importedStore === 'object' && importedStore !== null) {
        store.value = importedStore
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // 検索機能（将来の拡張対応）
  function searchMemos(query: string): MemoData[] {
    const searchTerm = query.toLowerCase().trim()
    if (!searchTerm) return memoList.value

    return memoList.value.filter(memo => 
      memo.username.toLowerCase().includes(searchTerm) ||
      memo.memo.toLowerCase().includes(searchTerm)
    )
  }

  return {
    // State
    store: store.value,
    memoList,
    memoCount,
    
    // Actions
    saveMemo,
    getMemo,
    deleteMemo,
    hasMemo,
    clearAllMemos,
    exportData,
    importData,
    searchMemos,
    
    // Utilities
    extractUsernameFromUrl,
    generateMemoId
  }
}