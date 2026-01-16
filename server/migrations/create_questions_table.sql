-- Создание таблицы questions для Supabase PostgreSQL
-- Выполнить в Supabase SQL Editor

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  media_type TEXT,
  media_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);

-- Комментарии к таблице
COMMENT ON TABLE questions IS 'Таблица вопросов для игры "Своя игра"';
COMMENT ON COLUMN questions.category IS 'Категория вопроса';
COMMENT ON COLUMN questions.price IS 'Номинал вопроса (должен быть > 0)';
COMMENT ON COLUMN questions.question IS 'Текст вопроса';
COMMENT ON COLUMN questions.answer IS 'Правильный ответ';
COMMENT ON COLUMN questions.media_type IS 'Тип медиа: image, video, audio или null';
COMMENT ON COLUMN questions.media_url IS 'URL медиа-файла';
