# LINE OA Web Chat — Redis Database

โปรเจกต์ Demo สำหรับ Requirement:

- Next.js + TypeScript
- ส่งข้อความจาก Web Chat ไป LINE Official Account
- รับข้อความจาก LINE Official Account ผ่าน Webhook
- แสดง LINE User ที่ส่งข้อความ
- เลือก User เพื่อสนทนาและตอบกลับ

## Architecture

LINE User → LINE OA → LINE Webhook → Next.js → Web Chat

Web Chat → Next.js → LINE Push Message API → LINE User

## Important: Redis Database

 ใช้ Redis เก็บข้อมูลประวัติการแชท

## Setup

ต้องใช้ Node.js 20+


```bash
npm run dev
```

## Security

- ไม่ commit `.env`
- ไม่เปิดเผย Channel Access Token
- Webhook ตรวจสอบ `x-line-signature`
