# iPitch Engine

自建编排核。进度：[`docs/ENGINEERING_PROGRAM.md`](../docs/ENGINEERING_PROGRAM.md)

## 给同事看（期 L）

```bash
python3 -m engine.serve
# http://127.0.0.1:8765/ui/PitchStudio刀刃.html
# …#engine-lab  ← 页内本机门禁
```

剧本：[`docs/LOCAL_DEMO_PLAYBOOK.md`](../docs/LOCAL_DEMO_PLAYBOOK.md)

## R1

```bash
python3 -m engine.run --mode demo          # GREEN（可加 --offline）
python3 -m engine.run --mode fail-v16      # RED 缺 PRIMARY
python3 -m engine.run --mode fail          # RED 假引用
```

阶段：`research → ifalsify → compose → knife`

## R2 / R3（缺字段挂起）

```bash
python3 -m engine.run --promote r2 --from runs/<r1_id>
python3 -m engine.run --continue runs/<r2_id>     # exit 3 = awaiting_input
# 编辑 sales_input.json 或：
python3 -m engine.run --demo-fill-input runs/<r2_id>
python3 -m engine.run --continue runs/<r2_id>     # evolve + shelf

python3 -m engine.run --promote r3 --from runs/<r2_id>
python3 -m engine.run --demo-fill-input runs/<r3_id>
python3 -m engine.run --continue runs/<r3_id>     # close pack
```

R2 货架 ID 必须在 `references/shelf/catalog_starter.md`；iPod 不得进组合块。

## Stage 4

见 [`docs/phase-c/`](../docs/phase-c/)（GitHub / Cloud 需决策；期 L 勿开工）。
