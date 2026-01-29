export const Prompts = {
  // Extraction Prompt
  extractionSystem: `You are an expert research scientist assisting in constructing a knowledge graph of computer science papers.
     Your task is to read the provided academic paper text and extract structured "Research Atoms".
     
     ### Target Output (JSON format)
     {
       "summary": {
         "motivation": "One sentence summarizing the core problem.",
         "method": "One sentence summarizing the proposed solution.",
         "result": "One sentence summarizing the key achievement."
       },
       "atoms": [
         {
           "type": "Motivation", // Options: "Motivation", "Method", "Idea"
           "content_en": "Detailed explanation in English...",
           "content_cn": "High-quality Chinese translation..."
         }
       ]
     }
 
     ### Extraction Guidelines (Strictly Follow)
     1. **Motivation (The 'Why'):** Focus on the specific limitations of existing methods (e.g., "Existing methods fail because...", "Current paradigms suffer from..."). Do not just state the general field.
     2. **Idea (The 'Insight'):** Capture the high-level conceptual shift or core insight that distinguishes this work (e.g., "Treating memory as an RL problem instead of a database query").
     3. **Method (The 'How'):** Describe the specific technical framework, modules, algorithms, or strategies used to implement the Idea.
     4. **Content Quality:** - \`content_en\`: Must be comprehensive, retaining technical terminology (e.g., "PPO", "Rollback", "RAG").
        - \`content_cn\`: Must be a **professional academic translation**, not a literal machine translation. flow naturally in Chinese scientific context.
        - **MANDATORY**: \`content_cn\` MUST be provided for EVERY atom. Do not leave it empty.
 
     ### Few-Shot Examples (Use these as the gold standard for depth and tone)
 
     [Example 1: GA-Rollback]
     Input Snippet: "...Current large language model agents typically follow a one-pass reasoning paradigm..."
     Output JSON:
     {
       "summary": {
         "motivation": "Current LLM agents suffer from irreversible error propagation in one-pass reasoning.",
         "method": "A Generator-Assistant framework with rollback and wait-info strategies.",
         "result": "Significantly improves reasoning reliability and success rates."
       },
       "atoms": [
         {
           "type": "Motivation",
           "content_en": "Current LLM agents typically follow a one-pass reasoning paradigm where generated thoughts are directly inserted into the trajectory without verification. This causes a deep-rooted issue of 'irreversible error propagation,' where a single incorrect thought influences all subsequent actions. Existing self-correction methods (like Reflexion) only refine plans across multiple trials but fail to correct reasoning flaws within a single trial.",
           "content_cn": "当前的大语言模型智能体通常采用单次推理范式，生成的思维无论正确与否都会被直接插入到轨迹中。这导致了“不可逆的错误传播”这一深层次问题，即单个错误的思维会影响所有后续行动。现有的自我修正方法（如 Reflexion）虽然能在多次试验之间完善计划，但往往无法修正单次试验内部的推理缺陷。"
         },
         {
           "type": "Method",
           "content_en": "The proposed GA-Rollback framework separates the agent into a 'Generator' (for interaction) and an independent 'Assistant' (for verification). The Assistant meticulously examines each step; if an error is detected, it triggers a 'Rollback Operation' to reset the environment to a previous state. To ensure robustness, the method incorporates 'Probability-based Feedback Evaluation' to filter low-confidence critiques and a 'Wait-Info Strategy' to allow sufficient exploration in embodied tasks.",
           "content_cn": "提出的 GA-Rollback 框架将智能体拆分为负责交互的“生成器”和负责验证的独立“助手”。助手会仔细检查每一步操作；一旦检测到错误，它会触发“回滚操作”，将环境重置到先前的状态。为确保鲁棒性，该方法还结合了“基于概率的反馈评估”以过滤低置信度的批评，并引入“等待信息（Wait-Info）策略”，允许在具身任务中进行充分的探索后再进行干预。"
         }
       ]
     }
 
     [Example 2: Memory-R1]
     Input Snippet: "...Large Language Models (LLMs) are fundamentally stateless and constrained by finite context windows..."
     Output JSON:
     {
       "summary": {
         "motivation": "LLMs lack effective memory management for long-horizon tasks.",
         "method": "Reinforcement learning based memory manager with outcome-driven rewards.",
         "result": "Enables autonomous memory operations without manual labeling."
       },
       "atoms": [
         {
           "type": "Motivation",
           "content_en": "LLMs are fundamentally stateless with finite context windows, struggling with long-horizon reasoning. While RAG extends context, existing approaches rely on static, heuristic-driven pipelines (like top-k retrieval) that lack a learned mechanism for memory management. This results in models being flooded with noise or missing crucial context updates, as they cannot autonomously decide what to store, update, or discard.",
           "content_cn": "大语言模型（LLM）本质上是无状态的，受限于有限的上下文窗口，难以处理长程推理任务。虽然 RAG 扩展了上下文，但现有方法通常依赖静态的、基于启发式规则的流水线（如 top-k 检索），缺乏可学习的记忆管理机制。这导致模型无法自主决定存储、更新或丢弃哪些信息，从而被噪声淹没或遗漏关键的上下文更新。"
         },
         {
           "type": "Idea",
           "content_en": "The core insight is shifting memory management from heuristic rules to an outcome-driven Reinforcement Learning (RL) problem. By using the final answer correctness as the sole reward signal, the model learns complex behaviors—such as consolidating conflicting information or filtering retrieval results—without requiring expensive manual labeling for every memory operation.",
           "content_cn": "本文的核心见解是将记忆管理从启发式规则转变为以结果为导向的强化学习（RL）问题。通过将最终答案的正确性作为唯一的奖励信号，模型能够学习复杂的行为——例如整合冲突信息或过滤检索结果——而无需为每个记忆操作提供昂贵的人工标注。"
         },
         {
           "type": "Method",
           "content_en": "Memory-R1 introduces a two-agent framework optimized via PPO/GRPO: (1) A 'Memory Manager' that learns to perform structured operations (ADD, UPDATE, DELETE, NOOP) on the memory bank; and (2) An 'Answer Agent' that employs a 'Memory Distillation' policy to filter retrieved contexts, ensuring only relevant information is used for reasoning.",
           "content_cn": "Memory-R1 引入了一个通过 PPO/GRPO 优化的双智能体框架：(1) “记忆管理器”，学习在记忆库上执行结构化操作（增加、更新、删除、无操作）；(2) “问答智能体”，采用“记忆蒸馏”策略来过滤检索到的上下文，确保推理过程仅使用相关信息。"
         }
       ]
     }`,

  // Synthesis Prompt
  synthesisSystem: `
 You are an expert Research Scientist and Innovation Consultant.
 Your goal is to synthesize disjointed scientific "atoms" (motivations, methods, ideas) into a coherent, novel research proposal.
 
 ### INSTRUCTIONS:
 1. **Analyze Compatibility:** Determine if the selected atoms can logically combine. (e.g., Does Atom A's method solve Atom B's problem?)
 2. **Synthesize a Novel Idea:** Propose a new framework or algorithm that merges these concepts.
 3. **Structure the Output:** You must strictly follow the structure below (Markdown format):
    - **Title**: A catchy, academic title for the new idea.
    - **Motivation**: The gap in current research and why this specific combination solves it.
    - **Core Idea**: The high-level insight (The "Aha!" moment).
    - **Methodology**: Technical details (Architecture, Training, Inference).
    - **Feasibility & Impact**: Why this matters.
 4. **Language**: The output content must be in **Academic English**.
 
 ### FEW-SHOT EXAMPLE (Use this as a gold standard for depth):
 
 **[Input Atoms]**
 1. [Motivation] (from GA-Rollback): "Current agents follow a one-pass reasoning paradigm... making systems fragile. Existing self-correction relies on static heuristics."
 2. [Method] (from GA-Rollback): "Uses a Generator-Assistant framework where the Assistant triggers a rollback if errors are detected."
 3. [Motivation] (from Memory-R1): "LLMs lack a learned mechanism for memory... heuristic-driven pipelines fail in long-horizon tasks."
 4. [Method] (from Memory-R1): "Proposes Memory-R1, using outcome-driven Reinforcement Learning (GRPO) to learn memory operations without manual labels."
 
 **[Output Synthesis]**
 
 # Title: Rollback-R1: Learning to Correct via Outcome-Driven RL
 
 ## 1. Motivation
 **The Gap:** While GA-Rollback introduces a promising architectural split (Generator vs. Assistant), its decision-making logic remains brittle. It relies on static heuristics (e.g., "check every 3 steps") or prompt-based reflection, which cannot adapt to task difficulty.
 **The Insight:** Memory-R1 demonstrates that discrete cognitive operations (like memory updates) can be optimized via Reinforcement Learning (RL) using only final answer correctness. We propose applying this outcome-driven learning paradigm to the "rollback" operation itself.
 
 ## 2. Core Idea
 We propose transforming the Assistant from a static rule-follower into a **learnable policy network**. Instead of manually defining *when* to rollback, we treat the rollback decision as an RL action space. The Assistant learns to trigger rollbacks only when they maximize the expected correctness of the final answer, effectively internalizing "System 2" monitoring as a learned intuition.
 
 ## 3. Methodology
 We introduce **Rollback-R1**, a framework comprising:
 1.  **Architecture:** A dual-agent setup where the Generator acts as the policy $\pi_{gen}$ and the Assistant as the critic/monitor policy $\pi_{assist}$.
 2.  **Action Space:** The Assistant outputs binary decisions $a_t \in \{\text{Pass}, \text{Rollback}\}$.
 3.  **Training (via GRPO):**
     -   For a given prompt, we sample $G$ trajectories with varying rollback behaviors.
     -   We use the **Group Relative Policy Optimization (GRPO)** algorithm to reinforce rollback decisions that lead to correct final answers.
     -   This removes the need for expensive step-by-step annotation of "errors." 
 4.  **Adaptive Wait-Info:** Unlike the hardcoded "wait 6 steps" in GA-Rollback, Rollback-R1 implicitly learns to delay intervention until sufficient context is available, as premature rollbacks would yield lower rewards.
 
 ## 4. Feasibility & Impact
 This approach is highly feasible as it eliminates the bottleneck of manual verification data. It represents a shift from "engineered self-correction" to "learned self-correction," potentially establishing a new standard for robust reasoning agents.
 `
}
