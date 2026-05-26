// src/db/queries/article.ts

import { getDb, persistDb, nowDate, nowTime } from "@/db/db";
import type { Article, SaveArticlePayload } from "@/types/db";

export function saveArticle(
  payload: SaveArticlePayload & { personName: string; personEmail: string; source: string }
): number {
  const db = getDb();

  const countResult = db.exec("SELECT MAX(articleNumber) as mx FROM Article");
  const max = countResult[0]?.values[0]?.[0] as number | null;
  const articleNumber = (max ?? 0) + 1;

  db.run(
    `INSERT INTO Article (
      articleTitle, articleContent, articleDate, articleTime,
      personName, personEmail, source, articleNumber,
      isProviderUseGivenSetOfInfo, category, articleBasisReference, isDraft
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      payload.articleTitle,
      payload.articleContent,
      nowDate(),
      nowTime(),
      payload.personName,
      payload.personEmail,
      payload.source,
      articleNumber,
      payload.isProviderUseGivenSetOfInfo,
      payload.category,
      payload.articleBasisReference,
      payload.isDraft,
    ]
  );

  const result = db.exec("SELECT last_insert_rowid() as id");
  const id = result[0]?.values[0]?.[0] as number;

  persistDb();
  return id;
}

export function getAllArticles(): Article[] {
  const db = getDb();
  const result = db.exec(
    `SELECT id, articleTitle, articleContent, articleDate, articleTime,
            personName, personEmail, source, articleNumber,
            isProviderUseGivenSetOfInfo, category, articleBasisReference, isDraft
     FROM Article
     ORDER BY articleDate DESC, articleTime DESC`
  );
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((c, i) => { obj[c] = row[i]; });
    return obj as unknown as Article;
  });
}

export function getArticleById(id: number): Article | null {
  const db = getDb();
  const result = db.exec(
    `SELECT id, articleTitle, articleContent, articleDate, articleTime,
            personName, personEmail, source, articleNumber,
            isProviderUseGivenSetOfInfo, category, articleBasisReference, isDraft
     FROM Article WHERE id = ?`,
    [id]
  );
  if (!result.length || !result[0].values.length) return null;
  const cols = result[0].columns;
  const row = result[0].values[0];
  const obj: Record<string, unknown> = {};
  cols.forEach((c, i) => { obj[c] = row[i]; });
  return obj as unknown as Article;
}

export function deleteArticle(id: number): void {
  const db = getDb();
  db.run(`DELETE FROM Article WHERE id = ?`, [id]);
  persistDb();
}
