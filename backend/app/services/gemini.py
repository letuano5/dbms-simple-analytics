import asyncio
import time
import re
from typing import List, Optional, Tuple, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import google.generativeai as genai
from fastapi import HTTPException

from app.config import settings

PROMPT_TEMPLATE = """Task Overview:
You are a data science expert. Below, you are provided with a database schema and a natural
language question. Your task is to understand the schema and generate a valid SQL query to
answer the question.
Database Engine:
MySQL
Database Schema:
{DATABASE_SCHEMA}
This schema describes the database's structure, including tables, columns, primary keys,
foreign keys, and any relevant relationships or constraints.
Question:
{EVIDENCE}
{QUESTION}
Instructions:
- Make sure you only output the information that is asked in the question. If the question asks for a
specific column, make sure to only include that column in the SELECT clause, nothing more.
- The generated query should return all of the information asked in the question without any
missing or extra information.
- Before generating the final SQL query, please think through the steps of how to write the query.
Output Format:
In your answer, please enclose the generated SQL query in a code block:
```
-- Your SQL query
```

Take a deep breath and think step by step to find the correct SQL query."""


class GeminiKeyManager:
    def __init__(self, keys: List[str]):
        self._keys = keys
        self._index = 0
        self._cooldowns: dict[int, float] = {}
        self._lock = asyncio.Lock()

    async def get_available_key(self) -> Optional[Tuple[int, str]]:
        async with self._lock:
            now = time.time()
            n = len(self._keys)
            for _ in range(n):
                i = self._index % n
                self._index += 1
                if self._cooldowns.get(i, 0) <= now:
                    return (i, self._keys[i])
            return None

    async def mark_cooldown(self, index: int, cooldown_seconds: int = 60):
        async with self._lock:
            self._cooldowns[index] = time.time() + cooldown_seconds

    def status(self) -> List[dict]:
        now = time.time()
        return [
            {
                "index": i,
                "key_hint": f"...{k[-6:]}",
                "cooling_until": max(0, self._cooldowns.get(i, 0) - now),
            }
            for i, k in enumerate(self._keys)
        ]


key_manager = GeminiKeyManager(settings.gemini_keys_list)

_m_schema_cache: Optional[str] = None


async def build_m_schema(db: AsyncSession) -> str:
    global _m_schema_cache
    if _m_schema_cache:
        return _m_schema_cache

    tables_q = await db.execute(text("SHOW TABLES"))
    table_names = [row[0] for row in tables_q.fetchall()]

    fk_q = await db.execute(text("""
        SELECT
            TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY TABLE_NAME, COLUMN_NAME
    """))
    fk_rows = fk_q.fetchall()
    fk_map: dict[str, List[str]] = {}
    for tbl, col, ref_tbl, ref_col in fk_rows:
        fk_map.setdefault(tbl, []).append(f"{tbl}.{col}={ref_tbl}.{ref_col}")

    pk_q = await db.execute(text("""
        SELECT TABLE_NAME, COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND CONSTRAINT_NAME = 'PRIMARY'
        ORDER BY TABLE_NAME, ORDINAL_POSITION
    """))
    pk_rows = pk_q.fetchall()
    pk_map: dict[str, List[str]] = {}
    for tbl, col in pk_rows:
        pk_map.setdefault(tbl, []).append(col)

    lines = [f"【DB_ID】 classicmodels"]
    lines.append("【Schema】")

    for tbl in table_names:
        col_q = await db.execute(text(f"DESCRIBE `{tbl}`"))
        cols = col_q.fetchall()

        sample_q = await db.execute(text(f"SELECT * FROM `{tbl}` LIMIT 3"))
        sample_rows = sample_q.fetchall()
        col_names = [c[0] for c in cols]

        col_defs = []
        for c in cols:
            col_name, col_type = c[0], c[1]
            is_pk = col_name in pk_map.get(tbl, [])

            examples: List[str] = []
            for row in sample_rows:
                val = row[col_names.index(col_name)]
                if val is not None:
                    examples.append(str(val))

            entry = f"({col_name}:{col_type}"
            if is_pk:
                entry += ", Primary Key"
            if examples:
                shown = examples[:3]
                entry += f", Examples: [{', '.join(shown)}]"
            entry += ")"
            col_defs.append(entry)

        lines.append(f"# Table: {tbl}")
        lines.append("[")
        lines.append(",\n".join(col_defs))
        lines.append("]")
        lines.append(f"Sample rows from:`{tbl}`:")
        for row in sample_rows:
            lines.append(", ".join(str(v) if v is not None else "None" for v in row))

    all_fks = []
    for fk_list in fk_map.values():
        all_fks.extend(fk_list)
    if all_fks:
        lines.append("【Foreign keys】")
        lines.append("\n".join(all_fks))

    _m_schema_cache = "\n".join(lines)
    return _m_schema_cache


def _parse_sql(text_response: str) -> str:
    patterns = [
        r"```sql\s*(.*?)\s*```",
        r"```\s*(.*?)\s*```",
    ]
    for pat in patterns:
        m = re.search(pat, text_response, re.DOTALL | re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return text_response.strip()


def _is_safe_sql(sql: str) -> bool:
    upper = sql.upper().strip()
    dangerous = ["DROP", "DELETE", "INSERT", "UPDATE", "CREATE", "ALTER", "TRUNCATE", "GRANT", "REVOKE"]
    for kw in dangerous:
        if re.search(rf"\b{kw}\b", upper):
            return False
    return upper.startswith("SELECT") or upper.startswith("WITH") or upper.startswith("SHOW")


async def _call_gemini(prompt: str) -> str:
    n_keys = len(settings.gemini_keys_list)
    if n_keys == 0:
        raise HTTPException(503, "No Gemini API keys configured.")

    for _ in range(n_keys + 1):
        result = await key_manager.get_available_key()
        if result is None:
            raise HTTPException(503, "All Gemini API keys are on cooldown. Try again later.")

        idx, api_key = result
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)

        try:
            response = await asyncio.to_thread(model.generate_content, prompt)
            return response.text
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "quota" in err_str.lower() or "rate" in err_str.lower():
                await key_manager.mark_cooldown(idx, 60)
                continue
            raise HTTPException(500, f"Gemini API error: {err_str}")

    raise HTTPException(503, "All Gemini API keys exhausted.")


async def text_to_sql_and_execute(
    question: str, db: AsyncSession, evidence: str = ""
) -> dict:
    schema = await build_m_schema(db)
    prompt = PROMPT_TEMPLATE.format(
        DATABASE_SCHEMA=schema,
        EVIDENCE=evidence,
        QUESTION=question,
    )

    raw_response = await _call_gemini(prompt)
    sql = _parse_sql(raw_response)

    if not _is_safe_sql(sql):
        raise HTTPException(400, "Generated SQL contains unsafe operations and was rejected.")

    try:
        result = await db.execute(text(sql))
        columns = list(result.keys())
        raw_rows = result.fetchall()
        rows: List[List[Any]] = []
        for row in raw_rows:
            rows.append([
                float(v) if hasattr(v, "__float__") and not isinstance(v, (int, str, bool)) else v
                for v in row
            ])
    except Exception as e:
        raise HTTPException(400, f"SQL execution error: {str(e)}\n\nGenerated SQL:\n{sql}")

    explanation_lines = raw_response.split("```")[0].strip()

    return {
        "sql": sql,
        "columns": columns,
        "rows": rows,
        "explanation": explanation_lines,
        "row_count": len(rows),
    }
