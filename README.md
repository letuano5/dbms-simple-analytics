# DB Simple Analytics

Dashboard phân tích dữ liệu cho cơ sở dữ liệu mẫu ClassicModels, tích hợp chat AI để truy vấn và khám phá dữ liệu tự nhiên.

## Chức năng

- **Dashboard** — tổng quan các chỉ số kinh doanh
- **Khách hàng** — phân tích và quản lý khách hàng
- **Đơn hàng** — theo dõi và phân tích đơn hàng
- **Bán hàng** — báo cáo doanh thu, bảng pivot
- **Sản phẩm** — phân tích danh mục sản phẩm
- **Chat AI** — hỏi đáp dữ liệu bằng ngôn ngữ tự nhiên (Gemini)

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, ECharts, TanStack Query |
| Backend | FastAPI, SQLAlchemy, aiomysql |
| Database | MySQL (classicmodels) |
| AI | Google Gemini API |

## Cài đặt

### Yêu cầu

- Python 3.11+
- Node.js 18+
- MySQL với database `classicmodels`

### Bước 1 — Cấu hình môi trường

Tạo file `.env` trong thư mục `backend/`:

```env
DATABASE_URL=mysql+aiomysql://user:password@localhost/classicmodels
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGINS=http://localhost:5173
```

### Bước 2 — Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Bước 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Hoặc chạy cả hai cùng lúc bằng script:

```bash
./dev.sh
```

Truy cập ứng dụng tại `http://localhost:5173`.
