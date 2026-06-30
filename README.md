<h1 align="center">PaQe — Password Quality Evaluator</h1>

<p align="center">
  <strong>密码强度评估</strong>
</p>

<p align="center">
  <a href="https://knight-de-ficus.github.io/PaQe/" target="_blank" rel="noopener">
    <strong>📊 在线演示</strong>
  </a>
</p>

---

**PaQe**（Password Quality Evaluator）通过多项指标对密码进行客观、量化的安全性评价，帮助用户理解什么样的密码才是真正安全的——以及为什么。

所有计算均在浏览器本地完成，**不会将任何密码数据发送至网络**。

## 评估算法

PaQe 的熵值计算引擎基于 **KeePass 2.23+** 使用的密码质量估计算法。算法通过模式识别寻找最佳编码成本：

1. 将密码拆解为若干**模式片段**——每个字符默认归入所属的字符空间（大小写字母、数字、特殊字符、高位 ANSI 字符等）。
2. 同时扫描**重复序列**、**连续多位数**、**等差/等比递增递减序列**。
3. 识别密码中是否包含**常见弱密码**（内建约 10,000 条高频密码列表），并支持大小写变体和 **L33t 替换**检测。
4. 枚举所有可能的模式组合路径，使用静态熵编码器计算每种组合的编码成本（bit），取**最低成本**作为最终熵值评估。

> 参考：[KeePass Password Quality Estimation](https://keepass.info/help/kb/pw_quality_est.html)

## 功能特性

- **KeePass 同源算法** — 移植 KeePass 2.23+ 的密码质量评估引擎，以 bits 量化密码强度
- **环形进度可视化** — 红黄绿三色进度环直观展示密码强度等级
- **普通 / 高级双模式** — 普通模式显示强度评级，高级模式展示精确熵值与六项密码指标
- **密码指标检查** — 检测大小写、数字、特殊字符，并通过近 8 万条词典匹配常见关键词与弱密码
- **动态加固建议** — 根据密码短板生成针对性的改进提示
- **纯本地计算** — 所有运算在浏览器端完成，密码不离开用户设备

## 项目结构

```
PaQe/
├── index.html                         # 入口页面
├── app.css                            # 页面样式
├── app.js                             # 应用逻辑（UI交互、密码检测、模式切换）
│
├── Lib/
│   ├── PasswordQualityCalculator.js   # 熵值计算算法
│   ├── PopularPasswords.js            # 密码词典管理
│   └── MostPopularPasswords.js        # 词典加载入口
│
├── Dict/
│   ├── CommonElements.txt             # 关键词词典
│   └── CommonWeakPasswords.txt        # 常见弱密码库
│
└── svg/                               # 图标   
```

## 使用方式

### 本地运行

浏览器打开 `index.html` ，或通过任意 HTTP 服务器提供服务：

```bash
# Python
python -m http.server -d . 8080

# Node.js (npx)
npx serve .

# 浏览器打开 http://localhost:8080
```

### 在线演示

[PaQe Demo](https://knight-de-ficus.github.io/PaQe/)