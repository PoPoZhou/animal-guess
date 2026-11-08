# 猜猜我心裡的動物

你在心裡想一種動物，AI 一題一題問，並把推理過程攤開給你看。

## 檔案
- `index.html`：網頁。
- `data.js`：知識表（32 種動物、19 個特徵）。要教 AI 新知識，改這個檔案。
- `engine.js`：AI 的推理規則（選題、容錯、開口猜、檢討）。
- `app.js`：畫面與互動。
- `style.css`：外觀。
- `tests.html`：自動測試，打開就會讓 AI 對每種動物各玩一局並列出結果。

## 在自己電腦上看
網頁用到 JavaScript 模組，直接雙擊 `index.html` 可能打不開，請在這個資料夾執行：

```
python -m http.server 8000
```

再用瀏覽器打開 http://localhost:8000/ 。

## 放上 GitHub Pages（不用安裝任何東西）
1. 登入 GitHub，右上角「+」→「New repository」，名稱例如 `animal-guess`，選 Public，按「Create repository」。
2. 在新 repo 頁面點「uploading an existing file」，把這個資料夾裡的所有檔案拖進去，按「Commit changes」。
3. 到 repo 的「Settings」→「Pages」，Source 選「Deploy from a branch」，Branch 選 `main`、資料夾選 `/ (root)`，按「Save」。
4. 等一兩分鐘，網址會是 `https://你的帳號.github.io/animal-guess/`。
