# בחירת תמונה בסיסית של Node.js (גרסה 14 לדוגמה)
FROM node:14

# יצירת תיקיית עבודה בקונטיינר
WORKDIR /app

# העתקת package.json ו-package-lock.json לתוך הקונטיינר
COPY package*.json ./

# התקנת התלויות (dependencies)
RUN npm install

# העתקת שאר קבצי הפרויקט לתוך הקונטיינר
COPY . .

# פתיחת הפורט שבו האפליקציה תרוץ
EXPOSE 3000

# הפקודה להרצת האפליקציה
CMD ["npm", "start"]
