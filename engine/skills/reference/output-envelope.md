# 产物返回信封

编排器只解析信封，不解析散文。

```text
===FILE: B_knife.md===
内容…
===END: B_knife.md===

===MANIFEST===
{"stage":"knife","files":[{"path":"B_knife.md","lines":12}]}
===END MANIFEST===
```

规则：

- 标记行必须独占一行、行首无空格
- `===END:` 路径必须与 `===FILE:` 一致
- 路径相对 `artifacts/`，禁止 `..`、绝对路径、盘符
- 正文里不要出现以 `===FILE:` / `===END:` / `===MANIFEST===` 开头的行
