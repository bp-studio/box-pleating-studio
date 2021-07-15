
# lib 資料夾注意事項

這個資料夾裡面包含了各種 BP Studio 會引用的第三方函式庫，
這些函式庫都已經經過充分測試確定可以和 BP Studio 正常搭配，
所以原則上它們都沒有絕對需要被更新的必要性；
除非這些函式庫釋出的新版本特別著眼於效能上的提昇，
則可以再評估是否需要加以更新。

底下針對一些函式庫作額外的特別說明。

## paper.js

這邊使用的 paper.js 為針對 BP Studio 需求特別 fork 的版本，
去除掉了原程式庫中約 1/3 使用不到的程式碼，
並且修正了一則跟 SVG 生成有關的效能 bug。
參見 [MuTsunTsai/paper.js](https://github.com/MuTsunTsai/paper.js)。

## Shrewd

Shrewd 的更新通常都是透過本地更新，執行 `gulp shrewd` 命令即可更新。

## Bootstrap

和 paper.js 一樣，這個 Bootstrap 5 也是特別建置的版本，
裡面只保留了 `DropDown` 和 `Modal` 兩項功能。
我的 gulp 工作已經撰寫好了對應的自動化，未來若要更新的話，
只要把新的檔案複製到 bootstrap 資料夾中就行了。

## vue.js

有鑑於 Vue 3 的設計似乎反而在很多方面對這個專案來說顯得麻煩，
我可能暫時不會考慮升級，而會繼續使用 Vue 2。

## VueDraggable

原作者建置的方式實在太爛，所以這邊是我手動建置的版本。
