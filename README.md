# 🍻 Party Games

เว็บเกมปาร์ตี้แบบ Static Web App สำหรับเปิดบนมือถือและเล่นด้วยกันในวง

## เกมที่มีในเวอร์ชันนี้

1. 🎲 ลูกเต๋า — เพิ่มลูกเต๋าได้สูงสุด 20 ลูก และมี animation ตอนทอย
2. 🃏 เกมไพ่ — สุ่มไพ่ป๊อก 1 ใบ และรีเซ็ตเพื่อสับสำรับใหม่
3. 🔥 จิ้มนิ้ว — แตะหน้าจอหลายคน ค้าง 3 วินาที แล้วสุ่ม 1 นิ้ว
4. 🃏 ไพ่โดเรม่อน — สุ่มการ์ดคำสั่ง
5. 👑 King Game — สุ่มการ์ด King
6. 🔥 ไพ่คำสั่ง — สุ่มคำสั่งสำหรับวง
7. 🏃 สัตว์วิ่งแข่ง — เลือกสัตว์ 2–10 ตัว ระบบสุ่มระยะ 5/10/15M และสุ่มสนามทุกครั้ง

## โครงสร้างไฟล์

- `index.html` — หน้าเว็บ
- `styles.css` — UI / animation
- `app.js` — logic เกมทั้งหมด
- `README.md` — คู่มือ

## รันในเครื่อง

เปิด `index.html` ได้โดยตรง หรือใช้ VS Code + Live Server

## GitHub

1. สร้าง Repository ใหม่บน GitHub
2. แตกไฟล์ ZIP
3. อัปโหลด `index.html`, `styles.css`, `app.js`, `README.md`
4. Commit / Push

## Vercel

นำ GitHub Repository ไป Import ใน Vercel ได้ทันที เพราะเป็น Static Web App และไม่มี Backend/API ที่ต้องตั้งค่า

Framework Preset: `Other`
Build Command: เว้นว่าง
Output Directory: `.`
Install Command: เว้นว่าง

## หมายเหตุ

เวอร์ชันนี้ตั้งใจทำเป็น Prototype ที่เล่นได้จริงแบบ Client-side:
- ไม่มี Login
- ไม่มี Database
- ไม่มี API
- ไม่มีการเก็บข้อมูลผู้เล่น
- รีเฟรชหน้าแล้วสถานะเกมจะเริ่มใหม่

สำหรับไพ่โดเรม่อน / King / ไพ่คำสั่ง สามารถแก้รายการการ์ดได้จากตัวแปรด้านบนของ `app.js`
