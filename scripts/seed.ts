import { supabaseAdmin } from '../api/lib/supabase-admin.js';

const seedData = async () => {
  console.log('Start seeding...');

  // 1. Attention is All You Need
  const paper1 = {
    arxiv_id: '1706.03762',
    title: 'Attention Is All You Need',
    pdf_url: 'https://arxiv.org/pdf/1706.03762.pdf',
    raw_text_summary: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...',
    is_processed: true
  };

  const { data: p1, error: e1 } = await supabaseAdmin.from('papers').upsert(paper1, { onConflict: 'arxiv_id' }).select().single();
  if (e1) console.error('Error inserting paper 1:', e1);
  else {
    const atoms1 = [
      { paper_id: p1.id, type: 'Motivation', content_en: 'Recurrent neural networks (RNNs) process data sequentially, which precludes parallelization within training examples, becoming critical at longer sequence lengths.', content_cn: 'RNN 顺序处理数据导致无法并行计算，在长序列中尤为严重。' },
      { paper_id: p1.id, type: 'Idea', content_en: 'The Transformer, a model architecture eschewing recurrence and relying entirely on an attention mechanism to draw global dependencies between input and output.', content_cn: 'Transformer 架构完全抛弃循环，仅依赖注意力机制来获取输入输出的全局依赖。' },
      { paper_id: p1.id, type: 'Method', content_en: 'We propose Multi-Head Attention, which allows the model to jointly attend to information from different representation subspaces at different positions.', content_cn: '提出多头注意力机制，允许模型同时关注来自不同位置的不同表示子空间的信息。' }
    ];
    await supabaseAdmin.from('research_atoms').insert(atoms1);
    console.log('Inserted atoms for Paper 1');
  }

  // 2. ResNet
  const paper2 = {
    arxiv_id: '1512.03385',
    title: 'Deep Residual Learning for Image Recognition',
    pdf_url: 'https://arxiv.org/pdf/1512.03385.pdf',
    raw_text_summary: 'Deeper neural networks are more difficult to train...',
    is_processed: true
  };

  const { data: p2, error: e2 } = await supabaseAdmin.from('papers').upsert(paper2, { onConflict: 'arxiv_id' }).select().single();
  if (e2) console.error('Error inserting paper 2:', e2);
  else {
    const atoms2 = [
      { paper_id: p2.id, type: 'Motivation', content_en: 'When deeper networks are able to start converging, a degradation problem has been exposed: with the network depth increasing, accuracy gets saturated and then degrades rapidly.', content_cn: '网络加深会导致退化问题：准确率饱和并迅速下降。' },
      { paper_id: p2.id, type: 'Idea', content_en: 'Deep Residual Learning framework. Instead of hoping each few stacked layers directly fit a desired underlying mapping, we explicitly let these layers fit a residual mapping.', content_cn: '深度残差学习框架。让层去拟合残差映射，而不是直接拟合底层映射。' },
      { paper_id: p2.id, type: 'Method', content_en: 'We introduce a deep residual learning framework. Formally, denoting the desired underlying mapping as H(x), we let the stacked nonlinear layers fit another mapping of F(x) := H(x) - x.', content_cn: '引入残差学习框架，让堆叠的非线性层拟合 F(x) = H(x) - x。' }
    ];
    await supabaseAdmin.from('research_atoms').insert(atoms2);
    console.log('Inserted atoms for Paper 2');
  }

  // 3. BERT
  const paper3 = {
    arxiv_id: '1810.04805',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    pdf_url: 'https://arxiv.org/pdf/1810.04805.pdf',
    raw_text_summary: 'We introduce a new language representation model called BERT...',
    is_processed: true
  };

  const { data: p3, error: e3 } = await supabaseAdmin.from('papers').upsert(paper3, { onConflict: 'arxiv_id' }).select().single();
  if (e3) console.error('Error inserting paper 3:', e3);
  else {
    const atoms3 = [
      { paper_id: p3.id, type: 'Motivation', content_en: 'Standard language models are unidirectional, which limits the choice of architectures that can be used during pre-training.', content_cn: '标准语言模型是单向的，限制了预训练时的架构选择。' },
      { paper_id: p3.id, type: 'Idea', content_en: 'BERT (Bidirectional Encoder Representations from Transformers) is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.', content_cn: 'BERT 通过联合调节所有层中的左右上下文，从无标签文本中预训练深度双向表示。' },
      { paper_id: p3.id, type: 'Method', content_en: 'Masked LM (MLM). We randomly mask some of the tokens from the input, and the objective is to predict the original vocabulary id of the masked word based only on its context.', content_cn: '掩码语言模型 (MLM)。随机掩盖输入中的部分 token，目标是仅根据上下文预测被掩盖词的原始 ID。' }
    ];
    await supabaseAdmin.from('research_atoms').insert(atoms3);
    console.log('Inserted atoms for Paper 3');
  }

  console.log('Seeding completed!');
};

seedData();
