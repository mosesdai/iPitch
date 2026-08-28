# PDF 转出规则 · 比亚迪 BYD

对齐香飘飘 / 传音 / lining sample 的打印纪律。

## 必须

1. **从 `deliver/*.html` 转**，不要直接拿 MD 糊进 Word。
2. **Chrome 另存为 PDF**（或本脚本 `--pdf`）：
   - 关闭「页眉和页脚」
   - 打开「背景图形」
   - 纸张 **A4**
   - 边距：默认或最小（HTML 已 `@page margin:12mm`）
3. HTML 已设 `print-color-adjust:exact` + 淡蓝表头底，PDF 必须保留底色。
4. 优先出：`ONE_PAGER.pdf` · `B_knife.pdf` · `FOR_MAX_PACK.pdf`；冰山可只留 HTML。

## 命令

```bash
python3 cases/_tools/build_deliver_pack.py byd --pdf
```

## 禁止

- 浏览器默认页眉（标题/日期/URL）
- 改 PDF 里的数字（只改 MD 真源再重生）
