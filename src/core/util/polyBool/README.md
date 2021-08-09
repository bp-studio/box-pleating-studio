本模組的程式碼是從 https://github.com/velipso/polybooljs/issues/23
裡面的一個加速版本的 polybooljs 改造成 TypeScript
版本得到的；該 issue 所作的主要變更是改用二元搜尋來找出 Event 插入的位置。
 
polybooljs 是根據 Martinez-Rueda-Feito
演算法（2008）實作的超高速多邊形布林運算函式庫，執行上比
paper.js 的多邊形布林運算至少快了三倍。
 
由於我不需要 union, difference, xor 以外的其它運算，也不需要
buildLog，我把那些沒用到的部份都刪除掉以節省大小。
