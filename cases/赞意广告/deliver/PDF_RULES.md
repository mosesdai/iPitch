# PDF 转出规则 · 赞意广告

对齐比亚迪 / 吉利国际 / 香飘飘打印纪律。

## 必须

1. **从 `deliver/*.html` 转**，不要直接拿 MD 糊进 Word。
2. **Chrome 另存为 PDF**（或 `build_deliver_pack.py 赞意广告 --pdf`）：
   - 关闭「页眉和页脚」
   - 打开「背景图形」
   - 纸张 **A4**
3. HTML 已设 `print-color-adjust:exact`，PDF 须保留表头底色。
4. 优先出：`ONE_PAGER.pdf` · `B_knife.pdf` · 合订/全案入口；冰山可只留 HTML。

## 命令

```bash
python3 cases/_tools/build_deliver_pack.py 赞意广告 --pdf
```

## 禁止

- 浏览器默认页眉（标题/日期/URL）
- 改 PDF 里的数字（只改 MD 真源再重生）
