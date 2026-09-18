# LINE OA Web Chat — No Database

โปรเจกต์ Demo สำหรับ Requirement:

- Next.js + TypeScript
- ส่งข้อความจาก Web Chat ไป LINE Official Account
- รับข้อความจาก LINE Official Account ผ่าน Webhook
- แสดง LINE User ที่ส่งข้อความ
- เลือก User เพื่อสนทนาและตอบกลับ

## Architecture

LINE User → LINE OA → LINE Webhook → Next.js → Web Chat

Web Chat → Next.js → LINE Push Message API → LINE User

## Important: ไม่มี Database

 Vercel เป็น serverless environment ดังนั้นข้อมูลอาจหายเมื่อ instance ถูก recycle หรือมีการ deploy ใหม่ 

## Setup

ต้องใช้ Node.js 20+


```bash
npm run dev
```

## Security

- ไม่ commit `.env`
- ไม่เปิดเผย Channel Access Token
- Webhook ตรวจสอบ `x-line-signature`
