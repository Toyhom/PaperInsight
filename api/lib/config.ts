import dotenv from 'dotenv';
dotenv.config();

export const AppConfig = {
  env: process.env.NODE_ENV || 'development',
  
  // Model Config
  llm: {
    extractor: {
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL,
      modelName: process.env.EXTRACTOR_MODEL_NAME || 'gpt-3.5-turbo',
    },
    synthesizer: {
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL,
      modelName: process.env.SYNTHESIZER_MODEL_NAME || 'gpt-4',
    }
  },
  
  // Crawler Config
  crawler: {
    cronSecret: process.env.CRON_SECRET,
  },

  // Supabase (Service Role for Admin)
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}
