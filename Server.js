const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const Airtable = require('airtable');
require('dotenv').config({ path: './Airtable.env' }); // טעינת קובץ הסביבה
const jwt = require('jsonwebtoken'); // שימוש ב-JWT ליצירת token (אם תבחר להשתמש בזה)

// הגדרת Airtable
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY, // מפתח ה-API נטען מקובץ הסביבה
});

const base = Airtable.base('appuggqid15O1HHD4'); // ID של הבסיס
const table = base('tblJmrjDAg48kXPyD'); // שם הטבלה שמכילה את המשתמשים
const taskTable = base('tblXR4isrO8LneuRG'); // ה-Table של המשימות

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));


app.post('/api/tasks', async (req, res) => {
  const { taskName, taskDescription, additionalNotes, dueDate, status, user, responsible } = req.body; // כולל המשתמש

  try {
    // יצירת אובייקט משימה שיכלול רק שדות שלא ריקים
    const taskData = {};

    if (taskName) {
      taskData["שם המשימה"] = taskName;
    }
    if (taskDescription) {
      taskData["מהות המשימה"] = taskDescription;
    }
    if (additionalNotes) {
      taskData["הערה נוספת"] = additionalNotes;
    }
    if (dueDate) {
      taskData["תאריך ביצוע אחרון"] = dueDate;
    }
    if (status) {
      taskData["סטטוס"] = status;
    }
    if (user) {
      taskData["user"] = user; // עדכן לשדה הנכון מ-Airtable
    }
    if (responsible) {
       taskData["אחראי"] = responsible; // הוספת האחראי
    }
    // אם לא מילאו אף שדה
    if (Object.keys(taskData).length === 0) {
      return res.status(400).json({ message: 'אין נתונים ליצירת משימה' });
    }

    // יצירת משימה ב-Airtable
    await taskTable.create(taskData);

    res.status(201).json({ message: 'המשימה נוצרה בהצלחה' });
  } catch (err) {
    console.error('שגיאה ביצירת משימה:', err);
    res.status(500).json({ message: 'שגיאה ביצירת משימה' });
  }
});


// שליפת כל המשימות
app.get('/api/tasks', async (req, res) => {
  try {
    const records = await taskTable.select({ view: "Grid view" }).firstPage();
    const tasks = records.map(record => ({
      id: record.id,
      taskName: record.fields["שם המשימה"],
      taskDescription: record.fields["מהות המשימה"],
      additionalNotes: record.fields["הערה נוספת"],
      dueDate: record.fields["תאריך ביצוע אחרון"],
      status: record.fields["סטטוס"],
      user: record.fields["user"] || 'משתמש לא ידוע', // וודא שאתה משתמש בשדה הנכון
      responsible: record.fields["אחראי"] || 'אחראי לא ידוע' // הוספת השדה 'אחראי'
      
    }));
    
    res.status(200).json(tasks);
  } catch (err) {
    console.error('שגיאה בשליפת משימות:', err);
    res.status(500).json({ message: 'שגיאה בשליפת משימות' });
  }
});



// עדכון משימה קיימת
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { taskName, taskDescription, additionalNotes, dueDate, status, responsible } = req.body;

  try {
    // יצירת אובייקט המשימה שיכלול רק שדות שלא ריקים
    const taskData = {};

    if (taskName) taskData["שם המשימה"] = taskName;
    if (taskDescription) taskData["מהות המשימה"] = taskDescription;
    if (additionalNotes) taskData["הערה נוספת"] = additionalNotes;
    if (dueDate) taskData["תאריך ביצוע אחרון"] = dueDate ? new Date(dueDate).toISOString() : null;
    if (status) taskData["סטטוס"] = status;
    if (responsible) taskData["אחראי"] = responsible; // עדכון שדה "אחראי"

    // עדכון המשימה ב-Airtable
    await taskTable.update(id, taskData);

    res.status(200).json({ message: 'המשימה עודכנה בהצלחה' });
  } catch (err) {
    console.error('שגיאה בעדכון משימה:', err);
    res.status(500).json({ message: 'שגיאה בעדכון משימה' });
  }
});

app.post('/api/expenses', async (req, res) => {
  const {
    expenseName = 'הוצאה ללא שם',  // ברירת מחדל במקרה שאין שם להוצאה
    amount = 0,  // ברירת מחדל לסכום אם לא נמסר סכום
    paymentDate,  // שדה תאריך התשלום יכול להיות ריק
    notes = ''  // ברירת מחדל להערות אם לא נמסר
  } = req.body; // קבלת הנתונים מהטופס

  try {
    // יצירת אובייקט הנתונים ל-Airtable
    const expenseData = {
      "שם ההוצאה": expenseName,
      "תשלום": amount,
      "הערות נוספות": notes
    };

    // אם יש תאריך תקף, נוסיף אותו לנתונים. אם לא, לא נשלח את השדה הזה.
    if (paymentDate) {
      expenseData["תאריך התשלום"] = paymentDate;
    }

    // יצירת רשומה חדשה ב-Airtable
    const createdRecord = await base('tbliVD95TJx8bJw30').create(expenseData);

    res.status(201).json({ message: 'ההוצאה נוצרה בהצלחה', createdRecord });
  } catch (err) {
    console.error('שגיאה ביצירת הוצאה:', err);
    res.status(500).json({ message: 'שגיאה ביצירת הוצאה' });
  }
});


// מסלול לשליפת הוצאות חודשיות קבועות
app.get('/api/expenses', async (req, res) => {
  try {
    const records = await base('tbliVD95TJx8bJw30').select({ view: "Grid view" }).firstPage(); // שליפת ההוצאות מ-Airtable
    const expenses = records.map(record => ({
      id: record.id,
      expenseName: record.fields["שם ההוצאה"],
      amount: record.fields["תשלום"],
      paymentDate: record.fields["תאריך התשלום"],
      notes: record.fields["הערות נוספות"]
    }));

    res.status(200).json(expenses);
  } catch (err) {
    console.error('שגיאה בשליפת הוצאות:', err);
    res.status(500).json({ message: 'שגיאה בשליפת הוצאות' });
  }
});

// מסלול לעדכון הוצאות חודשיות קבועות
app.put('/api/expenses/:id', async (req, res) => {
  const { id } = req.params; // מזהה ההוצאה מתוך ה-URL
  const { expenseName, amount, paymentDate, notes } = req.body; // הנתונים שעודכנו בטופס

  try {
    // עדכון הרשומה המתאימה ב-Airtable
    const updatedRecord = await base('tbliVD95TJx8bJw30').update([
      {
        id: id,
        fields: {
          "שם ההוצאה": expenseName,
          "תשלום": amount,
          "תאריך התשלום": paymentDate,
          "הערות נוספות": notes
        },
      }
    ]);

    res.status(200).json({ message: 'ההוצאה עודכנה בהצלחה!', updatedRecord });
  } catch (err) {
    console.error('שגיאה בעדכון הוצאה:', err);
    res.status(500).json({ message: 'שגיאה בעדכון הוצאה' });
  }
});


// יצירת משתמש
// יצירת משתמש
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // בדיקת שם משתמש קיים
    const users = await table.select({ filterByFormula: `username = "${username}"` }).firstPage();
    if (users.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // הצפנת הסיסמא
    const hashedPassword = await bcrypt.hash(password, 10); // הצפנה עם bcrypt

    // יצירת משתמש חדש ב-Airtable
    table.create(
      [
        {
          fields: {
            username: username,
            password: hashedPassword, // שמירת הסיסמה המוצפנת
          },
        },
      ],
      (err, records) => {
        if (err) {
          return res.status(500).json({ message: 'בעיה ביצירת משתמש' });
        }
        res.status(201).json({ message: 'משתמש נוצר בהצלחה' });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'תקלת שרת' });
  }
});



// התחברות משתמש
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const users = await table.select({ filterByFormula: `username = "${username}"` }).firstPage();

    if (users.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = users[0].fields;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // יצירת token עם JWT
    const token = jwt.sign({ username }, 'your_jwt_secret_key', { expiresIn: '1h' });
    
    // החזרת token ושם המשתמש
    return res.status(200).json({ message: 'ההתחברות בוצעה בהצלחה', token, username });
  } catch (err) {
    return res.status(500).json({ message: 'שגיאת שרת במהלך ההתחברות' });
  }
});


// מסלול לשליפת המשימות האישיות מהטבלה הספציפית ב-Airtable
app.get('/api/personal-tasks', async (req, res) => {
  const { username } = req.query; // שליפת שם המשתמש מה-Query Parameters
  
  try {
    // סינון המשימות לפי שם המשתמש
    const records = await base('tblTexbQ5pxJto1U4').select({
      filterByFormula: `user = "${username}"`, // התאמת שם המשתמש
      view: "Grid view"
    }).firstPage();
    
    const tasks = records.map(record => ({
      id: record.id,
      taskName: record.fields["שם המשימה"],
      taskDescription: record.fields["מהות המשימה"],
      additionalNotes: record.fields["הערה נוספת"],
      dueDate: record.fields["תאריך ביצוע אחרון"],
      status: record.fields["סטטוס"],
      user: record.fields["user"], // שם המשתמש
      responsible: record.fields["אחראי"] || 'אחראי לא ידוע'
    }));
    
    res.status(200).json(tasks);
  } catch (err) {
    console.error('שגיאה בשליפת המשימות האישיות:', err);
    res.status(500).json({ message: 'שגיאה בשליפת המשימות האישיות' });
  }
});

// מסלול להוספת משימה אישית חדשה 3
app.post('/api/personal-tasks', async (req, res) => {  // הוספת מילת מפתח async כאן
  const { taskName, taskDescription, additionalNotes, dueDate, status, user } = req.body; // קבלת נתונים מהבקשה

  try {
    console.log('Received task creation 1232request:', req.body); // לוג לנתונים שהתקבלו

    // וידוא שיש שם משתמש ושם משימה
    if (!taskName || !user) {
      console.error('חסר שם משימה');
      return res.status(400).json({ message: 'Task name and user are required' });
    }

    // יצירת אובייקט המשימה ל-Airtable
    const taskData = {
      "שם המשימה": taskName,
      "מהות המשימה": taskDescription,
      "הערה נוספת": additionalNotes || '', // הערות נוספות לא חובה
      "סטטוס": status || 'לא בוצע', // ברירת מחדל לסטטוס
      "user": user, // שם המשתמש שיצר את המשימה
    };

    // רק אם יש תאריך תקף, נוסיף אותו לנתונים שנשלחים ל-Airtable
    if (dueDate) {
      taskData["תאריך ביצוע אחרון"] = dueDate;
    }

    console.log('נתוני המשימה נשמרו בהצלחה:', taskData); // לוג לאובייקט המשימה

    // הוספת המשימה לטבלת המשימות ב-Airtable
    const createdRecord = await base('tblTexbQ5pxJto1U4').create(taskData); // שימוש ב-await מחייב async

    console.log('משימה חדשה נוצרה בהצלחה:', createdRecord);
    res.status(201).json({ message: 'משימה אישית חדשה נוצרה בהצלחה', task: createdRecord });
  } catch (err) {
    console.error('תקלה ביצירת משימה:', err);
    res.status(500).json({ message: 'תקלה ביצירת משימה אישית חדשה' });
  }
});

// מסלול לעדכון משימה אישית קיימת
app.put('/api/personal-tasks/:id', async (req, res) => {
  const { id } = req.params; // קבלת ה-ID של המשימה מהנתיב
  const { taskName, taskDescription, additionalNotes, dueDate, status } = req.body; // קבלת נתונים מהבקשה

  try {
    // יצירת אובייקט המשימה לעדכון
    const taskData = {
      "שם המשימה": taskName,
      "מהות המשימה": taskDescription,
      "הערה נוספת": additionalNotes || '', // הערות נוספות לא חובה
      "סטטוס": status || 'לא בוצע', // ברירת מחדל לסטטוס
    };

    // רק אם יש תאריך תקף, נוסיף אותו לנתונים שנשלחים ל-Airtable
    if (dueDate) {
      taskData["תאריך ביצוע אחרון"] = dueDate;
    }

    console.log('משימה עודכנה בהצלחה:', taskData); // לוג לאובייקט המשימה

    // עדכון המשימה בטבלת המשימות ב-Airtable
    const updatedRecord = await base('tblTexbQ5pxJto1U4').update(id, taskData); // שימוש ב-await מחייב async

    console.log('המשימה עודכנה בהצלחה:', updatedRecord);
    res.status(200).json({ message: 'משימה אישית עודכנה בהצלחה', task: updatedRecord });
  } catch (err) {
    console.error('בעיה בעדכון המשימה:', err);
    res.status(500).json({ message: 'בעיה בעדכון המשימה:' });
  }
});



// מגדיר מסלול כללתי שמחזיר את index.html עבור כל בקשה
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
