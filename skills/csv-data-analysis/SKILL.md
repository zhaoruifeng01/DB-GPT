---
name: csv-data-analysis
description: 当用户需要分析 CSV 或 Excel 文件、理解数据模式、生成统计摘要或创建数据可视化时，应使用此技能。触发关键词包括"analyze CSV"、"analyze Excel"、"data analysis"、"CSV analysis"、"Excel analysis"、"data statistics"、"generate charts"、"data visualization"、"分析CSV"、"分析Excel"、"数据分析"、"CSV分析"、"Excel分析"、"数据统计"、"生成图表"、"数据可视化"。
---

# 智能深度数据分析工具

数据分析工具是一个基于前端可视化技术（ECharts + Tailwind CSS）构建的 AI 驱动深度自动化数据探索工具。它能快速提取统计特征、数据质量指标、数值分布、异常检测、分类信息、相关性、排名和时间序列趋势。报告后半部分补充异常概览、归因线索和总结建议，生成高度精美且可交互的网页分析报告。支持格式包括 CSV、Excel（.xlsx/.xls）和 TSV。

报告遵循"前半部分基础数据分析，后半部分异常检测与归因增强"的结构。核心章节包括：执行摘要、数据概览与质量检查、数值分布特征、特征分析与结构分析、关系分析与异常识别、数据异常概览、归因分析模块、分析结果与统计详情、根因推断/结论/建议。

## 核心工作流（LLM 必读）

作为 AI 助手，当用户上传 CSV 或 Excel 文件并请求分析时，你必须严格按照以下两个步骤执行：

### 步骤 1：提取数据特征（执行脚本）

使用 `execute_skill_script_file` 工具运行 `csv_analyzer.py`，传入数据文件路径（支持 .csv、.xlsx、.xls、.tsv 格式）。

**工具调用参数示例：**
```json
{
  "skill_name": "csv-data-analysis",
  "script_file_name": "csv_analyzer.py",
  "args": {"input_file": "/path/to/data.csv or /path/to/data.xlsx"}
}
```

**脚本返回说明：**
脚本返回一大段 `text` 内容，包含两部分：
1. **[统计摘要]**：供你阅读和理解数据集的基本特征、分布、相关性和分类组成。
2. **[标记包裹的数据块]**：脚本输出包含格式为 `###KEY_START###...###KEY_END###` 的标记数据块。后端会自动捕获并注入到模板中——**你无需处理或传递此内容**。

### 步骤 2：生成洞察 & 展示报告（注入模板）

阅读步骤 1 中获得的"统计摘要"，推理数据背后的业务意义或模式。然后使用 `html_interpreter` 工具加载模板并注入数据。

**关键规则（必须遵守）：**

1. **你必须设置 `template_path`** 为 `csv-data-analysis/templates/report_template.html`。模板内置了完整的 ECharts 渲染 JavaScript 代码以及所有章节标题和页脚文本。你只需通过 `data` 参数填充 9 个内容占位符。**绝不要自己编写或修改任何 JavaScript 图表渲染代码。**

2. **标记数据块由后端自动注入** —— 你不得在 `data` 中传递它们。后端会自动从脚本输出中的 `###KEY_START###...###KEY_END###` 标记提取内容并注入模板；在本技能中，这主要是 `CHART_DATA_JSON`。

3. **`*_INSIGHTS`、`EXEC_SUMMARY` 和 `CONCLUSIONS`** 必须使用 HTML 格式（如 `<p>`、`<ul>`、`<li>`、`<strong>`、`<ol>`）以确保正确排版。这些是你基于统计摘要撰写的深度业务洞察。

4. **输出语言必须与用户输入语言一致。** 你还必须传递 `LANG` 占位符（`"en"` 或 `"zh"`），以便模板中硬编码的章节标题、标签和页脚文本以匹配的语言显示。从用户查询中检测语言：如果用户使用英文书写，设置 `LANG` 为 `"en"`；如果用户使用中文书写，设置 `LANG` 为 `"zh"`。不确定时默认为 `"zh"`。

5. **精确传递 9 个占位符——不多不少。** 自动注入的标记字段如 `CHART_DATA_JSON` 由后端处理，不应由你传递。模板已硬编码所有章节标题（分布分析、相关性分析等）、洞察框标题（"洞察"）和页脚文本——你无需传递这些（模板会根据 `LANG` 占位符自动翻译）。

6. **洞察内容必须有实质性。** 每个洞察模块应涵盖 4 层信息：`观察`、`可能原因`、`业务影响`和`行动建议`。不要仅仅重述统计数值或只写几句模糊的结论。

7. **基础分析在前，归因作为增强模块。** 报告前半部分必须聚焦于 CSV 本身的数据特征分析，包括数值分布、分类结构、异常值、相关性、排名模式等，并尽可能结合图表解读。"数据异常概览"、"归因分析"和"根因推断"应出现在后半部分作为增强模块——整个报告不能仅由归因内容组成。

**`html_interpreter` 调用示例：**
```json
{
  "template_path": "csv-data-analysis/templates/report_template.html",
  "data": {
    "LANG": "zh",
    "REPORT_TITLE": "销售数据集深度分析报告",
    "REPORT_SUBTITLE": "多维数据特征与业务洞察挖掘",
    "EXEC_SUMMARY": "<p>该数据集包含 1,000 行 5 列，数据完整性良好。主要发现包括：</p><ul><li><strong>受众分布：</strong>主要集中在 25-35 岁年龄段...</li></ul>",
    "DISTRIBUTION_INSIGHTS": "<p>数值分布图表显示指标 A 呈现明显的右偏分布，表明...</p>",
    "CORRELATION_INSIGHTS": "<p>变量间热力图揭示了强正相关性，特别是在...之间，这意味着...</p>",
    "CATEGORICAL_INSIGHTS": "<p>分类占比显示北京和上海占"城市"字段的 50% 以上。</p>",
    "TIME_SERIES_INSIGHTS": "<p>时间序列趋势表明年末有显著的季节性上升。</p>",
    "CONCLUSIONS": "<p>基于综合多维分析，数据呈现出清晰的结构特征和模式。</p><h3>建议</h3><ul><li>定期监控缺失值比率...</li><li>关注高增长市场细分...</li></ul>"
  }
}
```

> **严格禁止：**
> - 不要在 `data` 中传递 `CHART_DATA_JSON` 或任何自动注入的标记字段（由后端自动处理）
> - 不要在 `data` 中添加任何 JavaScript 代码
> - 不要省略 `template_path` 参数（省略 template_path 将导致图表无法渲染！）
> - 不要返回静态 PNG 图片——此工具已全面升级为 ECharts 动态前端渲染
> - 不要传递不存在的占位符（模板只有以下 9 个文本占位符 + 1 个自动注入的 CHART_DATA_JSON；其他名称将被忽略）

## 占位符参考（共 9 个，由 LLM 通过 data 传递）

你需要在模板中填充的占位符如下：

| 占位符 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `LANG` | 文本 | 是 | 报告语言：`"en"` 表示英文，`"zh"` 表示中文。决定所有章节标题、标签和页脚文本的语言。从用户输入语言检测；默认 `"zh"` |
| `REPORT_TITLE` | 文本 | 是 | 报告标题，如"销售数据集深度分析报告" |
| `REPORT_SUBTITLE` | 文本 | 是 | 报告副标题，如"多维数据特征与业务洞察挖掘" |
| `EXEC_SUMMARY` | HTML | 是 | 执行摘要：数据规模概述、关键发现和结论预览 |
| `DISTRIBUTION_INSIGHTS` | HTML | 是 | 数值分布特征解读：偏度、波动性、分位数范围、离散度 |
| `CORRELATION_INSIGHTS` | HTML | 是 | 关系分析与异常识别解读：相关性、关联性、异常值、结构关系 |
| `CATEGORICAL_INSIGHTS` | HTML | 是 | 特征分析与结构分析解读：分类结构、集中度、排名和群体特征 |
| `TIME_SERIES_INSIGHTS` | HTML | 是 | 数据异常概览章节的补充解读：如有时间列则讨论趋势；如无时间列则讨论分层差异和异常模式 |
| `CONCLUSIONS` | HTML | 是 | 根因推断、结论与建议正文；必须区分"数据证据"和"合理推测" |

> **注意：** `csv_analyzer.py` 在其输出中包含 `###CHART_DATA_JSON_START###...###CHART_DATA_JSON_END###` 标记数据块。后端会自动提取并注入到模板中——不应在 `data` 中传递。模板中所有章节标题（如"分布分析"、"相关性分析"、"结论与建议"）、洞察框标题（"洞察"）和页脚文本均在 HTML 中硬编码，并根据 `LANG` 占位符自动翻译——无需通过占位符传递。

## 为什么选择此工具？

1. **快速轻量**：不再使用缓慢的 Python 绑图和批量 PNG 生成——仅传输核心 JSON 数据。
2. **现代交互式布局**：完全集成 Tailwind CSS 响应式布局和 Apache ECharts 流畅动画交互。
3. **深度业务洞察**：通过将机器驱动的数据提取与 LLM 驱动的逻辑推理分离，此工具能产出高价值的数据分析报告。

## 文件结构

```
csv-data-analysis/
├── SKILL.md                        # 你正在阅读的技能指南（英文版）
├── SKILL_zh.md                     # 技能指南中文版
├── scripts/
│   └── csv_analyzer.py             # Python 分析引擎（支持 CSV/Excel/TSV，轻量级，无图形依赖）
└── templates/
    └── report_template.html        # 响应式 ECharts 报告模板（内置渲染逻辑和硬编码标题）
```
