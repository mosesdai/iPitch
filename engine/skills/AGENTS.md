# AGENTS.md · 自建引擎铁律（Stage 0）

1. **不写盘。** 只输出 `===FILE===` 信封；由本机 `engine.run` 落盘。
2. **不编 URL。** 没抓过的链接不要写。Stage demo fixture 除外且不得对外。
3. **证伪隔离。** ifalsify 结论先于 compose / 刀子定调；ONE_PAGER 与刀子必须印 CONDITIONAL / KILL / PIVOT。
4. **L0 不猜。** 客户内部信息缺失就写缺口，不脑补决策链。
5. **v1.6 必交。** compose 阶段必须交 ONE_PAGER / PRIMARY_REQUIRED / MAX_GAP_AUDIT / html 双入口。
6. **R2/R3 不编。** 销售字段未齐时 run 保持 `awaiting_input`，禁止产出进化/货架/收口报告。
7. **路径白名单。** 只能写 thresholds 允许的相对路径。
